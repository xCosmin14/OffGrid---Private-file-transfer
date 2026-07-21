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


	std::string filename = "none", path = "none";
	auto filename_pos = header_section.find("filename=\"");

	if(filename_pos == std::string::npos || filename_pos >= header)
		throw std::runtime_error("missing filename in multipart body");

	else 
	{
		auto start = filename_pos + 10;
		auto end = body_str.find("\"", start);

		if (end != std::string::npos && end < header)
		{
			std::string raw_path = body_str.substr(start, end - start);

			std::filesystem::path p(raw_path);

			filename = p.filename().string();
			path = raw_path.empty() ? filename : raw_path;
			if (path == "") path = filename;
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

	auto pos = filename.find_last_of(".");
	std::string extension = "none";
	if (pos != std::string::npos && pos)
		extension = filename.substr(pos + 1);

	return { content, filename, path, content_type, extension, size };
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


std::vector<std::string> Helpers::getFields(json::object& obj, const std::unordered_map<std::string, std::string>& allowed_fields, std::string key)
{
	std::vector<std::string> fields;

	if (obj.contains(key) && obj[key].is_array())
	{
		if (!obj[key].is_array()) 
			throw std::runtime_error("not given an array");
		
		const json::array& fields_array = obj[key].as_array();
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
					throw std::runtime_error("unkown field: " + name);
				else
					fields.push_back(found->second);
			}
		}

	}

	return fields;
}

Async<json::array> Helpers::getGeneralData(Query q, DatabaseController& db)
{


	try {
		boost::mysql::results results = co_await db.runQuery(q);


		auto rows = results.rows();

		if (rows.empty()) 
			co_return json::array({});

		json::array response_arr;
		for (auto const& row : rows) 
		{
			json::object response_obj;
			for (int i = 0; i < row.size(); i++)
			{
				std::string column = results.meta()[i].column_name();
				auto value = row[i];

				if (value.is_null()) response_obj[column] = nullptr;
				else if (value.is_string()) response_obj[column] = value.as_string();
				else if (value.is_int64()) response_obj[column] = value.as_int64();
				else if (value.is_datetime())
				{
					std::ostringstream oss;
					oss << value.as_datetime();
					response_obj[column] = oss.str();
				}
				else if (value.is_date())
				{
					std::ostringstream oss;
					oss << value.as_date();
					response_obj[column] = oss.str();
				}
				else if (value.is_time())
				{
					std::ostringstream oss;
					oss << value.as_time();
					response_obj[column] = oss.str();
				}

			}
			response_arr.push_back(response_obj);
		}

		co_return response_arr;


	}
	catch (boost::system::system_error& e)
	{
		std::cerr << "Database query failed " << e.what() << std::endl;
		throw;
	}
}

void Helpers::removeFiles(std::vector<std::string> paths_to_clean, std::string uid)
{
	for (const auto& file : paths_to_clean)
	{
		std::filesystem::path full_path = "FileSystem/files/" + uid + "/" + file;

		if (std::filesystem::exists(full_path)) {

			std::filesystem::remove(full_path);

			auto parent = full_path.parent_path();

			while (!parent.empty() && parent != "." && parent != "/" && parent != "FileSystem"
				&& parent != "FileSystem/files" && parent != ("FileSystem/files/" + uid)
				&& std::filesystem::is_empty(parent))
			{

				std::filesystem::remove(parent);
				parent = parent.parent_path();
			}
		}
	}
}


std::string Helpers::extractSessionId(std::string cookie)
{
	if (cookie.empty()) return "";

	std::string key = "session_id=";
	auto pos = cookie.find(key);

	if (pos == std::string::npos) return "";

	auto start = pos + key.size();
	auto end = cookie.find(";", start);

	if (end == std::string::npos)
		return cookie.substr(start);
	else
		return cookie.substr(start, end - start);
}