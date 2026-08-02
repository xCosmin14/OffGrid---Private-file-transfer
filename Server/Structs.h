#pragma once
#include <boost/beast/http.hpp>
#include <boost/mysql.hpp>
#include <boost/json.hpp>
#include <boost/beast/websocket.hpp>
#include <boost/asio/experimental/channel.hpp>

#include "PieceTable.h"

#include <string>
#include <vector>
#include <unordered_set>
#include <chrono>

namespace http = boost::beast::http;
namespace mysql = boost::mysql;
namespace json = boost::json;

struct Query {
	std::string query;
	std::vector<mysql::field> params;
};

struct MapEntry
{
	std::string uid;
	std::shared_ptr<boost::beast::websocket::stream<boost::asio::ip::tcp::socket>> ws;

	std::string device_id;
	std::string OS;


	MapEntry() = default;

	MapEntry(std::string id, std::string device, std::string os)
	{
		this->uid = id; this->device_id = device; this->OS = os;
	}
};

struct FileMapEntry
{
	std::string user_id;
	std::vector<std::string> file_paths;
	int current_file;
	std::vector<Query> preparedQueries;
	std::vector<std::string> folder_ids;

	std::chrono::steady_clock::time_point created;

	FileMapEntry() = default;
	FileMapEntry(std::string uid, std::vector<std::string> file_paths) :
		file_paths(file_paths), user_id(uid), created(std::chrono::steady_clock::now())
	{
		current_file = 0;
	}
};

struct HttpResponse
{
	http::status status_code;
	std::string json;
	std::string session_id;
};

struct FileData
{
	std::string content;
	std::string filename;
	std::string path;
	std::string content_type;
	std::string extension;
	size_t size;
	std::string file_id = "";
	std::string folder_id = "";
	std::string creator_id = "";

	operator json::object() const {
		json::object obj;

		obj["file_id"] = file_id;
		obj["folder_id"] = folder_id.empty() ? json::value(nullptr) : json::value(folder_id);
		obj["creator_id"] = creator_id;
		obj["name"] = filename;
		obj["extension"] = extension;
		obj["path"] = path;
		obj["size"] = static_cast<int64_t>(size);
		obj["content_type"] = content_type;

		return obj;
	}
};


struct FolderData
{
	std::string folder_id;
	std::string parent_folder_id;
	std::string creator_id;
	std::string folder_name;
	std::string path;

	operator json::object() const {
		json::object obj;

		obj["folder_id"] = folder_id;
		obj["parent_folder_id"] = parent_folder_id.empty() ? json::value(nullptr) : json::value(parent_folder_id);
		obj["creator_id"] = creator_id;
		obj["name"] = folder_name;
		obj["path"] = path;

		return obj;
	}
};

struct WsSession
{
	std::shared_ptr<boost::beast::websocket::stream<boost::asio::ip::tcp::socket>> ws;
	std::string uid;
	std::shared_ptr<boost::asio::experimental::channel<void(boost::system::error_code)>> write_lock;


	WsSession(std::shared_ptr<boost::beast::websocket::stream<boost::asio::ip::tcp::socket>> ws, std::string uid)
		: ws(ws), uid(uid)
	{
		write_lock = std::make_shared<boost::asio::experimental::channel<void(boost::system::error_code)>>(ws->get_executor(), 1);
		write_lock->try_send(boost::system::error_code{});
	}
};



struct Op
{
	std::string type;
	int position;
	std::string text;
	int length = 0;


	Op() = default;

	Op(const json::object& obj)
	{
		this->type == json::value_to<std::string>(obj.at("operation"));
		this->position = json::value_to<int>(obj.at("position"));

		if (obj.at("operation") == "delete")
			this->length = json::value_to<int>(obj.at("length"));
		else
			this->text = json::value_to<std::string>(obj.at("text"));
	}

	operator json::object() const
	{
		json::object obj;
		obj["operation"] = this->type;
		obj["position"] = this->position;

		if (this->type == "delete")
			obj["length"] = this->length;
		else
			obj["text"] = this->text;

		return obj;
	}

	
};

struct ViewersMapEntry
{
	int current_version = 0;
	std::unordered_set<std::shared_ptr<WsSession>> viewers;
	std::vector<Op> history;
	PieceTable content;
	std::string file_path;
	std::string owner_uid;
};


class Notification
{
	json::object obj;

public:

	Notification(std::string type, std::string entity, std::string entity_id, std::string folder_name = "")
	{	
		obj["type"] = type;
		obj["entity_id"] = entity_id;
		obj["folder_name"] = folder_name;
		obj["entity"] = entity;
	}

	void addUsername(std::string username)
	{
		obj["sender_username"] = username;
	}

	json::object getObject()
	{
		return this->obj;
	}
};