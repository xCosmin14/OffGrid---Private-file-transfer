#pragma once
#include "Structs.h"

#include <string>
#include <fstream>
#include <filesystem>
#include <iostream>
#include <vector>

namespace Helpers
{
	void writeToFile(std::string path, FileData const& filedata);
	FileData parseBody(std::vector<uint8_t>& body);
	HttpResponse makeResponse(http::status status, std::string message, std::string session_id = "", json::object additional = {});
};
