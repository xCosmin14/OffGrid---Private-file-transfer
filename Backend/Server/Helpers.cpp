#include "Helpers.h"

void Helpers::writeToFile(std::string path, FileData const& filedata)
{
	std::ofstream file(path, std::ios::binary);
	file.exceptions(std::ofstream::badbit | std::ofstream::failbit);

	try {
		file.write(filedata.content.data(), filedata.content.size());
		file.close();
	}
	catch (std::exception& e)
	{
		std::cerr << "Failed writing to file:" << e.what() << std::endl;
		throw;
	}
}

FileData Helpers::parseBody(std::vector<uint8_t>& body)
{
	std::string body_str(body.begin(), body.end());
	auto header = body_str.find("\r\n\r\n");

	if (header == std::string::npos)
		throw std::runtime_error("invalid multipart body");


	std::string header_section = body_str.substr(0, header);


	std::string filename = "unknown_file", path = "unknown";
	auto filename_pos = header_section.find("filename=\"");


	if (filename_pos != std::string::npos && filename_pos < header)
	{
		auto start = filename_pos + 10;
		auto end = body_str.find("\"", start);

		if (end != std::string::npos && end < header)
		{
			std::string raw_path = body_str.substr(start, end - start);

			std::filesystem::path p(raw_path);

			filename = p.filename().string();
			path = p.parent_path().string();
		}

	}

	std::string content_type = "application/octet-stream";
	auto type_pos = header_section.find("Content-Type: ");
	if (type_pos != std::string::npos)
	{
		auto start = type_pos + 14;
		auto end = header_section.find("\r\n", start);
		if (end == std::string::npos) {
			end = header_section.size();
		}
		content_type = header_section.substr(start, end - start);
	}

	auto data_start = header + 4;
	auto data_end = body_str.rfind("\r\n--");

	if (data_end == std::string::npos || data_end <= data_start)
		data_end = body_str.size();

	std::string content = body_str.substr(data_start, data_end - data_start);
	size_t size = content.size();

	auto pos = filename.find_first_of(".");
	std::string extention = "unknown extension";
	if (pos != std::string::npos)
		extention = filename.substr(pos + 1);

	return { content, filename, content_type, path, extention, size };
}


HttpResponse Helpers::makeResponse(http::status status, std::string message, std::string session_id, json::object additional)
{
	json::object response;
	response["status"] = (status == http::status::ok) ? "success" : "error";
	response["message"] = message;

	for (auto& it : additional)
	{
		response[it.key()] = it.value();
	}

	return HttpResponse(status, json::serialize(response), session_id);
}