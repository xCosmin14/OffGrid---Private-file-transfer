#include "DatabaseController.h"
#include "Queries.h"
#include "Structs.h"

#include <fstream>

mysql::pool_params getParams()
{
	std::ifstream fin("db_config.json");

	if (!fin.is_open())
		throw std::runtime_error("Failed opening db_config.json");

	std::string content((std::istreambuf_iterator<char>(fin)), std::istreambuf_iterator<char>());
	json::object config = json::parse(content).as_object();

	std::string host = json::value_to<std::string>(config.at("host"));
	int port = (int)config.at("port").as_int64();
	std::string username = json::value_to<std::string>(config.at("user"));
	std::string password = json::value_to<std::string>(config.at("password"));
	std::string database = json::value_to<std::string>(config.at("db_name"));

	mysql::pool_params params;
	params.server_address.emplace_host_and_port("127.0.0.1", 3306);
	params.username = username;
	params.password = password;
	params.database = database;
	params.max_size = 16;

	return params;

}

DatabaseController::DatabaseController(asio::any_io_executor executor)
{
	mysql::pool_params params = getParams();

	pool = std::make_unique<mysql::connection_pool>(executor, std::move(params));
	pool->async_run(asio::detached);
}

mysql::connection_pool& DatabaseController::get_connection()
{
	return *pool;
}

asio::awaitable<mysql::results> DatabaseController::runQuery(Query query)
{

	mysql::results result;

	try {

		mysql::pooled_connection con = co_await pool->async_get_connection(use_awaitable);
		con->set_meta_mode(boost::mysql::metadata_mode::full);

		auto stmt = co_await con->async_prepare_statement(query.query, use_awaitable);

		std::vector<mysql::field_view> fields;
		fields.reserve(query.params.size());
		for (auto& p : query.params)
			fields.emplace_back(p);


		co_await con->async_execute(
			stmt.bind(fields.data(), fields.data() + fields.size()),
			result,
			use_awaitable
		);

	}
	catch (const boost::system::system_error& e)
	{
		throw;
	}
	co_return result;
}

asio::awaitable<mysql::results> DatabaseController::runTransaction(std::vector<Query> queries, mysql::diagnostics& diag) {
	mysql::results results;

	mysql::pooled_connection con = co_await pool->async_get_connection(use_awaitable);

	std::exception_ptr eptr;

	try
	{
		co_await con->async_execute("START TRANSACTION", results, diag, use_awaitable);

		for (auto& query : queries)
		{
			auto stmt = co_await con->async_prepare_statement(query.query, use_awaitable);

			std::vector<boost::mysql::field_view> views(query.params.begin(), query.params.end());
			boost::mysql::field_view* data = views.data();

			co_await con->async_execute(
				stmt.bind(data, data + views.size()),
				results, diag,
				use_awaitable
			);
		}

		co_await con->async_execute("COMMIT", results, diag, use_awaitable);

	}
	catch (...) {
		eptr = std::current_exception();
	}

	if (eptr) {
		try {
			mysql::diagnostics rollback_diag;
			co_await con->async_execute("ROLLBACK", results, rollback_diag, use_awaitable);
			std::cout << "Successfully rolled back" << std::endl;
		}
		catch (...) {}

		std::rethrow_exception(eptr);
	}

	co_return results;
}