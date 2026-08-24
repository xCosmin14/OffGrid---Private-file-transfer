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
	return { "SELECT uid, password, public_key, encrypted_private_key, key_salt FROM offgrid_db.user "
		"WHERE email = ?",  {mysql::field(json::value_to<std::string>(obj.at("email")))} };

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

	std::vector<mysql::field> params = { mysql::field(uid), mysql::field(uid) };

	if (entity != "file" && entity != "folder")
		throw std::runtime_error("invalid entity");

	std::string q = "SELECT ";

	for (auto& it : vect)
		q += it + ", ";
	q.pop_back(); q.pop_back();

	if (entity == "file") {
		q += ", CASE WHEN " + entity + ".creator_id = ? THEN " + entity +
			".owner_fek ELSE access.wrapped_fek END AS fek";
		params.emplace_back(uid);
	}

	q +=", user.username, " + entity + "." + entity + "_id FROM offgrid_db." + entity +
		" LEFT JOIN offgrid_db.access ON access." + entity + "_id = " + entity + "." + entity + "_id"
		" LEFT JOIN offgrid_db.user on user.uid = access.user_id"
		" LEFT JOIN offgrid_db.user as creator on creator.uid = " + entity + ".creator_id"
		" WHERE " + entity + ".creator_id = ? or access.user_id = ? ";

	
	return { q, params};
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
	return { "SELECT path, name FROM offgrid_db.folder "
	"LEFT JOIN offgrid_db.access on access.folder_id = folder.folder_id "
	"WHERE folder.folder_id = ? and (folder.creator_id=? or access.user_id=?)", {
	mysql::field(id), mysql::field(uid), mysql::field(uid)} };

}

Query Queries::VerifyFileAccess(std::string id, std::string uid)
{
	return { "SELECT file.file_id, file.path, file.name FROM offgrid_db.file "
	"LEFT JOIN offgrid_db.access on access.file_id = file.file_id "
	"WHERE file.file_id = ? and (file.creator_id = ? or access.user_id = ?)", {
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
		query += " WHERE user.uid=? and " + entity + "." + entity + "_id = ?";
		values.emplace_back(entity_id);
	}

	return { query, values };
}


Query Queries::DeleteFile_(std::string file_id, std::string entity, std::string uid)
{
	return { "DELETE " + entity + " FROM offgrid_db." + entity +
		" LEFT JOIN offgrid_db.access ON access." + entity + "_id = " + entity + "." + entity + "_id"
		" WHERE " + entity + "." + entity + "_id = ? AND (" + entity + ".creator_id = ? OR (access.user_id = ? AND access.type = 'edit'))",
		{mysql::field(file_id), mysql::field(uid), mysql::field(uid)}};
}


Query Queries::UpdateSession(std::string session_id)
{
	return { "UPDATE offgrid_db.session SET last_active = NOW() WHERE session_id = ?",
		{mysql::field(session_id)} };
}


Query Queries::GetFiles(std::string folder_id)
{
	std::string query =
		"WITH RECURSIVE folder_tree AS ("
		"    SELECT folder_id FROM offgrid_db.folder WHERE folder_id = ? "
		"    UNION ALL "
		"    SELECT f.folder_id "
		"    FROM offgrid_db.folder f "
		"    INNER JOIN folder_tree ft ON f.parent_folder_id = ft.folder_id "
		") "
		"SELECT file_id "
		"CASE WHEN file.creator_id = ? THEN file.owner_fek ELSE access.wrapped_fek END AS fek "
		"FROM offgrid_db.file "
		"WHERE folder_id IN (SELECT folder_id FROM folder_tree)";

	return { query, {mysql::field(folder_id)} };
}

Query Queries::InsertAccess(std::string access_id, std::string user_id, std::string granted_by, 
	std::string id, std::string resource, std::string type, std::string wrapped_fek)
{
	std::string query = "INSERT INTO offgrid_db.access(access_id, user_id, granted_by, ";

	if (resource == "folder")
		query += "folder_id, ";
	else
		query += "file_id, ";

	query += "type, wrapped_fek) VALUES(?, ?, ?, ?, ?, ?)";

	return { query, {mysql::field(access_id), mysql::field(user_id), mysql::field(granted_by), 
		mysql::field(id), mysql::field(type), mysql::field(wrapped_fek)}};

}

Query Queries::RevokeAccess(std::string file_id, std::string target_uid, std::string granter_uid, std::string resource)
{
	return { "DELETE access FROM offgrid_db.access "
	"LEFT JOIN offgrid_db." + resource + " ON " + resource + "." + resource + 
		"_id = access." + resource + "_id "
	"WHERE access." + resource + "_id = ? AND access.user_id = ? AND " + resource + ".creator_id = ?",
	{mysql::field(file_id), mysql::field(target_uid), mysql::field(granter_uid)} };
}


Query Queries::GetUidByUsername(std::string name)
{
	return { "SELECT uid FROM offgrid_db.user WHERE username = ?", {mysql::field(name)} };
}


Query Queries::VerifyFileRights(std::string file_id, std::string uid)
{
	return { "SELECT COALESCE(access.type, 'owner') AS type, file.creator_id "
	"FROM offgrid_db.file "
	"LEFT JOIN offgrid_db.access on access.file_id = file.file_id AND access.user_id = ? "
	"WHERE file.file_id = ? AND (file.creator_id = ? or access.type is not null)",
		{mysql::field(uid), mysql::field(file_id),mysql::field(uid)} };
}


Query Queries::InsertNotification(json::object const& obj)
{
	return buildInsert(obj, "notification");
}


Query Queries::ViewNotification(std::string id, std::string receiver_id)
{
	return { "UPDATE offgrid_db.notification SET seen = 1 "
		"WHERE notification_id = ? AND receiver_id = ?",
		{mysql::field(id), mysql::field(receiver_id)}};
}


Query Queries::AddNotificationResponse(std::string response, std::string id, std::string receiver_id)
{
	return { "UPDATE offgrid_db.notification SET response = ?, answered = NOW() "
	"WHERE notification_id = ? AND receiver_id = ?",
		{mysql::field(response), mysql::field(id), mysql::field(receiver_id) }};
}


Query Queries::GetInvolvedUsers(std::string entity_id, std::string entity)
{
	return { "SELECT " + entity + ".creator_id AS owner_uid, access.user_id AS access_uid "
	"FROM offgrid_db." + entity + " "
	"LEFT JOIN offgrid_db.access ON access." + entity + "_id = " + entity + "." + entity + "_id "
	"WHERE " + entity + "." + entity + "_id = ?",
	{mysql::field(entity_id)} };
}


Query Queries::GetUsername(std::string uid)
{
	return { "SELECT username from offgrid_db.user WHERE uid = ?", {mysql::field(uid)} };
}


Query Queries::GetNotifications(std::string uid)
{
	return { "SELECT notification.notification_id, notification.info, notification.sent, user.username from offgrid_db.notification "
	"JOIN offgrid_db.user on user.uid = notification.sender_id "
	"WHERE notification.receiver_id = ? AND notification.seen = 0", 
		{mysql::field(uid)} };
}

Query Queries::DeleteNotification(std::string uid, std::string notification_id)
{
	return { "DELETE FROM offgrid_db.notification WHERE receiver_id = ? AND notification_id = ?",
		{mysql::field(uid), mysql::field(notification_id)} };
}


Query Queries::GetFileAccessUsers(std::string uid)
{
	return { "SELECT access.user_id, user.username from offgrid_db.access "
		"JOIN offgrid_db.user on user.uid = access.user_id "
		"WHERE access.granted_by = ?", {mysql::field(uid)} };
}


Query Queries::StoreKey(std::string fek, std::string file_id, std::string uid)
{
	return { "UPDATE TABLE offgrid_db.file SET owner_fek = ? "
	"WHERE file_id = ? and creator_id = ?",
		{mysql::field(fek), mysql::field(file_id), mysql::field(uid)} };
}

Query Queries::GetPublicKey(std::string username)
{
	return { "SELECT public_key FROM offgrid_db.user WHERE username = ?",
		{ mysql::field(username) } };
}