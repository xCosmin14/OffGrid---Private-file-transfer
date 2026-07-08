#include "Queries.h"
#include <iostream>

void addFields(std::string& query, json::object const& obj, std::vector<mysql::field>& values, std::string* placeholders = nullptr)
{
	for (auto& it : obj)
	{
		query += std::string(it.key()) + ", ";
		if(placeholders)
			*placeholders += "?, ";

		auto const& val = it.value();

		addParams(values, val);

	}

	query.pop_back(); query.pop_back();
	if (placeholders) {
		placeholders->pop_back(); placeholders->pop_back();
	}
}

Query buildInsert(json::object const& obj, std::string table)
{
	std::string query = "INSERT INTO offgrid_db." + table + "(";


	std::vector<std::string> fields;
	std::vector<mysql::field> values;
	std::string placeholders = "";

	addFields(query, obj, values, &placeholders);

	query += ") VALUES (" + placeholders + ")";

	return { query, values };
}

Query Queries::InsertUserQuery(json::object const& obj)
{
	return buildInsert(obj, "user");
}

Query Queries::CreateSessionQuery(std::string session_id, std::string user_id)
{
	std::string query = "INSERT INTO offgrid_db.session ( session_id, uid, start_time) VALUES (?, ?, NOW())";

	std::vector<mysql::field> values;
	values.emplace_back(session_id);
	values.emplace_back(user_id);

	return { query, values };

}

Query Queries::SelectPassword(json::object const& obj)
{
	std::vector<mysql::field> values;
	values.emplace_back(json::value_to<std::string>(obj.at("email")));
	return { "SELECT uid, password FROM offgrid_db.user WHERE email = ?",  values };

}

Query Queries::EndSessions(std::string uid)
{
	std::vector<mysql::field> values;
	values.emplace_back(uid);
	return { "UPDATE offgrid_db.session SET end_time = NOW() WHERE uid = ?", values };
}

Query Queries::DeleteAccount(std::string uid)
{
	std::vector<mysql::field> values;
	values.emplace_back(uid);
	return { "DELETE FROM offgrid_db.user WHERE uid = ?", values };
}

Query Queries::insertFile(FileData filedata)
{
	return buildInsert(filedata, "file");
}

Query Queries::insertFolder(FolderData folderdata)
{
	return buildInsert(folderdata, "folder");
}

Query Queries::insertAccess(std::string access_id, std::string user_id, std::string granted_by, std::string id, std::string resource)
{
	std::vector<mysql::field> values;

	values.emplace_back(access_id);
	values.emplace_back(user_id);
	values.emplace_back(granted_by);
	values.emplace_back(id);
	
	std::string query = "INSERT INTO offgrid_db.access(access_id, user_id, granted_by, ";

	if (resource == "folder")
		query += "folder_id, ";
	else
		query += "file_id, ";

	query += "granted_at) VALUES(?, ?, ?, ?, NOW())";

	return { query, values };

}

Query Queries::getGeneralUserData(std::vector<std::string> const& vect, std::string uid)
{
	std::string query = "SELECT ";
	std::vector<mysql::field> values;
	values.emplace_back(uid);

	for (auto& it : vect)
	{
		query += it + ", ";
	}

	query.pop_back(); query.pop_back();
	query += " FROM offgrid_db.user WHERE uid = ?";

	return { query, values };
}


Query Queries::GetFile(std::string file_id, std::string uid)
{
	std::vector<mysql::field> values;
	values.emplace_back(file_id); 
	values.emplace_back(uid);
	values.emplace_back(uid);

	std::string query = "SELECT file.path, file.content_type, file.creator_id from offgrid_db.file "
		"LEFT JOIN offgrid_db.access on file.file_id = access.file_id "
		"WHERE file.file_id = ? and (file.creator_id = ? or access.user_id = ?)";

	return { query, values };
}

Query Queries::GetFileMetadata(std::string file_id, std::string uid, std::vector<std::string> fields)
{
	std::vector<mysql::field> values;
	values.emplace_back(file_id);
	values.emplace_back(uid);
	values.emplace_back(uid);

	std::string query = "SELECT "; 
	for (auto& it : fields) {
		query += it + ", ";
	}

	query.pop_back(); query.pop_back();

	query += " from offgrid_db.file "
		"LEFT JOIN offgrid_db.access on file.file_id = access.file_id "
		"WHERE file.file_id = ? and (file.creator_id = ? or access.user_id = ?)";

	return { query, values };
}


Query Queries::GetLoggedUsers()
{
	return { "SELECT session_id, uid FROM offgrid_db.session WHERE end_time is null", {} };
}