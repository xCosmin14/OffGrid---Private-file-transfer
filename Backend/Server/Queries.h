#pragma once
#include <boost/json.hpp>
#include <boost/mysql.hpp>
#include <string>

namespace json = boost::json;

void addParams(std::vector<mysql::field>& values, json::value const& val)
{
	if (val.is_string()) values.emplace_back(json::value_to<std::string>(val));
	else if (val.is_int64()) values.emplace_back(std::to_string(val.as_int64()));
	else if (val.is_bool()) values.emplace_back(val.as_bool() ? 1 : 0);
	else if (val.is_null()) values.emplace_back(nullptr);
	else values.emplace_back(json::serialize(val));
}

namespace Queries
{
	Query InsertUserQuery(json::object const& obj)
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

	Query CreateSessionQuery(std::string session_id, std::string user_id)
	{
		std::string query = "INSERT INTO offgrid_db.session ( session_id, uid, start_time) VALUES (?, ?, NOW())";

		std::vector<mysql::field> values;
		values.emplace_back(session_id);
		values.emplace_back(user_id);

		return { query, values };

	}

	Query SelectPassword(json::object const& obj)
	{
		std::vector<mysql::field> values;
		values.emplace_back(json::value_to<std::string>(obj.at("email")));
		return { "SELECT uid, password FROM offgrid_db.user WHERE email = ?",  values };

	}

	Query EndSessions(std::string uid)
	{
		std::vector<mysql::field> values;
		values.emplace_back(uid);
		return { "UPDATE offgrid_db.session SET end_time = NOW() WHERE uid = ?", values };
	}

	Query DeleteAccount(std::string uid)
	{
		std::vector<mysql::field> values;
		values.emplace_back(uid);
		return { "DELETE FROM offgrid_db.user WHERE uid = ?", values };
	}
};

class QueryBuilder
{
	Query finalQuery;
	std::string first_table;

public:

	
	QueryBuilder& insert(std::string table_name, json::object obj)
	{
		finalQuery.query += "INSERT INTO offgrid_db." + table_name + " (";
		std::string placeholders;
		for (auto& it : obj)
		{
			finalQuery.query += std::string(it.key()) + ", ";
			addParams(finalQuery.params, it.value());
			placeholders += "?, ";
		}

		finalQuery.query.pop_back(); finalQuery.query.pop_back();
		placeholders.pop_back(); placeholders.pop_back();
		finalQuery.query += ") VALUES( " + placeholders + ")";

		return *this;

	}


	QueryBuilder& select(std::vector<std::string> fields, std::string table)
	{
		finalQuery.query += "SELECT ";
		for (auto& it : fields)
		{
			finalQuery.query += it;
			finalQuery.query += ", ";
		}
		finalQuery.query.pop_back(); finalQuery.query.pop_back();
		finalQuery.query += " FROM offgrid_db." + table;

		first_table = table;

		return *this;

	}
	
	QueryBuilder& where(std::string col, json::value const& val)
	{
		finalQuery.query += " WHERE " + col;
		if (val.is_null())
			finalQuery.query += " is null";
		else
		{
			finalQuery.query += " = ?";
			addParams(finalQuery.params, val);
		}
		return *this;
	}

	QueryBuilder& and_(std::string col, json::value const& val)
	{
		finalQuery.query += " AND " + col;
		if (val.is_null())
			finalQuery.query += " is null";
		else
		{
			finalQuery.query += " = ?";
			addParams(finalQuery.params, val);
		}
		return *this;
	}

	QueryBuilder& join(std::string table, std::string clause)
	{
		finalQuery.query += " JOIN offgrid_db." + table + " ON " + this->first_table + "." + clause + " = " + table + "." + clause;

		return *this;

	}

	Query build()
	{
		return finalQuery;
	}

};