#pragma once
#include <boost/beast/http.hpp>
#include <boost/mysql.hpp>
#include <boost/json.hpp>
#include <string>
#include <vector>

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

struct FileData
{
	std::string content;
	std::string filename;
	std::string content_type;
	std::string path;
	std::string extention;
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
		obj["extention"] = extention;
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
	std::string type;
	std::string path;


	operator json::object() const {
		json::object obj;

		obj["folder_id"] = folder_id;
		obj["parent_folder_id"] = parent_folder_id.empty() ? json::value(nullptr) : json::value(parent_folder_id);
		obj["creator_id"] = creator_id;
		obj["name"] = folder_name;
		obj["path"] = path;
		obj["type"] = type;

		return obj;
	}
};