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

Async<HttpResponse> ClientController::getFile(std::string file_id, std::string session_id)
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


	try {
		Query q = Queries::GetFile(file_id, uid);
		boost::mysql::results results = co_await this->db.runQuery(q);


		auto rows = results.rows();

		if (rows.empty())
			co_return Helpers::makeResponse(http::status::not_found, "file not found");

		std::string path = rows[0][0].as_string();
		std::string content_type = rows[0][1].as_string();
		std::string creator_id = rows[0][2].as_string();

		co_return Helpers::makeResponse(http::status::ok, "file found", "", { {"path", path}, {"content_type", content_type}, {"creator_id", creator_id} });


	}
	catch (boost::system::system_error& e)
	{
		std::cerr << "Database query failed " << e.what() << std::endl;
		co_return Helpers::makeResponse(http::status::internal_server_error, "internal server error");
	}

}

Async<HttpResponse> ClientController::getFileMetadata(std::string file_id, std::string session_id, json::object& obj)
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


	std::unordered_map<std::string, std::string> allowed_fields = {
		{"path", "file.path"},
		{"content_type", "file.content_type"},
		{"size", "file.size"},
		{"name", "file.name"},
		{"extention", "file.extention"},
		{"favourite", "file.favourite"},
		{"inTrash", "file.inTrash"}
	};

	std::vector<std::string> fields;

	try {
		fields = Helpers::getFields(obj, allowed_fields);
	}
	catch (std::exception& e)
	{
		co_return Helpers::makeResponse(http::status::not_found, e.what());
	}

	try {
		json::object response_obj = co_await Helpers::getGeneralData(Queries::GetFileMetadata(file_id, uid, fields), this->db);

		co_return Helpers::makeResponse(http::status::ok, "file found", "", response_obj);
	}
	catch (boost::system::system_error& e)
	{
		co_return Helpers::makeResponse(http::status::internal_server_error, "internal server error");
	}
	catch (std::exception& e)
	{
		co_return Helpers::makeResponse(http::status::not_found, e.what());
	}

}


Async<HttpResponse> ClientController::getProfilePhoto(std::string session_id)
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



	co_return Helpers::makeResponse(http::status::ok, "file found", "", { {"path", uid + ".png"}, {"content_type", "image/png"} });

}

Async<HttpResponse> ClientController::getUserData(json::object& obj, std::string session_id)
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


	std::unordered_map<std::string, std::string> allowed_fields = {
		{"username", "user.username"},
		{"email", "user.email"},
		{"join_date", "user.join_date"}
	};

	std::vector<std::string> fields;

	try {
		fields = Helpers::getFields(obj, allowed_fields);
	}
	catch (std::exception& e)
	{
		co_return Helpers::makeResponse(http::status::not_found, e.what());
	}

	try {
		json::object response_obj = co_await Helpers::getGeneralData(Queries::getGeneralUserData(fields, uid), this->db);

		co_return Helpers::makeResponse(http::status::ok, "user found", "", response_obj);
	}
	catch (boost::system::system_error& e)
	{
		co_return Helpers::makeResponse(http::status::internal_server_error, "internal server error");
	}
	catch (std::exception& e)
	{
		co_return Helpers::makeResponse(http::status::not_found, e.what());
	}


}


Async<HttpResponse> ClientController::handleRequest(http::verb method, std::string_view target, std::string body, std::string session_id)
{

	json::object obj;

	if (!body.empty())
	{
		json::value json_value = json::parse(body);
		if (!json_value.is_object())
			co_return Helpers::makeResponse(http::status::bad_request, "expected a json object");

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

		else if (target == "/get_user_data")
			co_return co_await this->getUserData(obj, session_id);

		else if (target == "/upload_folder")
			co_return co_await this->uploadFolder(obj, session_id);

		else if (target.starts_with("/get_file_metadata"))
		{
			auto pos = target.find("?file_id=");
			if (pos == std::string::npos)
				co_return Helpers::makeResponse(http::status::bad_request, "missing file id");

			co_return co_await this->getFileMetadata(std::string(target.substr(pos + 9)), session_id, obj);
		}
	}
	else if (method == http::verb::get)
	{
		if (target.starts_with("/get_file"))
		{
			auto pos = target.find("?file_id=");
			if (pos == std::string::npos)
				co_return Helpers::makeResponse(http::status::bad_request, "missing file id");

			co_return co_await this->getFile(std::string(target.substr(pos + 9)), session_id);
		}
		else if (target == "/get_profile_photo")
		{
			co_return co_await this->getProfilePhoto(session_id);
		}
	}

	co_return Helpers::makeResponse(http::status::not_found, "unexistent endpoint");

}

Async<HttpResponse> ClientController::handleRequest(http::verb method, std::string_view target, std::vector<uint8_t> body, std::string session_id)
{
	if (method == http::verb::post)
	{
		if (target == "/upload_photo")
			co_return co_await this->uploadFile(body, session_id, "/profile_photos");
		
		else if (target.starts_with("/upload_file"))
		{
			if (target.find("?folder_id=") != std::string::npos) {
				std::string folder_id = std::string(target).substr(target.find("?folder_id=") + 11);
				co_return co_await this->uploadFile(body, session_id, "/files", folder_id);
			}
			co_return co_await this->uploadFile(body, session_id, "/files");
		}

	}
}