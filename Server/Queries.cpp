#include "Queries.h"
#include <iostream>

void addFields(std::string& query, json::object const& obj, std::vector<mysql::field>& values, std::string* placeholders = nullptr, std::string sign = ", ")
{
	for (auto& it : obj)
	{
		query += std::string(it.key()) + sign;
		if (placeholders)
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

	return { query, {mysql::field(session_id), mysql::field(user_id)}};

}

Query Queries::SelectPassword(json::object const& obj)
{
	std::vector<mysql::field> values;
	values.emplace_back(json::value_to<std::string>(obj.at("email")));
	return { "SELECT uid, password FROM offgrid_db.user WHERE email = ?",  values };

}

Query Queries::SelectPasswordByUid(std::string uid)
{
	return { "SELECT password FROM offgrid_db.user WHERE uid = ?", {mysql::field(uid)} };
}

Query Queries::EndSessions(std::string uid)
{
	return { "UPDATE offgrid_db.session SET end_time = NOW() WHERE uid = ?", {mysql::field(uid)}};
}

Query Queries::DeleteAccount(std::string uid)
{
	return { "DELETE FROM offgrid_db.user WHERE uid = ?", {mysql::field(uid)} };
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

	return { query, {mysql::field(access_id), mysql::field(user_id), 
		mysql::field(granted_by), mysql::field(id)}};

}

Query Queries::getGeneralUserData(std::vector<std::string> const& vect, std::string uid)
{
	std::string query = "SELECT ";

	for (auto& it : vect)
	{
		query += it + ", ";
	}

	query.pop_back(); query.pop_back();
	query += " FROM offgrid_db.user WHERE uid = ?";

	return { query, {mysql::field(uid)} };
}


Query Queries::GetUserFiles(std::vector<std::string> const& vect, std::string entity, std::string uid)
{
	if (entity != "file" && entity != "folder")
		throw std::runtime_error("invalid entity");

	std::string q = "SELECT ";

	for (auto& it : vect)
		q += it + ", ";
	q.pop_back(); q.pop_back();

	q += ", " + entity + "." + entity + "_id FROM offgrid_db." + entity + " LEFT JOIN offgrid_db.access ON access." + entity + "_id = " +
		entity + "." + entity + "_id WHERE " + entity + ".creator_id=? or access.user_id=?";

	return { q, {mysql::field(uid), mysql::field(uid)} };
}

Query Queries::GetUserFolders(std::string uid)
{
	return { "SELECT folder_id, path FROM offgrid_db.folder WHERE creator_id = ?", {mysql::field(uid)} };
}

Query Queries::GetFile(std::string file_id, std::string uid)
{
	std::string query = "SELECT file.path, file.content_type, file.creator_id from offgrid_db.file "
		"LEFT JOIN offgrid_db.access on file.file_id = access.file_id "
		"WHERE file.file_id = ? and (file.creator_id = ? or access.user_id = ?)";

	return { query, {
		mysql::field(file_id),
		mysql::field(uid),
		mysql::field(uid) } };
}

Query Queries::GetFolder(std::string folder_id, std::string uid)
{
	std::string query = "SELECT folder.path from offgrid_db.folder "
		"LEFT JOIN offgrid_db.access on folder.folder_id = access.folder_id "
		"WHERE folder.folder_id = ? and (folder.creator_id = ? or access.user_id = ?)";

	return { query, {
		mysql::field(folder_id),
		mysql::field(uid),
		mysql::field(uid) } };
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

	return { query, {
		mysql::field(file_id),
		mysql::field(uid),
		mysql::field(uid) } };
}


Query Queries::GetLoggedUsers()
{
	return { "SELECT session_id, uid FROM offgrid_db.session WHERE end_time is null", {} };
}

Query Queries::ChangeUsername(std::string newusername, std::string uid)
{
	return { "UPDATE offgrid_db.user SET username=? WHERE uid=?", {
		mysql::field(newusername), 
		mysql::field(uid)} 
	};
}


Query Queries::ChangePassword(std::string newpass, std::string uid)
{
	return { "UPDATE offgrid_db.user SET password=? WHERE uid=?", {
		mysql::field(newpass),
		mysql::field(uid)}
	};
}

Query Queries::InsertFile(json::object const& obj)
{
	return buildInsert(obj, "file");
}

Query Queries::InsertFolder(json::object const& obj)
{
	return buildInsert(obj, "folder");
}

Query Queries::VerifyFolderId(std::string id, std::string uid)
{
	return { "SELECT path FROM offgrid_db.folder "
	"LEFT JOIN offgrid_db.access on access.folder_id = folder.folder_id "
	"WHERE folder.folder_id = ? and (folder.creator_id=? or access.user_id=?)", {
	mysql::field(id), mysql::field(uid), mysql::field(uid)} };

}


Query Queries::UpdateUser(json::object const& obj, std::string uid, std::string entity, std::string id_column, std::string entity_id)
{
	std::string query = "UPDATE offgrid_db." + entity;
	std::vector<mysql::field> values;

	if (entity == "user")
	{
		query += " SET ";
		addFields(query, obj, values, nullptr, "=?, ");

		if (query.ends_with(", ")) {
			query.resize(query.length() - 2);
		}

		query += " WHERE user.uid=?";
		values.emplace_back(uid);
	}
	else {
		query += " JOIN user on user.uid = " + entity + "." + id_column;
		query += " SET ";
		addFields(query, obj, values, nullptr, "=?, ");
		values.emplace_back(uid);
		query += " WHERE user.uid=? and " + entity + "." + entity + "_id=?";
		values.emplace_back(entity_id);
	}
	std::cout << query << std::endl;
	for (auto& it : values) std::cout << it << " ";
	return { query, values };
}


Query Queries::DeleteFile_(std::string file_id, std::string entity, std::string uid)
{
	return { "DELETE " + entity + " FROM offgrid_db." + entity +
		" LEFT JOIN offgrid_db.access ON access." + entity + "_id = " + entity + "." + entity + "_id"
		" WHERE " + entity + "." + entity + "_id = ? AND (" + entity + ".creator_id = ? OR (access.user_id = ? AND access.type = 'edit'))",
		{mysql::field(file_id), mysql::field(uid), mysql::field(uid)}};
}
