#pragma once
#include <boost/mysql.hpp>
#include <boost/asio/any_io_executor.hpp>
#include <boost/asio/awaitable.hpp>
#include <boost/asio/use_awaitable.hpp>
#include <boost/json.hpp>
#include <memory>
#include <string>
#include <iostream>

#include "Structs.h"

namespace mysql = boost::mysql;
namespace asio = boost::asio;
using asio::use_awaitable;
namespace json = boost::json;


class DatabaseController
{

	std::unique_ptr<mysql::connection_pool> pool;

public:

	DatabaseController(asio::any_io_executor);


	mysql::connection_pool& get_connection();

	asio::awaitable<mysql::results> runQuery(Query);
	asio::awaitable<mysql::results> runTransaction(std::vector<Query> queries, mysql::diagnostics&);
};
