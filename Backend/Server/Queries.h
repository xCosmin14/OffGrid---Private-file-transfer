#pragma once
#include <boost/json.hpp>
#include <boost/mysql.hpp>
#include <string>

#include "Structs.h"

namespace json = boost::json;
namespace mysql = boost::mysql;

inline void addParams(std::vector<mysql::field>& values, json::value const& val)
{
	if (val.is_string()) values.emplace_back(json::value_to<std::string>(val));
	else if (val.is_int64()) values.emplace_back(std::to_string(val.as_int64()));
	else if (val.is_bool()) values.emplace_back(val.as_bool() ? 1 : 0);
	else if (val.is_null()) values.emplace_back(nullptr);
	else values.emplace_back(json::serialize(val));
}


namespace Queries
{
	Query InsertUserQuery(json::object const& obj);

	Query CreateSessionQuery(std::string session_id, std::string user_id);

	Query SelectPassword(json::object const& obj);

	Query EndSessions(std::string uid);

	Query DeleteAccount(std::string uid);

	Query insertFile(json::object const& obj);

	Query getGeneralData(std::vector<std::string> const& vect, std::string uid);
};