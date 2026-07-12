#include "ClientController.h"
#include "Queries.h"
#include "Structs.h"
#include "Helpers.h"
#include "Crypto.h"

#include <filesystem>

Async<HttpResponse> ClientController::registerUser(json::object& obj)
{

	std::string uid = this->createId("user");
	std::string session_id = this->createId("session");
	obj["uid"] = uid;

	if (!obj.contains("password") || !obj.at("password").is_string())
		co_return Helpers::makeResponse(http::status::conflict, "Password not provided");


	mysql::diagnostics diag;

	try {
		obj["password"] = co_await Crypto::hashPasswordAsync(obj.at("password").as_string().c_str());

		Query query1 = Queries::InsertUserQuery(obj);
		Query query2 = Queries::CreateSessionQuery(session_id, uid);

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
	catch (std::exception& e)
	{
		std::cerr << "Registration failed: " << e.what() << std::endl;
		co_return Helpers::makeResponse(http::status::internal_server_error, "internal server error");
	}
}

Async<HttpResponse> ClientController::loginUser(json::object& obj)
{
	if (!obj.contains("email"))
		co_return Helpers::makeResponse(http::status::conflict, "email not provided");
	if (!obj.contains("password"))
		co_return Helpers::makeResponse(http::status::conflict, "password not provided");

		Query password_query = Queries::SelectPassword(obj);

		try {
			boost::mysql::results results = co_await this->db.runQuery(password_query);
			auto rows = results.rows();

			if (rows.empty())
				co_return Helpers::makeResponse(http::status::not_found, "email not found");

			std::string user_password = rows[0][1].as_string();
			std::string uid = rows[0][0].as_string();

			if (obj.contains("password")) {
				if (!co_await Crypto::verifyPasswordAsync(obj["password"].as_string().c_str(), user_password))
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


Async<HttpResponse> ClientController::changeUsername(json::object& obj, std::string session_id)
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


	if (!obj.contains("username") || !obj.at("username").is_string())
		co_return Helpers::makeResponse(http::status::bad_request, "missing username");

	if (!obj.contains("password") || !obj.at("password").is_string())
		co_return Helpers::makeResponse(http::status::bad_request, "missing password");

	std::string newname = json::value_to<std::string>(obj.at("username"));
	try {
		mysql::results results = co_await this->db.runQuery(Queries::SelectPasswordByUid(uid));
		auto rows = results.rows();

		if (rows.empty()) 
			co_return Helpers::makeResponse(http::status::conflict, "user not found");

		std::string user_password = rows[0][0].as_string();
		if (! co_await Crypto::verifyPasswordAsync(obj["password"].as_string().c_str(), user_password))
			co_return Helpers::makeResponse(http::status::conflict, "incorrect password");

		co_await this->db.runQuery(Queries::ChangeUsername(newname, uid));
	}
	catch (boost::system::system_error& e)
	{
		if (e.code() == boost::mysql::common_server_errc::er_dup_entry)
			co_return Helpers::makeResponse(http::status::conflict, "duplicate username");

		std::cout << "Failed query: " << e.what() << std::endl;
		co_return Helpers::makeResponse(http::status::internal_server_error, "failed changing username");
	}

	co_return Helpers::makeResponse(http::status::ok, "username changed successfuly");
}


Async<HttpResponse> ClientController::changePassword(json::object& obj, std::string session_id)
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

	if (!obj.contains("current_password") || !obj.at("current_password").is_string())
		co_return Helpers::makeResponse(http::status::bad_request, "missing current password");

	if (!obj.contains("new_password") || !obj.at("new_password").is_string())
		co_return Helpers::makeResponse(http::status::bad_request, "missing new password");

	try {
		mysql::results results = co_await this->db.runQuery(Queries::SelectPasswordByUid(uid));
		auto rows = results.rows();
		if (rows.empty())
			co_return Helpers::makeResponse(http::status::bad_request, "password not found");

		std::string user_password = rows[0][0].as_string();

		if (! co_await Crypto::verifyPasswordAsync(obj["current_password"].as_string().c_str(), user_password))
			co_return Helpers::makeResponse(http::status::conflict, "incorrect password");

		std::string newPass = json::value_to<std::string>(obj.at("new_password"));
		co_await this->db.runQuery(Queries::ChangePassword(newPass, uid));
	}
	catch (boost::system::system_error& e)
	{
		std::cout << "Failed query: " << e.what() << std::endl;
		co_return Helpers::makeResponse(http::status::internal_server_error, "failed changing password");
	}

	co_return Helpers::makeResponse(http::status::ok, "password changed successfuly");
}
