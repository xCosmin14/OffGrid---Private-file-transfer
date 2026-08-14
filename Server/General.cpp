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
		json::array response_arr = co_await Helpers::getGeneralData(Queries::getGeneralUserData(fields, uid), this->db);
		json::object response_obj = response_arr[0].as_object();
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
			{"extension", "file.extension"},
			{"favourite", "file.favourite"},
			{"inTrash", "file.inTrash"},
			{"created", "file.created" },
			{"modified", "file.modified" },
			{"owner", "creator.username AS creator_username" }
			}, "file_fields");

		folder_fields = Helpers::getFields(obj, {
			{"path", "folder.path"},
			{"size", "folder.size"},
			{"type", "folder.type"},
			{"name", "folder.name"},
			{"color", "folder.color"},
			{"favourite", "folder.favourite"},
			{"inTrash", "folder.inTrash"},
			{"created", "folder.created" },
			{"modified", "folder.modified" },
			{ "owner", "creator.username AS creator_username" }
			}, "folder_fields");

	}
	catch (std::exception& e)
	{
		co_return Helpers::makeResponse(http::status::not_found, e.what());
	}

	try {
		json::array file_obj = co_await Helpers::getGeneralData(Queries::GetUserFiles(file_fields, "file", uid), this->db, "file_id");
		json::array folder_obj = co_await Helpers::getGeneralData(Queries::GetUserFiles(folder_fields, "folder", uid), this->db, "folder_id");

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
		{"extension", "file.extention"},
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
		json::array response_arr = co_await Helpers::getGeneralData(Queries::GetFileMetadata(file_id, uid, fields), this->db);
		json::object response_obj = response_arr[0].as_object();
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


Async<HttpResponse> ClientController::getProfilePics(std::string session_id)
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
		mysql::results results = co_await this->db.runQuery(Queries::GetFileAccessUsers(uid));

		auto rows = results.rows();


		if (rows.empty()) 
			co_return Helpers::makeResponse(http::status::not_found, "no collaborators found");

		json::array paths;
		json::array usernames;
		for (auto row : rows)
		{
			std::string id = row[0].as_string();
			std::string name = row[1].as_string();
			paths.emplace_back(id + ".png");
			usernames.emplace_back(name);
		}


		co_return Helpers::makeResponse(http::status::ok, "pictures found", "", { {"paths", paths}, {"usernames", usernames}, {"content_type", "image/png"}});


	}
	catch (boost::system::system_error& e)
	{
		std::cerr << "Failed query: " << e.what() << std::endl;
		co_return Helpers::makeResponse(http::status::internal_server_error, "internal server error");

	}

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


	std::unordered_map<std::string, std::unordered_set<std::string>> allowed_fields = {
		{"user", {"preferences"}},
		{"access", {"type"}},
		{"notification", {"type", "seen", "answered", "info", "response"}},
		{"file", {"name", "path", "size", "favourite", "inTrash"}},
		{"folder", {"name", "path", "modified", "color", "favourite", "inTrash"}}
	};

	std::string id = "", id_column = "";

	if (entity.starts_with("access/")) {
		entity = entity.substr(entity.find("/") + 1);
		id_column = entity.substr(0, entity.find("/")) + "_id";
		id = entity.substr(entity.find("/") + 1);
		entity = "access";
		if (id_column != "receiver_id" && id_column != "sender_id")
			co_return Helpers::makeResponse(http::status::bad_request, "unknown id: " + id_column);
	}
	else if(entity != "user"){
		auto pos = entity.find("/");
		if (pos == std::string::npos)
			co_return Helpers::makeResponse(http::status::bad_request, "missing id");

		id = entity.substr(pos + 1);
		entity = entity.substr(0, pos);

		if (entity == "file" || entity == "folder")
			id_column = "creator_id";
		else if (entity == "notification")
			id_column = entity + "_id";
		else 
			co_return Helpers::makeResponse(http::status::bad_request, "unknown entity: " + entity);
	}

	auto entity_fields = allowed_fields.find(entity);
	if (entity_fields == allowed_fields.end())
		co_return Helpers::makeResponse(http::status::bad_request, "unknown entity: " + entity);

	for (auto& it : obj)
	{
		if (!entity_fields->second.count(it.key()))
			co_return Helpers::makeResponse(http::status::bad_request, "unknown field: " + std::string(it.key()));

	}


	try {
		co_await this->db.runQuery(Queries::UpdateUser(obj, uid, entity, id_column, id));
	}
	catch (boost::system::system_error& e)
	{
		std::cout << "Failed updating: " << e.what();
		co_return Helpers::makeResponse(http::status::internal_server_error, "Failed updating db");
	}

	co_return Helpers::makeResponse(http::status::ok, "Updated successfuly");


}



Async<HttpResponse> ClientController::getNotifications(std::string session_id)
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

		json::array results_arr = co_await Helpers::getGeneralData(Queries::GetNotifications(uid), this->db);


		if(results_arr.empty())
			co_return Helpers::makeResponse(http::status::not_found, "no notifications found");
		 
		json::object results;
		results["notifications"] = results_arr;
		co_return Helpers::makeResponse(http::status::ok, "notifications found", "",  results);

	}
	catch (boost::system::system_error& e)
	{
		std::cerr << "Failed query: " << e.what();
		co_return Helpers::makeResponse(http::status::internal_server_error, "internal_server_error");

	}
}


Async<HttpResponse> ClientController::downloadFolder(std::string folder_id, std::string session_id)
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
		mysql::results results = co_await this->db.runQuery(Queries::VerifyFolderId(folder_id, uid));

		auto rows = results.rows();


		if (rows.empty() || !rows[0][0].is_string() || !rows[0][1].is_string())
			co_return Helpers::makeResponse(http::status::not_found, "folder not found");


		co_return Helpers::makeResponse(http::status::ok, "folder found", "",
			{
				{"path", rows[0][0].as_string()},
				{"creator_id", uid},
				{"name", rows[0][1].as_string()},
				{"content_type", "application / zip"}
			});

	}
	catch (boost::system::system_error& e)
	{
		std::cerr << "Failed query: " << e.what();
		co_return Helpers::makeResponse(http::status::internal_server_error, "internal_server_error");
	}
}