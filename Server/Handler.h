#pragma once
#include <boost/beast/core.hpp>
#include <boost/beast/http.hpp>
#include <boost/asio/co_spawn.hpp>
#include <boost/asio/detached.hpp>
#include <boost/asio/io_context.hpp>
#include <boost/asio/ip/tcp.hpp>

#include <vector>
#include <string>
#include <algorithm>
#include <fstream>
#include <filesystem>

#include "ClientController.h"

namespace http = boost::beast::http;
namespace err = boost::asio::error;

template <typename T>
using Async = boost::asio::awaitable<T>;

template <typename RequestBody, typename ResponseBody>
class Handler
{
	const std::vector<std::string> allowed_origins = { "http://localhost:5173", "http://192.168.1.176:5173" };
	http::request<RequestBody> req;
	ClientController& c;

	void setHeaders(http::response<ResponseBody>& res, std::string content_type)
	{
		res.version(req.version());

		std::string origin{ req[http::field::origin] };


		if (!origin.empty() && std::find(allowed_origins.begin(), allowed_origins.end(), origin) == allowed_origins.end())
		{
			if constexpr (std::is_same_v<ResponseBody, http::string_body>)
			{
				res.result(http::status::forbidden);
				res.body() = R"({"error":"CORS policy violated", "message":"Origin not allowed"})";
			}
			throw std::runtime_error("CORS error");
		}
		else
		{
			res.set(http::field::access_control_allow_origin, origin.empty() ? "*" : origin);
			res.set(http::field::access_control_allow_methods, "GET, POST, OPTIONS");
			res.set(http::field::access_control_allow_headers, "Content-Type, Authorization, X-Requested-With");
			res.set(http::field::access_control_allow_credentials, "true");
			res.set(http::field::content_type, content_type);
		}

	}

public:

	Handler(http::request<RequestBody> incoming_req, ClientController& cl) :
		req(incoming_req), c(cl) {
	}

	std::string getSessionId()
	{
		std::string cookie{ req[http::field::cookie] };

		if (cookie.empty()) return "";

		std::string key = "session_id=";
		auto pos = cookie.find(key);

		if (pos == std::string::npos) return "";

		auto start = pos + key.size();
		auto end = cookie.find(";", start);

		if (end == std::string::npos)
			return cookie.substr(start);
		else
			return cookie.substr(start, end - start);

	}

	Async<http::response<ResponseBody>> getResponse()
	{
		http::response<ResponseBody> res;

		bool error = false;

		try {
			this->setHeaders(res, "application/json");
		}
		catch (std::exception& e)
		{
			error = true;
		}

		if (error)
		{
			res.prepare_payload();
			co_return res;
		}

		if (req.method() == http::verb::options)
		{
			res.result(http::status::no_content);
			res.prepare_payload();
			co_return res;
		}

		auto set_cookie = [&res](std::string session_id) {
			if (session_id == "expired")
				res.set("Set-Cookie", "session_id=; HttpOnly; SameSite=Strict; Max-Age=0");
			else if (!session_id.empty())
				res.set("Set-Cookie", "session_id=" + session_id + "; HttpOnly; SameSite=Strict");
			};

		if constexpr (std::is_same_v<RequestBody, http::vector_body<uint8_t>>)
		{
			auto [stat, body, session_id] = co_await c.handleRequest(req.method(), req.target(), req.body(), this->getSessionId());
			res.result(stat);
			res.body() = body;
			set_cookie(session_id);
		}
		else
		{
			std::string json = "";
			if constexpr (std::is_same_v<RequestBody, http::string_body>)
				json = req.body();

			auto [stat, body, session_id] = co_await c.handleRequest(req.method(), req.target(), json, this->getSessionId());
			res.result(stat);
			res.body() = body;
			set_cookie(session_id);
		}

		res.prepare_payload();

		co_return res;
	}


	Async<http::response<ResponseBody>> getFileResponse()
	{
		http::response<ResponseBody> res;

		bool error = false;

		try {
			this->setHeaders(res, "application/octet-stream");
		}
		catch (std::exception& e)
		{
			error = true;
		}

		if (error)
		{
			res.result(http::status::forbidden);
			co_return res;
		}

		std::string json = req.body();
		auto [stat, body, session_id] = co_await c.handleRequest(req.method(), req.target(), "", this->getSessionId());

		res.result(stat);

		if (stat == http::status::ok)
		{
			json::object meta = json::parse(body).as_object();
			std::string file_path = json::value_to<std::string>(meta["path"]);
			std::string content_type = json::value_to<std::string>(meta["content_type"]);
			std::string full_path;
			if (req.target() == "/get_profile_photo")
			{
				full_path = "FileSystem/profile_photos/" + file_path;
			}
			else {
				std::string uid = json::value_to<std::string>(meta["creator_id"]);
				full_path = "FileSystem/files/" + uid + "/" + file_path;
			}

			if (!std::filesystem::exists(full_path))
			{
				std::cerr << "File missing from disk assets: " << full_path << std::endl;

				res.result(http::status::not_found);
				co_return res;
			}

			boost::beast::error_code e;
			res.body().open(full_path.c_str(), boost::beast::file_mode::read, e);

			if (e)
			{
				res.result(http::status::internal_server_error);
				co_return res;
			}

			res.result(http::status::ok);
			res.set(http::field::content_type, content_type);

		}
		else {
			co_return res;
		}

		res.prepare_payload();
		co_return res;
	}
};