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


Async<HttpResponse> ClientController::uploadFile(std::vector<uint8_t>& body, std::string session_id, std::string subfolder)
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
		co_return HttpResponse(http::status::unauthorized, R"({"status":"error", "message":"unauthorized"})", "");


	FileData filedata;
	try {
		filedata = Helpers::parseBody(body);
	}
	catch (std::runtime_error& e)
	{
		co_return HttpResponse(http::status::bad_request, R"({"status":"error", "message":"invalid multipart body"})", "");
	}

	std::string path;
	if (subfolder == "/profile_photos")
	{
		std::filesystem::create_directories("FileSystem/profile_photos");
		path = "FileSystem/profile_photos/" + uid + ".png";

	}
	else if (subfolder == "/files")
	{
		std::filesystem::create_directories("FileSystem/files/" + uid);
		path = "FileSystem/files/" + uid + "/" + filedata.filename;
	}

	try {
		Helpers::writeToFile(path, filedata);
	}
	catch (std::exception& e)
	{
		std::cerr << "Failed writing to file:"<< e.what() << std::endl;
		co_return HttpResponse(http::status::internal_server_error, R"({"status":"error","message":"failed uploading file"})", "");
	}

	co_return HttpResponse(http::status::ok, R"({"status":"success","message":"file uploaded successfuly"})", "");
}


Async<HttpResponse> ClientController::uploadFolder(std::vector<uint8_t>& body, std::string session_id)
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
		co_return HttpResponse(http::status::unauthorized, R"({"status":"error", "message":"unauthorized"})", "");


	std::string body_str(body.begin(), body.end());

	size_t first_newline = body_str.find("\r\n");

	if (first_newline == std::string::npos)
		co_return HttpResponse(http::status::bad_request, R"({"status":"error", "message":"invalid body"})", "");
	
	std::string boundary = body_str.substr(0, first_newline);

	size_t start = first_newline + 2;

	while (true)
	{
		size_t pos = body_str.find("\r\n" + boundary, start);

		if (pos == std::string::npos) break;

		std::string file = body_str.substr(start, pos - start);
		std::vector<uint8_t> part(file.begin(), file.end());

		FileData filedata;
		try {
			filedata = Helpers::parseBody(part);
		}
		catch (std::runtime_error& e)
		{
			co_return HttpResponse(http::status::bad_request, R"({"status":"error", "message":"invalid multipart body"})", "");
		}

		std::string path = "FileSystem/files/" + uid + "/" + filedata.path + "/" + filedata.filename;
		std::filesystem::create_directories("FileSystem/files/" + uid + "/" + filedata.path);

		try {
			Helpers::writeToFile(path, filedata);
		}
		catch (std::exception& e)
		{
			std::cerr << "Failed writing to file:" << e.what() << std::endl;
			co_return HttpResponse(http::status::internal_server_error, R"({"status":"error","message":"failed uploading file"})", "");
		}

		start = pos + 2 + boundary.length();

		if (body_str.substr(start, 2) == "--") break;

		start += 2;
	}

	co_return HttpResponse(http::status::ok, R"({"status":"success","message":"folder uploaded successfuly"})", "");

}


Async<HttpResponse> ClientController::handleRequest(http::verb method, std::string_view target, std::vector<uint8_t> body, std::string session_id)
{
	if (method == http::verb::post)
	{
		if (target == "/upload_photo")
			co_return co_await this->uploadFile(body, session_id, "/profile_photos");
		
		else if (target == "/upload_file")
			co_return co_await this->uploadFile(body, session_id, "/files");

		else if (target == "/upload_folder")
			co_return co_await this->uploadFolder(body, session_id);
	}
}