#pragma once
#include <boost/json.hpp>
#include "Structs.h"
#include "DatabaseController.h"

#include <string>
#include <fstream>
#include <filesystem>
#include <iostream>
#include <vector>

namespace json = boost::json;

template <typename T>
using Async = boost::asio::awaitable<T>;

namespace Helpers
{
	void writeToFile(std::string path, FileData const& filedata);
	FileData parseBody(std::vector<uint8_t>& body);
	HttpResponse makeResponse(http::status status, std::string message, std::string session_id = "", json::object additional = {});

	std::vector<std::string> getFields(json::object&, const std::unordered_map<std::string, std::string> & = {});
	Async<json::object> getGeneralData(Query, DatabaseController&);

	void removeFiles(std::vector<std::string>, std::string);

};