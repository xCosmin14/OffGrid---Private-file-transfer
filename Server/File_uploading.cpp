#include "ClientController.h"
#include "Helpers.h"

#include <boost/asio/post.hpp>

#include <fstream>
#include <filesystem>

#include <set>

Async<std::pair<std::vector<std::string>, std::string>> ClientController::appendFolders(std::vector<Query>& queries, const std::vector<std::string>& paths, std::string uid, std::string transaction_id)
{
	std::unordered_map<std::string, std::string> existingFolders;
	std::set<std::string> folders_set;

	try {
		mysql::results results = co_await this->db.runQuery(Queries::GetUserFolders(uid));
		for (const auto& row : results.rows())
		{
			if (!row.at(0).is_string() || !row.at(1).is_string()) continue;

			std::string folder_id = row.at(0).as_string();
			std::string path = row.at(1).as_string();

			existingFolders[path] = folder_id;
			folders_set.insert(path);
		}
	}
	catch (boost::system::system_error& e)
	{
		std::cerr << "Failed loading existing folders: " << e.what() << std::endl;
	}

	std::vector<std::string> ids(paths.size(), "");
	std::string root_folder_id;

	for (int i = 0; i < paths.size(); i++)
	{
		std::string path = paths[i];
		int start = 0;
		auto pos = path.find_first_of("/");
		std::string deepest_folder_id = "";
		bool first_segment = true;


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

				if (first_segment && root_folder_id.empty())
					root_folder_id = fd.folder_id;
				first_segment = false;
			}
			start = path.find_first_not_of("/", pos + 1);
			if (start == std::string::npos) break;
			pos = path.find_first_of("/", start);
		}
		ids[i] = deepest_folder_id;
	}

	co_return std::make_pair(ids, root_folder_id);
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
		co_return co_await this->UpdateDb(queries_to_run, transaction_id, uid, filedata.file_id);

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

	try {

		std::vector<std::string> paths = Helpers::getFields(obj);
		std::string transaction_id = this->createId("transaction");


		FileMapEntry local_entry(uid, paths);
		auto [folder_ids, root_folder_id] = co_await this->appendFolders(local_entry.preparedQueries, local_entry.file_paths, uid, transaction_id);
		local_entry.folder_ids = folder_ids;

		{
			std::unique_lock lock(files_mutex);
			this->files_cache[transaction_id] = std::move(local_entry);
		}

		json::object res;
		res["transaction_id"] = transaction_id;
		res["folder_id"] = root_folder_id;
		co_return Helpers::makeResponse(http::status::ok, "ready to receive files", "", res);
	}
	catch (boost::system::system_error& e)
	{
		std::cerr << "Query failed: " << e.what() << std::endl;
		co_return Helpers::makeResponse(http::status::internal_server_error, "internal server error");
	}
	catch (std::exception& e)
	{
		std::cerr << "Failed uploading folder: " << e.what() << std::endl;
		co_return Helpers::makeResponse(http::status::bad_request, e.what());
	}

}


Async<HttpResponse> ClientController::deleteFile(std::string entity, std::string entity_id, std::string session_id)
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

	try {
		Query q;
		if (entity == "file") q = Queries::GetFile(entity_id, uid);
		else q = Queries::GetFolder(entity_id, uid);

		mysql::results results = co_await this->db.runQuery(q);
		auto rows = results.rows();
		if(rows.empty())
			co_return Helpers::makeResponse(http::status::unauthorized, entity + " does not belong to the user");

		std::string path = "";
		if(rows[0][0].is_string())
			path = rows[0][0].as_string();

		mysql::results delete_results = co_await this->db.runQuery(Queries::DeleteFile_(entity_id, entity, uid));

		if(delete_results.affected_rows() == 0)
			co_return Helpers::makeResponse(http::status::not_found, "not found or access denied");


		if(path.empty())
			std::cout << "No " + entity + " to delete from the disk";
		else {
			std::filesystem::path full_path = "FileSystem/files/" + uid + "/" + path;
			std::error_code err;

			if (!path.empty()) {
				if (entity == "file") std::filesystem::remove(full_path, err);
				else if (entity == "folder") std::filesystem::remove_all(full_path, err);

				if (err)
					std::cerr << "Failed removing " << entity << " from disk: " << full_path << " (" << err.message() << ")" << std::endl;
			}
		}

	}
	catch (boost::system::system_error& e)
	{
		std::cout << "Failed query: " << e.what() << std::endl;
		co_return Helpers::makeResponse(http::status::internal_server_error, "internal server error");
	}
	catch (std::exception& e)
	{
		std::cerr << "error: " << e.what() << std::endl;

	}
	co_return Helpers::makeResponse(http::status::ok, entity + " deleted successfuly");

}
