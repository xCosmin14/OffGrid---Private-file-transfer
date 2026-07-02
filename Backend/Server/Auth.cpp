#include "ClientController.h"
#include "Queries.h"
#include "Structs.h"
#include "Helpers.h"

#include <filesystem>

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

		co_return Helpers::makeResponse(http::status::ok, "user registered", session_id);

	}
	catch (boost::system::system_error& e)
	{
		if (e.code() == boost::mysql::common_server_errc::er_dup_entry) {
			std::string errorCode = diag.server_message();

			if (errorCode.find("email") != std::string::npos)
				co_return Helpers::makeResponse(http::status::conflict, "duplicate email");
			else if ((errorCode.find("username") != std::string::npos))
				co_return Helpers::makeResponse(http::status::conflict, "duplicate username");

			co_return Helpers::makeResponse(http::status::conflict, "duplicate key");
		}

		std::cerr << "Database query failed " << e.what() << std::endl;
		co_return Helpers::makeResponse(http::status::internal_server_error, "internal server error");
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
				co_return Helpers::makeResponse(http::status::not_found, "email not found");

			std::string user_password = rows[0][1].as_string();
			std::string uid = rows[0][0].as_string();

			if (obj.contains("password")) {
				if (user_password != obj["password"].as_string())
					co_return Helpers::makeResponse(http::status::conflict, "incorrect password");
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

						co_return Helpers::makeResponse(http::status::ok, "user logged in", session_id);
					}
					catch (boost::system::system_error& e)
					{
						std::cerr << "Database query failed " << e.what() << std::endl;
						co_return Helpers::makeResponse(http::status::internal_server_error, "internal server error");
					}
				}
			}

		}
		catch (boost::system::system_error& e)
		{
			std::cerr << "Database query failed " << e.what() << std::endl;
			co_return Helpers::makeResponse(http::status::internal_server_error, "internal server error");
		}
	}
}


Async<HttpResponse> ClientController::logoutUser(json::object& obj, std::string current_session_id)
{
	std::string uid;
	std::exception_ptr error;

	try {
		uid = this->getUserId(current_session_id);
	}
	catch (std::exception& e)
	{
		error = std::current_exception();
	}

	if (error)
		co_return Helpers::makeResponse(http::status::unauthorized, "unauthorized");


	try {
		Query expireSession = Queries::EndSessions(uid);
		co_await this->db.runQuery(expireSession);

		std::unique_lock lock(users_mutex);
		this->loggedUsers.erase(current_session_id);

		co_return Helpers::makeResponse(http::status::ok, "user logged out", "expired");
	}
	catch (boost::system::system_error& e)
	{
		std::cerr << "Database query failed " << e.what() << std::endl;
		co_return Helpers::makeResponse(http::status::internal_server_error, "internal server error");
	}


}

Async<HttpResponse> ClientController::removeUser(json::object& obj, std::string current_session_id)
{
	std::string uid;
	std::exception_ptr error;

	try {
		uid = this->getUserId(current_session_id);
	}
	catch (std::exception& e)
	{
		error = std::current_exception();
	}

	if (error)
		co_return Helpers::makeResponse(http::status::unauthorized, "unauthorized");


	try {
		std::filesystem::remove_all("FileSystem/files/" + uid);
		std::filesystem::remove_all("FileSystem/profile_photos" + uid);

		Query delete_acc = Queries::DeleteAccount(uid);
		co_await this->db.runQuery(delete_acc);

		std::unique_lock lock(users_mutex);
		this->loggedUsers.erase(current_session_id);

		co_return Helpers::makeResponse(http::status::ok, "user removed", "expired");
	}
	catch (boost::system::system_error& e)
	{
		std::cerr << "Database query failed " << e.what() << std::endl;
		co_return Helpers::makeResponse(http::status::internal_server_error, "internal server error");
	}


}

