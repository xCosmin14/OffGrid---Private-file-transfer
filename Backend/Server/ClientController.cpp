#include "ClientController.h"
#include "Queries.h"

#include <fstream>
#include <filesystem>

std::string ClientController::createId(std::string entity)
{
	boost::uuids::random_generator gen;
	boost::uuids::uuid u = gen();
	std::string id = boost::uuids::to_string(u) + entity[0];
	return id;
}

Async<HttpResponse> ClientController::registerUser(json::object& obj)
{

	std::string uid = this->createId("user");
	std::string session_id = this->createId("session");
	obj["uid"] = uid;



	Query query1 = Queries::InsertUserQuery(obj);
	Query query2 = Queries::CreateSessionQuery(session_id, uid);

	mysql::diagnostics diag;

	try {

		co_await this->db.runTransaction({ query1, query2 }, diag);


		std::string device_id = obj.contains("device_id") ? json::value_to<std::string>(obj.at("device_id")) : "";
		std::string os = obj.contains("os") ? json::value_to<std::string>(obj.at("os")) : "";

		std::unique_lock lock(users_mutex);
		this->loggedUsers[session_id] = MapEntry(uid, device_id, os);

		co_return HttpResponse(http::status::ok, R"({"status":"success", "message":"user registered"})", session_id);

	}
	catch (boost::system::system_error& e)
	{
		if (e.code() == boost::mysql::common_server_errc::er_dup_entry) {
			std::string errorCode = diag.server_message();

			if (errorCode.find("email") != std::string::npos)
				co_return HttpResponse(http::status::conflict, R"({"status":"error", "message":"duplicate email"})", "");
			else if ((errorCode.find("username") != std::string::npos))
				co_return HttpResponse(http::status::conflict, R"({"status":"error", "message":"duplicate username"})", "");

			co_return HttpResponse(http::status::conflict, R"({"status":"error", "message":"duplicate key"})", "");
		}

		std::cerr << "Database query failed " << e.what() << std::endl;
		co_return HttpResponse(http::status::internal_server_error, R"({"status":"error", "message":"internal server error"})", "");
	}
}

Async<HttpResponse> ClientController::loginUser(json::object& obj)
{
	if (obj.contains("email")) {
		Query password_query = Queries::SelectPassword(obj);

		try {
			boost::mysql::results results = co_await this->db.runQuery(password_query);
			auto rows = results.rows();

			if (rows.empty())
				co_return HttpResponse(http::status::not_found, R"({"status":"error", "message":"email not found"})", "");

			std::string user_password = rows[0][1].as_string();
			std::string uid = rows[0][0].as_string();

			if (obj.contains("password")) {
				if (user_password != obj["password"].as_string())
				{
					co_return HttpResponse(http::status::conflict, R"({"status":"error", "message":"incorrect password"})", "");
				}
				else

				{
					std::string session_id = this->createId("session");
					Query session_query = Queries::CreateSessionQuery(session_id, uid);

					try {
						co_await this->db.runQuery(session_query);

						std::string device_id = obj.contains("device_id") ? json::value_to<std::string>(obj.at("device_id")) : "";
						std::string os = obj.contains("os") ? json::value_to<std::string>(obj.at("os")) : "";

						std::unique_lock lock(users_mutex);
						this->loggedUsers[session_id] = MapEntry(uid, device_id, os);

						co_return HttpResponse(http::status::ok, R"({"status":"success", "message":"user logged in"})", session_id);
					}
					catch (boost::system::system_error& e)
					{
						std::cerr << "Database query failed " << e.what() << std::endl;
						co_return HttpResponse(http::status::internal_server_error, R"({"status":"error", "message":"internal server error"})", "");
					}
				}
			}

		}
		catch (boost::system::system_error& e)
		{
			std::cerr << "Database query failed " << e.what() << std::endl;
			co_return HttpResponse(http::status::internal_server_error, R"({"status":"error", "message":"internal server error"})", "");
		}
	}
}


Async<HttpResponse> ClientController::logoutUser(json::object& obj, std::string current_session_id)
{
	std::string uid;

	{
		std::shared_lock lock(users_mutex);
		auto it = this->loggedUsers.find(current_session_id);
		if (it == this->loggedUsers.end())
			co_return HttpResponse(http::status::unauthorized, R"({"status":"error", "message":"unauthorized"})", "");
		uid = it->second.uid;
	}

	try {
		Query expireSession = Queries::EndSessions(uid);
		co_await this->db.runQuery(expireSession);

		std::unique_lock lock(users_mutex);
		this->loggedUsers.erase(current_session_id);

		co_return HttpResponse(http::status::ok, R"({"status":"success", "message":"user logged out"})", "expired");
	}
	catch (boost::system::system_error& e)
	{
		std::cerr << "Database query failed " << e.what() << std::endl;
		co_return HttpResponse(http::status::internal_server_error, R"({"status":"error", "message":"internal server error"})", "");
	}


}

Async<HttpResponse> ClientController::removeUser(json::object& obj, std::string current_session_id)
{
	std::string uid;

	{
		std::shared_lock lock(users_mutex);
		auto it = this->loggedUsers.find(current_session_id);
		if (it == this->loggedUsers.end())
			co_return HttpResponse(http::status::unauthorized, R"({"status":"error", "message":"unauthorized"})", "");
		uid = it->second.uid;
	}

	try {
		Query delete_acc = Queries::DeleteAccount(uid);
		co_await this->db.runQuery(delete_acc);

		std::unique_lock lock(users_mutex);
		this->loggedUsers.erase(current_session_id);

		co_return HttpResponse(http::status::ok, R"({"status":"success", "message":"user removed"})", "expired");
	}
	catch (boost::system::system_error& e)
	{
		std::cerr << "Database query failed " << e.what() << std::endl;
		co_return HttpResponse(http::status::internal_server_error, R"({"status":"error", "message":"internal server error"})", "");
	}


}

Async<HttpResponse> ClientController::handleRequest(http::verb method, std::string_view target, std::string body, std::string session_id)
{

	json::object obj;

	if (!body.empty())
	{
		json::value json_value = json::parse(body);
		if (!json_value.is_object())
			co_return HttpResponse(http::status::bad_request, R"({"error":"expected a json object"})", "");

		obj = json_value.as_object();

	}

	if (method == http::verb::post)
	{
		if (target == "/register")
			co_return co_await this->registerUser(obj);

		else if (target == "/log_in")
			co_return co_await this->loginUser(obj);

		else if (target == "/log_out")
			co_return co_await this->logoutUser(obj, session_id);

		else if (target == "/delete_account")
			co_return co_await this->removeUser(obj, session_id);
	}

	co_return HttpResponse(http::status::not_found, R"({"status":"error", "message":"unexistent endpoint"})", "");

}

Async<HttpResponse> ClientController::uploadPhoto(std::vector<uint8_t>& body, std::string session_id)
{
	std::string uid;

	{
		std::shared_lock lock(users_mutex);
		auto it = this->loggedUsers.find(session_id);
		if (it == this->loggedUsers.end())
			co_return HttpResponse(http::status::unauthorized, R"({"status":"error", "message":"unauthorized"})", "");
		uid = it->second.uid;
	}

	std::string body_str(body.begin(), body.end());
	auto header = body_str.find("\r\n\r\n");
	std::cout << header << '\n';
	if (header == std::string::npos)
		co_return HttpResponse(http::status::bad_request, R"({"status":"error", "message":"invalid multipart body"})", "");

	auto data_start = header + 4;
	auto data_end = body_str.rfind("\r\n--");

	std::cout << "Start " << data_start << " End: " << data_end << '\n';

	if(data_end == std::string::npos || data_end <= data_start)
		co_return HttpResponse(http::status::bad_request, R"({"status":"error", "message":"invalid multipart body"})" ,"");

	std::filesystem::create_directories("FileSystem/profile_photos");
	std::ofstream file("FileSystem/profile_photos/" + uid + ".png", std::ios::binary);
	file.write(reinterpret_cast<const char*>(body.data() + data_start), data_end - data_start);
	file.close();

	co_return HttpResponse(http::status::ok, R"({"status":"success","message":"photo uploaded successfuly"})", "");
}

Async<HttpResponse> ClientController::handleRequest(http::verb method, std::string_view target, std::vector<uint8_t> body, std::string session_id)
{
	if (method == http::verb::post)
	{
		if (target == "/upload_photo")
		{
			co_return co_await this->uploadPhoto(body, session_id);
		}
	}
}