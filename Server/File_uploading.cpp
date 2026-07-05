#include "ClientController.h"
#include "Helpers.h"

#include <boost/asio/post.hpp>

#include <fstream>
#include <filesystem>


Async<HttpResponse> ClientController::uploadFile(std::vector<uint8_t>& body, std::string session_id, std::string subfolder, std::string transaction_id)
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

		
		if (transaction_id != "") {
			std::unique_lock lock(files_mutex);

			auto it = files_cache.find(transaction_id);
			if(it == files_cache.end() || it->second.user_id != uid)
				co_return Helpers::makeResponse(http::status::unauthorized, "unauthorized");


			FileMapEntry& entry = it->second;

			if (entry.current_file == entry.file_paths.size())
				co_return Helpers::makeResponse(http::status::conflict, "file count does not match the one saved");

			filedata.path = entry.file_paths[entry.current_file];
			entry.current_file++;


			entry.preparedQueries.push_back(Queries::insertFile(filedata));
		}
		

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
		path = "FileSystem/files/" + uid + "/" + filedata.path;
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

	if (subfolder == "/files" && transaction_id == "") {
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


Async<HttpResponse> ClientController::uploadFolder(json::object& obj, std::string session_id)
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

	std::vector<std::string> paths = Helpers::getFields(obj);
	std::string transaction_id = this->createId("transaction");

	{
		std::unique_lock lock(files_mutex);
		this->files_cache[transaction_id] = FileMapEntry(uid, paths);
	}

	json::object res;
	res["transaction_id"] = transaction_id;
	co_return Helpers::makeResponse(http::status::ok, "ready to receive files", "", res);
}
