
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


	std::string filename = "unknown_file";
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
	if(pos != std::string::npos)
		extention = filename.substr(pos + 1);

	return { content, filename, content_type, extention, size };
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


std::vector<std::string> Helpers::getFields(json::object& obj, const std::unordered_map<std::string, std::string>& allowed_fields)
{
	std::vector<std::string> fields;

	if (obj.contains("fields") && obj["fields"].is_array())
	{
		const json::array& fields_array = obj["fields"].as_array();
		for (auto const& it : fields_array)
		{
			if (!it.is_string())
				throw std::runtime_error("unkown field");

			std::string name = it.as_string().c_str();
			if (allowed_fields.empty())
			{
				fields.push_back(name);
			}
			else {
				auto found = allowed_fields.find(name);

				if (found == allowed_fields.end())
					throw std::runtime_error("unkown field");
				else
					fields.push_back(found->second);
			}
		}
	}

	return fields;
}

Async<json::object> Helpers::getGeneralData(Query q, DatabaseController& db)
{
	

	try {
		boost::mysql::results results = co_await db.runQuery(q);


		auto rows = results.rows();

		if (rows.empty())
			throw std::runtime_error("not found");


		json::object response_obj;
		for (int i = 0; i < rows[0].size(); i++)
		{
			std::string column = results.meta()[i].column_name();
			auto value = rows[0][i];

			if (value.is_null()) response_obj[column] = nullptr;
			else if (value.is_string()) response_obj[column] = value.as_string();
			else if (value.is_int64()) response_obj[column] = value.as_int64();
		}

		co_return response_obj;


	}
	catch (boost::system::system_error& e)
	{
		std::cerr << "Database query failed " << e.what() << std::endl;
		throw;
	}
}