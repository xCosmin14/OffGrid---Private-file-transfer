#include "ClientController.h"
#include "Helpers.h"

#include <boost/asio/co_spawn.hpp>

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

		/*Notification notif("folder_upload", last_file_id, "folder");
		boost::asio::co_spawn(co_await boost::asio::this_coro::executor,
			this->sendNotifications(notif, uid), boost::asio::detached);*/

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

	std::string folder_id = "", parent_folder_name = "";

	try {
		std::string field; Query q;

		if (entity == "file")  field = "folder_id";
		else if (entity == "folder")  field = "parent_folder_id";
		else throw std::runtime_error("invalid entity");

		if (obj.contains(field) && obj.at(field).is_string())
		{
			folder_id = json::value_to<std::string>(obj.at(field));

			mysql::results results = co_await this->db.runQuery(Queries::VerifyFolderId(folder_id, uid));

			if (results.rows().empty())
				co_return Helpers::makeResponse(http::status::bad_request, "nonexistent parent folder");

			parent_folder_name = results.rows()[0][1].as_string();
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

		if (entity == "file")
		{
			q = Queries::InsertFile(obj);
			Helpers::writeToFile(json::value_to<std::string>(obj["path"]), {});
		}
		else if (entity == "folder")
		{
			q = Queries::InsertFolder(obj);
			std::filesystem::create_directories(json::value_to<std::string>(obj["path"]));
		}

		
	
		co_await this->db.runQuery(q);
	}
	catch (boost::system::system_error& e)
	{
		std::cout << "Failed query: " << e.what() << std::endl;
		std::filesystem::remove_all(json::value_to<std::string>(obj["path"]));
		co_return Helpers::makeResponse(http::status::internal_server_error, "failed creating " + entity);
	}
	catch (std::exception& e)
	{
		std::cout << "Internal error: " << e.what() << std::endl;
		co_return Helpers::makeResponse(http::status::internal_server_error, "failed creating " + entity);
	}

	std::string type = entity + "_creation";

	std::string involvement_id = folder_id.empty() ? json::value_to<std::string>(obj[entity + "_id"]) : folder_id;
	std::string involvement_entity = folder_id.empty() ? entity : "folder";

	Notification notif(type, entity, json::value_to<std::string>(obj[entity + "_id"]), parent_folder_name);

	boost::asio::co_spawn(co_await boost::asio::this_coro::executor,
		this->sendNotifications(notif, uid, involvement_entity, involvement_id), boost::asio::detached);

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


Async<HttpResponse> ClientController::manageAccess(json::object& obj, std::string session_id, std::string action)
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

	if (!obj.contains("resource") || (obj.at("resource")!="file" && obj.at("resource")!="folder"))
		co_return Helpers::makeResponse(http::status::bad_request, "missing resource type");


	if (obj["resource"] == "file") {
		if (!obj.contains("file_id") || !obj.at("file_id").is_string())
			co_return Helpers::makeResponse(http::status::bad_request, "missing file_id");
	}
	else {
		if (!obj.contains("folder_id") || !obj.at("folder_id").is_string())
			co_return Helpers::makeResponse(http::status::bad_request, "missing folder_id");
	}


	std::string username = json::value_to<std::string>(obj.at("username"));
	std::string resource = json::value_to<std::string>(obj.at("resource"));
	std::string file_id = json::value_to<std::string>(obj.at(resource + "_id"));
	std::string type;
	std::string resource_name;

	if (action == "grant") {
		if (!obj.contains("type") || !obj.at("type").is_string())
			co_return Helpers::makeResponse(http::status::bad_request, "missing type");
		type = json::value_to<std::string>(obj.at("type"));

	}


	try {
		Query q; int index;
		if (resource == "file") {
			q = Queries::VerifyFileAccess(file_id, uid);
			index = 2;
		}
		else {
			q = Queries::VerifyFolderId(file_id, uid);
			index = 1;
		}

		mysql::results results = co_await this->db.runQuery(q);

		if(results.rows().empty())
			co_return Helpers::makeResponse(http::status::unauthorized, "file access denied");

		
		resource_name = results.rows()[0][index].as_string();

		mysql::results name_results = co_await this->db.runQuery(Queries::GetUidByUsername(username));

		if (name_results.rows().empty())
			co_return Helpers::makeResponse(http::status::not_found, "user not found");

		std::string other_uid = name_results.rows()[0][0].as_string();

		if (action == "grant") 
			q = Queries::InsertAccess(this->createId("access"), 
								other_uid, uid, file_id, resource, type);
		else
			q = Queries::RevokeAccess(file_id, other_uid, uid, resource);

		co_await this->db.runQuery(q);

		if (resource == "folder")
		{
			mysql::results file_ids = co_await this->db.runQuery(Queries::GetFiles(file_id));

			if (!file_ids.rows().empty())
			{
				for (mysql::row_view row : file_ids.rows())
				{
					std::string current_file_id = row.at(0).as_string();

					if (action == "grant")  q = Queries::InsertAccess(
						this->createId("access"),
						other_uid,
						uid,
						current_file_id,
						"file",
						type
					);
					else q = Queries::RevokeAccess(current_file_id, other_uid, uid, "file");

					co_await this->db.runQuery(q);
				}
			}
		}
	}
	catch (boost::system::system_error& e)
	{
		std::cerr << "Failed query: " << e.what()<<std::endl;
		co_return Helpers::makeResponse(http::status::internal_server_error, "failed " + action + "ing access");

	}

	Notification notif("access_"+ action +"ed", resource, file_id, resource_name);
	boost::asio::co_spawn(co_await boost::asio::this_coro::executor,
		this->sendNotifications(notif, uid, resource, file_id), boost::asio::detached);

	co_return Helpers::makeResponse(http::status::ok, "access " + action + "ed successfuly");

}


void ClientController::addSocket(std::shared_ptr<WsSession> session)
{
	std::unique_lock lock(online_users_mutex);
	online_users[session->uid].insert(session);
}
