#include "Queries.h"


Query Queries::InsertUserQuery(json::object const& obj)
{
	std::string query = "INSERT INTO offgrid_db.user (";


	std::vector<std::string> fields;
	std::vector<mysql::field> values;
	std::string placeholders = "";

	for (auto& it : obj)
	{
		query += std::string(it.key()) + ", ";
		placeholders += "?, ";

		auto const& val = it.value();

		addParams(values, val);

	}

	query.pop_back(); query.pop_back();
	placeholders.pop_back(); placeholders.pop_back();

	query += ") VALUES (" + placeholders + ")";

	return { query, values };
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

Query Queries::insertFile(json::object const& obj)
{
	std::vector<mysql::field> values;
	return { "",values };
}

Query Queries::getGeneralData(std::vector<std::string> const& vect, std::string uid)
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