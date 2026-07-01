#pragma once
#include <boost/beast/http.hpp>
#include <boost/mysql.hpp>
#include <string>
#include <vector>

namespace http = boost::beast::http;
namespace mysql = boost::mysql;


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
	std::string content, filename, content_type, path;
};