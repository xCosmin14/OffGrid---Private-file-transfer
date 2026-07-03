#include "ClientController.h"
#include "Helpers.h"

#include <fstream>
#include <filesystem>


Async<HttpResponse> ClientController::uploadFile(std::vector<uint8_t>& body, std::string session_id, std::string subfolder)
{
	std::string uid;
	std::exception_ptr error;

	try {
		uid = this->getUserId(session_id);
	}
	catch (std::exception& e)
	{
		error = std::current_exception();
	}

	if (error)
		co_return Helpers::makeResponse(http::status::unauthorized, "unauthorized");


	FileData filedata;
	try {
		filedata = Helpers::parseBody(body);
	}
	catch (std::runtime_error& e)
	{
		co_return Helpers::makeResponse(http::status::bad_request, "invalid multipart body");
	}

	if (subfolder == "/files") {
		filedata.file_id = this->createId("file");
		filedata.creator_id = uid;
	}

	std::string path;
	if (subfolder == "/profile_photos")
	{
		std::filesystem::create_directories("FileSystem/profile_photos");
		path = "FileSystem/profile_photos/" + uid + ".png";

	}
	else if (subfolder == "/files")
	{
		std::filesystem::create_directories("FileSystem/files/" + uid);
		path = "FileSystem/files/" + uid + "/" + filedata.filename;
	}

	try {
		Helpers::writeToFile(path, filedata);

		std::filesystem::permissions(path,
			std::filesystem::perms::owner_exec | std::filesystem::perms::group_exec |
			std::filesystem::perms::others_exec, std::filesystem::perm_options::remove);
	}
	catch (std::exception& e)
	{
		std::cerr << "Failed writing to file: " << e.what() << std::endl;
		co_return Helpers::makeResponse(http::status::internal_server_error, "failed uploading file");
	}

	if (subfolder == "/files") {
		try {
			if (filedata.path == "")
				filedata.path = filedata.filename;
			else
				filedata.path += "/" + filedata.filename;

			Query q = Queries::insertFile(filedata);
			co_await this->db.runQuery(q);
		}
		catch (boost::system::system_error& e)
		{
			std::cerr << "Failed updating the database: " << e.what() << std::endl;
			std::filesystem::remove(path);
			co_return Helpers::makeResponse(http::status::internal_server_error, "failed uploading file");
		}
	}

	co_return Helpers::makeResponse(http::status::ok, "file uploaded successfuly", "", { { "file_id", filedata.file_id } });
}


Async<HttpResponse> ClientController::uploadFolder(std::vector<uint8_t>& body, std::string session_id)
{

	std::string uid;
	std::exception_ptr error;

	try {
		uid = this->getUserId(session_id);
	}
	catch (std::exception& e)
	{
		error = std::current_exception();
	}

	if (error)
		co_return Helpers::makeResponse(http::status::unauthorized, "unauthorized");


	std::string body_str(body.begin(), body.end());

	size_t first_newline = body_str.find("\r\n");

	if (first_newline == std::string::npos)
		co_return Helpers::makeResponse(http::status::bad_request, "invalid body");


	std::string boundary = body_str.substr(0, first_newline);

	size_t start = first_newline + 2;

	std::unordered_map<std::string, std::string> folder_cache;
	std::vector<Query> queries;
	std::vector<std::string> written_paths;
	std::string root_folder = "";

	while (true)
	{
		size_t pos = body_str.find("\r\n" + boundary, start);

		if (pos == std::string::npos) break;

		std::string file = body_str.substr(start, pos - start);
		std::vector<uint8_t> part(file.begin(), file.end());

		FileData filedata;
		try {
			filedata = Helpers::parseBody(part);
		}
		catch (std::runtime_error& e)
		{
			co_return Helpers::makeResponse(http::status::bad_request, "invalid multipart body");
		}

		std::string parent_folder_id = "";
		if (!filedata.path.empty() && filedata.path != "unknown")
		{
			std::filesystem::path p(filedata.path);
			std::string current_path = "";

			for (auto& it : p)
			{
				current_path += (current_path.empty() ? "" : "/") + it.string();

				if (folder_cache.find(current_path) == folder_cache.end())
				{
					FolderData fd;
					fd.folder_id = createId("folder");
					fd.folder_name = it.string();
					fd.parent_folder_id = parent_folder_id;
					fd.creator_id = uid;
					fd.path = current_path;

					if (root_folder.empty())
						root_folder = fd.folder_id;

					queries.push_back(Queries::insertFolder(fd));

					folder_cache[current_path] = fd.folder_id;
				}

				parent_folder_id = folder_cache[current_path];
			}
		}

		filedata.file_id = createId("file");
		filedata.folder_id = parent_folder_id;
		filedata.creator_id = uid;

		std::string path = "FileSystem/files/" + uid + "/" + filedata.path + "/" + filedata.filename;
		std::filesystem::create_directories("FileSystem/files/" + uid + "/" + filedata.path);

		try {
			Helpers::writeToFile(path, filedata);
		}
		catch (std::exception& e)
		{
			std::cerr << "Failed writing to file:" << e.what() << std::endl;
			co_return Helpers::makeResponse(http::status::internal_server_error, "failed uploading file");
		}


		written_paths.push_back(path);

		if (filedata.path == "")
			filedata.path = filedata.filename;
		else
			filedata.path += "/" + filedata.filename;

		queries.push_back(Queries::insertFile(filedata));


		start = pos + 2 + boundary.length();

		if (body_str.substr(start, 2) == "--") break;

		start += 2;
	}

	mysql::diagnostics diag;
	try {
		co_await this->db.runTransaction(queries, diag);
	}
	catch (boost::system::system_error& e)
	{
		std::cerr << "Transaction failed: " << e.what() << std::endl;

		for (auto& p : written_paths)
			std::filesystem::remove(p);

		co_return Helpers::makeResponse(http::status::internal_server_error, "failed uploading folder");
	}

	co_return Helpers::makeResponse(http::status::ok, "folder uploaded successfuly", "", { { "folder_id", root_folder} });

}
