#pragma once
#include <boost/beast/http.hpp>
#include <boost/uuid/uuid.hpp>
#include <boost/uuid/uuid_generators.hpp>
#include <boost/uuid/uuid_io.hpp>
#include <boost/beast/websocket.hpp>
#include <boost/json.hpp>

#include <string>
#include <unordered_map>
#include <functional>
#include <iostream>
#include <mutex>
#include <unordered_set>

#include "DatabaseController.h"
#include "Queries.h"
#include "Structs.h"


namespace http = boost::beast::http;
namespace json = boost::json;
namespace websocket = boost::beast::websocket;


template <typename T>
using Async = boost::asio::awaitable<T>;



class ClientController
{
	std::unordered_map < std::string, MapEntry> loggedUsers; // sesion_id -> {uid, device_id, OS}
	std::shared_mutex users_mutex; // mutex for the loggedUsers map


	std::unordered_map<std::string, FileMapEntry> files_cache; // transaction_id -> { path, function to remove from cache }
	std::shared_mutex files_mutex;


	std::unordered_map<std::string, ViewersMapEntry> viewers_map; // file_id -> {ws, uid}
	std::shared_mutex viewers_mutex;


	std::unordered_map<std::string, std::unordered_set<std::shared_ptr<WsSession>>> online_users;
	std::shared_mutex online_users_mutex;


	std::atomic<bool> stop_clean_up{ false };
	std::thread cleaning_thread;

	DatabaseController& db;

	std::string createId(std::string);
	std::string getUserId(std::string);

	Async<HttpResponse> registerUser(json::object&);
	Async<HttpResponse> loginUser(json::object&);
	Async<HttpResponse> logoutUser(json::object&, std::string);
	Async<HttpResponse> removeUser(json::object&, std::string);

	Async<HttpResponse> uploadFile(std::vector<uint8_t>&, std::string, std::string, std::string folder_id = "");
	Async<HttpResponse> uploadFolder(json::object& obj, std::string);

	Async<HttpResponse> deleteFile(std::string, std::string, std::string);

	Async<HttpResponse> getFile(std::string, std::string);
	Async<HttpResponse> getProfilePhoto(std::string);

	Async<HttpResponse> getFileMetadata(std::string, std::string, json::object&);

	Async<HttpResponse> getUserData(json::object&, std::string);
	Async<HttpResponse> getUserFiles(json::object&, std::string);



	Async<HttpResponse> UpdateDb(std::vector<Query>, std::string, std::string, std::string);
	Async<HttpResponse> cancelFolderUpload(std::string, std::string);

	Async<HttpResponse> changeUsername(json::object&, std::string);
	Async<HttpResponse> changePassword(json::object&, std::string);

	Async<HttpResponse> changeData(json::object&, std::string, std::string = "user");

	Async<HttpResponse> createEntity(json::object&, std::string,
		std::unordered_set<std::string>, std::string);


	Async<HttpResponse> grandAccess(json::object&, std::string);

	Async<std::pair<std::vector<std::string>, std::string>> appendFolders(std::vector<Query>&,
		const std::vector<std::string>&, std::string, std::string);


	void cleanUpCache();


	Async<void> handleWatch(std::shared_ptr<WsSession>, std::string, std::string);
	Async<void> handleUnwatch(std::shared_ptr<WsSession>, std::string);
	Async<void> handleModify(std::shared_ptr<WsSession>, json::object, std::string);
	Async<void> handleNotification(std::shared_ptr<WsSession>, json::object);

	Async<void> sendNotifications(Notification, std::string, std::string, std::string);


public:

	ClientController(DatabaseController& db) :db(db) {
		this->cleaning_thread = std::thread(&ClientController::cleanUpCache, this);
	}

	~ClientController()
	{
		this->stop_clean_up = true;

		if (this->cleaning_thread.joinable())
			this->cleaning_thread.join();
	}

	Async<HttpResponse> handleRequest(http::verb, std::string_view, std::string, std::string);
	Async<HttpResponse> handleRequest(http::verb method, std::string_view target, std::vector<uint8_t>& body, std::string session_id);
	Async<void> loadLoggedUsers();

	Async<std::string> isAuthenticated(std::string);
	Async<void> handleWsMessage(std::shared_ptr<WsSession>, json::object&);

	void removeSessionFromAllFiles(std::shared_ptr<WsSession>);

	void addSocket(std::shared_ptr<WsSession>);

};