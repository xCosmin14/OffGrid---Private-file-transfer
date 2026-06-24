#pragma once
#include <boost/beast/http.hpp>
#include <boost/uuid/uuid.hpp>
#include <boost/uuid/uuid_generators.hpp>
#include <boost/uuid/uuid_io.hpp>
#include <boost/json.hpp>
#include <string>
#include <unordered_map>
#include <functional>
#include <iostream>
#include <mutex>

#include "DatabaseController.h"

namespace http = boost::beast::http;
namespace json = boost::json;

template <typename T>
using Async = boost::asio::awaitable<T>;

struct MapEntry
{
	std::string uid;
	std::string device_id;
	std::string OS;

	MapEntry() = default;

	MapEntry(std::string id, std::string device, std::string os)
	{
		this->uid = id; this->device_id = device; this->OS = os;
	}
};

struct HttpResponse
{
	http::status status_code;
	std::string json;
	std::string session_id;
};

class ClientController
{
	std::unordered_map < std::string, MapEntry> loggedUsers; // sesion_id -> {uid, device_id, OS}
	std::shared_mutex users_mutex; // mutex for the loggedUsers map

	DatabaseController& db;

	std::string createId(std::string);

	Async<HttpResponse> registerUser(json::object&);
	Async<HttpResponse> loginUser(json::object&);
	Async<HttpResponse> logoutUser(json::object&, std::string);
	Async<HttpResponse> removeUser(json::object&, std::string);

	Async<HttpResponse> uploadPhoto(std::vector<uint8_t>&, std::string);

public:

	ClientController(DatabaseController& db) :db(db) {}

	Async<HttpResponse> handleRequest(http::verb, std::string_view, std::string, std::string);
	Async<HttpResponse> handleRequest(http::verb, std::string_view, std::vector<uint8_t>, std::string);

};