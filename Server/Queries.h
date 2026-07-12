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
	Query InsertUserQuery(json::object const&);

	Query CreateSessionQuery(std::string, std::string);

	Query SelectPassword(json::object const&);

	Query SelectPasswordByUid(std::string);

	Query EndSessions(std::string);

	Query DeleteAccount(std::string);

	Query insertAccess(std::string, std::string, std::string, std::string, std::string);

	Query getGeneralUserData(std::vector<std::string> const&, std::string);

	Query GetUserFiles(std::vector<std::string> const&, std::string, std::string);

	Query GetFile(std::string, std::string);

	Query GetFileMetadata(std::string, std::string, std::vector<std::string>);

	Query GetFolder(std::string, std::string);

	Query GetLoggedUsers();

	Query ChangeUsername(std::string, std::string);

	Query ChangePassword(std::string, std::string);

	Query InsertFile(json::object const&);

	Query InsertFolder(json::object const&);

	Query VerifyFolderId(std::string, std::string);

	Query UpdateUser(json::object const&, std::string, std::string, std::string, std::string);

};