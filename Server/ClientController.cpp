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


Async<HttpResponse> ClientController::UpdateDb(std::vector<Query> queries, std::string transaction_id, std::string uid, std::string last_file_id)
{
	mysql::diagnostics diag;
	try {
		co_await this->db.runTransaction(queries, diag);
		{
			std::unique_lock lock(files_mutex);
			if (files_cache.count(transaction_id))
			{
				this->files_cache.erase(transaction_id);
			}

		}
		co_return Helpers::makeResponse(http::status::ok, "folder uploaded sucessfuly", "", {{"file_id",last_file_id}});
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


	if (!obj.contains("name") || !obj.at("name").is_string())
		co_return Helpers::makeResponse(http::status::bad_request, "name is required");

	for (auto& it : obj)
	{
		if (!allowed_fields.count(it.key()))
			co_return Helpers::makeResponse(http::status::bad_request, "unkown field: " + (std::string)it.key());

	}

	obj[entity + "_id"] = this->createId(entity);
	obj["creator_id"] = uid;

	try {
		std::string field; Query q;

		if (entity == "file")  field = "folder_id";
		else if (entity == "folder")  field = "parent_folder_id";
		else throw std::runtime_error("invalid entity");

		if (obj.contains(field) && obj.at(field).is_string())
		{
			std::string folder_id = json::value_to<std::string>(obj.at(field));

			mysql::results results = co_await this->db.runQuery(Queries::VerifyFolderId(folder_id, uid));

			if (results.rows().empty())
				co_return Helpers::makeResponse(http::status::bad_request, "nonexistent parent folder");

			auto path_field = results.rows()[0][0];
			std::string path = path_field.is_null() ? "" : path_field.as_string();
			
			std::string name = json::value_to<std::string>(obj.at("name"));
			path = path.empty() ? name : (path + "/" + name);
			

			obj["path"] = path;

		}
		else
		{
			std::string name = json::value_to<std::string>(obj.at("name"));
			obj["path"] = name;
		}

		if (entity == "file") q = Queries::InsertFile(obj);
		else if (entity == "folder") q = Queries::InsertFolder(obj);

		
	
		co_await this->db.runQuery(q);
	}
	catch (boost::system::system_error& e)
	{
		std::cout << "Failed query: " << e.what() << std::endl;
		co_return Helpers::makeResponse(http::status::internal_server_error, "failed creating " + entity);
	}
	catch (std::exception& e)
	{
		std::cout << "Internal error: " << e.what() << std::endl;
		co_return Helpers::makeResponse(http::status::internal_server_error, "failed creating " + entity);
	}

	co_return Helpers::makeResponse(http::status::ok, entity + " created successfuly",
		"", {{entity+"_id", obj[entity + "_id"]}});
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


Async<HttpResponse> ClientController::grandAccess(json::object& obj, std::string session_id)
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


	if (!obj.contains("email") || !obj.at("email").is_string())
		co_return Helpers::makeResponse(http::status::bad_request, "missing email");

	if (!obj.contains("file_id") || !obj.at("file_id").is_string())
		co_return Helpers::makeResponse(http::status::bad_request, "missing file_id");

	if (!obj.contains("resource") || (obj.at("resource")!="file" && obj.at("resource")!="folder"))
		co_return Helpers::makeResponse(http::status::bad_request, "missing resource type");

	if (!obj.contains("type") || !obj.at("type").is_string())
		co_return Helpers::makeResponse(http::status::bad_request, "missing type");


	std::string email = json::value_to<std::string>(obj.at("email"));
	std::string file_id = json::value_to<std::string>(obj.at("file_id"));
	std::string resource = json::value_to<std::string>(obj.at("resource"));
	std::string type = json::value_to<std::string>(obj.at("type"));


	try {
		mysql::results results = co_await this->db.runQuery(Queries::VerifyFileAccess(file_id, uid));

		if(results.rows().empty())
			co_return Helpers::makeResponse(http::status::unauthorized, "file access denied");

		mysql::results email_results = co_await this->db.runQuery(Queries::GetUidByEmail(email));

		if (email_results.rows().empty())
			co_return Helpers::makeResponse(http::status::not_found, "user not found");

		std::string other_uid = email_results.rows()[0][0].as_string();

		co_await this->db.runQuery(Queries::InsertAccess(
			this->createId("access"), other_uid, uid, file_id, resource, type));
	}
	catch (boost::system::system_error& e)
	{
		std::cerr << "Failed query: " << e.what()<<std::endl;
		co_return Helpers::makeResponse(http::status::internal_server_error, "failed granting access");

	}

	co_return Helpers::makeResponse(http::status::ok, "access granted successfuly");

}