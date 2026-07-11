#include "ClientController.h"
#include "Helpers.h"

#include <boost/asio/post.hpp>

#include <fstream>
#include <filesystem>

#include <set>

std::vector<std::string> ClientController::appendFolders(std::vector<Query>& queries, const std::vector<std::string>& paths, std::string uid, std::string transaction_id)
{
	std::unordered_map<std::string, std::string> existingFolders;

	std::set<std::string> folders_set;
	std::vector<std::string> ids(paths.size(), "");

	for (int i = 0; i < paths.size(); i++)
	{
		std::string path = paths[i];
		int start = 0;
		auto pos = path.find_first_of("/");

		std::string deepest_folder_id = "";

		while (pos != std::string::npos)
		{
			if (start != pos)
			{
				FolderData fd;
				std::string folder_name = path.substr(start, pos - start);
				std::string full_path = path.substr(0, pos);

				fd.folder_name = folder_name;
				fd.creator_id = uid;

				auto [it, exists] = folders_set.insert(full_path);

				if (!exists) {
					deepest_folder_id = existingFolders[full_path];
				}
				else {
					FolderData fd;
					fd.folder_name = folder_name;
					fd.creator_id = uid;
					fd.path = full_path;
					fd.folder_id = this->createId("folder");

					if (start == 0) {
						fd.parent_folder_id = "";
					}
					else {
						size_t last = full_path.find_last_of("/");
						std::string parent = full_path.substr(0, last);
						auto pit = existingFolders.find(parent);
						fd.parent_folder_id = (pit == existingFolders.end()) ? "" : pit->second;
					}

					existingFolders[full_path] = fd.folder_id;
					deepest_folder_id = fd.folder_id;

					queries.push_back(Queries::InsertFolder(fd));
				}


			}

			start = path.find_first_not_of("/", pos + 1);
			if (start == std::string::npos) break;
			pos = path.find_first_of("/", start);
		}

		ids[i] = deepest_folder_id;

	}

	return ids;

}

Async<HttpResponse> ClientController::cancelFolderUpload(std::string transaction_id, std::string session_id)
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

	std::vector<std::string> paths;
	{
		std::unique_lock lock(files_mutex);

		auto it = files_cache.find(transaction_id);

		if (it == files_cache.end() || it->second.user_id != uid)
			co_return Helpers::makeResponse(http::status::unauthorized, "unauthorized");

		paths = it->second.file_paths;
		files_cache.erase(it);
	}

	Helpers::removeFiles(paths, uid);

	co_return Helpers::makeResponse(http::status::ok, "Upload cancelled successfuly");
}


Async<HttpResponse> ClientController::uploadFile(std::vector<uint8_t>& body, std::string session_id, std::string subfolder, std::string transaction_id)
{
	std::string uid;
	std::exception_ptr error;

	try {
		uid = this->getUserId(session_id);
	}
	catch (std::exception& e)
	{
		std::cout << e.what();
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

	bool isLastFile = false;
	std::vector<Query> queries_to_run;

	if (subfolder == "/files") {
		filedata.file_id = this->createId("file");
		filedata.creator_id = uid;


		if (transaction_id != "") {

			std::unique_lock lock(files_mutex);

			auto it = files_cache.find(transaction_id);
			if (it == files_cache.end() || it->second.user_id != uid)
				co_return Helpers::makeResponse(http::status::unauthorized, "unauthorized");


			FileMapEntry& entry = it->second;

			if (entry.current_file == entry.file_paths.size())
				co_return Helpers::makeResponse(http::status::conflict, "file count does not match the one saved");

			filedata.path = entry.file_paths[entry.current_file];
			filedata.folder_id = entry.folder_ids[entry.current_file];
			entry.current_file++;


			entry.preparedQueries.push_back(Queries::InsertFile(filedata));

			if (entry.current_file == entry.file_paths.size()) {
				isLastFile = true;
				queries_to_run = std::move(entry.preparedQueries);
			}
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
		std::string final_rel_path = filedata.path.empty() ? filedata.filename : filedata.path;
		std::filesystem::path full_target_path = "FileSystem/files/" + uid + "/" + final_rel_path;

		std::filesystem::create_directories(full_target_path.parent_path());
		path = full_target_path.string();
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

			Query q = Queries::InsertFile(filedata);
			co_await this->db.runQuery(q);
		}
		catch (boost::system::system_error& e)
		{
			std::cerr << "Failed updating the database: " << e.what() << std::endl;
			std::filesystem::remove(path);
			co_return Helpers::makeResponse(http::status::internal_server_error, "failed uploading file");
		}
	}

	if (isLastFile)
		co_return co_await this->UpdateDb(queries_to_run, transaction_id, uid);

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

	FileMapEntry local_entry(uid, paths);
	local_entry.folder_ids = this->appendFolders(local_entry.preparedQueries, local_entry.file_paths, uid, transaction_id);

	{
		std::unique_lock lock(files_mutex);
		this->files_cache[transaction_id] = std::move(local_entry);
	}

	json::object res;
	FileMapEntry* entry;
	res["transaction_id"] = transaction_id;


	co_return Helpers::makeResponse(http::status::ok, "ready to receive files", "", res);
}