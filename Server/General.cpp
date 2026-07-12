#include "ClientController.h"
#include "Helpers.h"

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


	std::vector<std::string> fields;

	try {
		fields = Helpers::getFields(obj, {
			{"username", "user.username"},
			{"email", "user.email"},
			{"join_date", "user.join_date"},
			{"preferences", "user.preferences"}
			});
	}
	catch (std::exception& e)
	{
		co_return Helpers::makeResponse(http::status::not_found, e.what());
	}

	try {
		json::object response_obj = co_await Helpers::getGeneralData(Queries::getGeneralUserData(fields, uid), this->db);
		co_return Helpers::makeResponse(http::status::ok, "User found", "", response_obj);
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


Async<HttpResponse> ClientController::getUserFiles(json::object& obj, std::string session_id)
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


	std::vector<std::string> file_fields, folder_fields;

	try {
		file_fields = Helpers::getFields(obj, {
			{"path", "file.path"},
			{"content_type", "file.content_type"},
			{"size", "file.size"},
			{"name", "file.name"},
			{"extention", "file.extention"},
			{"favourite", "file.favourite"},
			{"inTrash", "file.inTrash"}
			}, "file_fields");

		folder_fields = Helpers::getFields(obj, {
			{"path", "folder.path"},
			{"content_type", "folder.content_type"},
			{"size", "folder.size"},
			{"name", "folder.name"},
			{"color", "folder.color"},
			{"favourite", "folder.favourite"},
			{"inTrash", "folder.inTrash"}
			}, "folder_fields");

	}
	catch (std::exception& e)
	{
		co_return Helpers::makeResponse(http::status::not_found, e.what());
	}

	try {
		json::object file_obj = co_await Helpers::getGeneralData(Queries::GetUserFiles(file_fields, "file", uid), this->db);
		json::object folder_obj = co_await Helpers::getGeneralData(Queries::GetUserFiles(folder_fields, "folder", uid), this->db);

		json::object result;
		result["files"] = file_obj;
		result["folders"] = folder_obj;

		co_return Helpers::makeResponse(http::status::ok, "Files found", "", result);
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


Async<HttpResponse> ClientController::changeData(json::object& obj, std::string session_id, std::string entity)
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

	std::string id = "", id_column="";
	if (entity.starts_with("/"))
		id = entity.substr(entity.find("/", 1) + 1);

	if (entity != "/user")
		id_column = "creator_id"; // i have to change this

	try {
		co_await this->db.runQuery(Queries::UpdateUser(obj, uid, entity.substr(1), id_column, id));
	}
	catch (boost::system::system_error& e)
	{
		std::cout << "Failed updating: " << e.what();
		co_return Helpers::makeResponse(http::status::internal_server_error, "Failed updating db");
	}

}