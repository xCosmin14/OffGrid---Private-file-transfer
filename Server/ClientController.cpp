#include "ClientController.h"
#include "Helpers.h"

#include <fstream>
#include <filesystem>

std::string ClientController::createId(std::string entity)
{
	boost::uuids::random_generator gen;
	boost::uuids::uuid u = gen();
	std::string id = entity[0] + boost::uuids::to_string(u);
	return id;
}

std::string ClientController::getUserId(std::string session_id)
{
	std::string uid;

	{
		std::shared_lock lock(users_mutex);
		auto it = this->loggedUsers.find(session_id);

		if (it == this->loggedUsers.end())
			throw std::runtime_error("unauthorized");

		uid = it->second.uid;
	}

	return uid;
}


Async<HttpResponse> ClientController::UpdateDb(std::vector<Query> queries, std::string transaction_id, std::string uid)
{
	mysql::diagnostics diag;
	try {
		co_await this->db.runTransaction(queries, diag);
		co_return Helpers::makeResponse(http::status::ok, "folder uploaded sucessfuly");
	}
	catch (boost::system::system_error& e)
	{
		std::cerr << "Transaction error: " << e.what() << std::endl;
		std::vector<std::string> paths_to_clean;
		{
			std::unique_lock lock(files_mutex);
			if (files_cache.count(transaction_id))
			{
				paths_to_clean = std::move(this->files_cache[transaction_id].file_paths);
				this->files_cache.erase(transaction_id);
			}

		}

		Helpers::removeFiles(paths_to_clean, uid);

		co_return Helpers::makeResponse(http::status::internal_server_error, "failed uploading folder");
	}
}

Async<HttpResponse> ClientController::createEntity(json::object& obj, std::string session_id, 
	std::unordered_set<std::string> allowed_fields, std::string entity)

{
	std::string uid;
	std::exception_ptr error;
	try {
		uid = this->getUserId(session_id);
	}
	catch (std::exception& e)
	{
		error = std::current_exception();
	}
	if (error)
		co_return Helpers::makeResponse(http::status::unauthorized, "unauthorized");


	for (auto& it : obj)
	{
		if(!allowed_fields.count(it.key()))
			co_return Helpers::makeResponse(http::status::bad_request, "unkown field");

	}

	obj[entity + "_id"] = this->createId(entity);
	obj["creator_id"] = uid;

	try {
		std::string field; Query q;

		if (entity == "file") {
			q = Queries::InsertFile(obj); 
			field = "folder_id";
		}
		else if (entity == "folder") {
			field = "parent_folder_id";
			q = Queries::InsertFolder(obj);
		}
		else throw std::runtime_error("invalid entity");

		if (obj.contains(field) && obj.at(field).is_string())
		{
			std::string folder_id = json::value_to<std::string>(obj.at(field));

			mysql::results results = co_await this->db.runQuery(Queries::VerifyFolderId(folder_id, uid));

			if(results.rows().empty())
				co_return Helpers::makeResponse(http::status::bad_request, "nonexistent parent folder");

		}

		co_await this->db.runQuery(q);
	}
	catch (boost::system::system_error& e)
	{
		std::cout << "Failed query: " << e.what() << std::endl;
		co_return Helpers::makeResponse(http::status::internal_server_error, "failed creating folder");
	}
	catch (std::exception& e)
	{
		std::cout << "Internal error: " << e.what() << std::endl;
		co_return Helpers::makeResponse(http::status::internal_server_error, "failed creating folder");
	}

	co_return Helpers::makeResponse(http::status::ok, "folder created successfuly");
}

Async<void> ClientController::loadLoggedUsers()
{
	try {
		mysql::results results = co_await this->db.runQuery(Queries::GetLoggedUsers());

		std::unique_lock lock(users_mutex);

		for (const auto& row : results.rows())
		{
			std::string session_id = row.at(0).as_string();
			std::string uid = row.at(1).as_string();

			this->loggedUsers[session_id] = MapEntry(uid, "", "");
		}
	}
	catch (boost::system::system_error& e)
	{
		std::cout << "Failed loading logged users: " << e.what() << std::endl;
	}

}