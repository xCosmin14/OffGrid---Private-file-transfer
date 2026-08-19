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

#include "Helpers.h"

namespace http = boost::beast::http;
namespace err = boost::asio::error;

template <typename T>
using Async = boost::asio::awaitable<T>;

template <typename RequestBody, typename ResponseBody>
class Handler
{
	const std::vector<std::string> allowed_origins = {
		"http://localhost:5173",
		"http://192.168.1.176:5173",
		"http://127.0.0.1:5173",
		"http://192.168.1.176:3000"
	};
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
			res.set(http::field::access_control_allow_methods, "GET, POST, PATCH, DELETE, OPTIONS");
			res.set(http::field::access_control_allow_headers, "Content-Type, Authorization, X-Requested-With");
			res.set(http::field::access_control_allow_credentials, "true");
			res.set(http::field::access_control_expose_headers, "Content-Disposition");
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
				res.set("Set-Cookie", "session_id=; HttpOnly; SameSite=None; Secure; Max-Age=0");
			else if (!session_id.empty())
				res.set("Set-Cookie", "session_id=" + session_id + "; HttpOnly; SameSite=None; Secure; Max-Age=2592000");
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

		try {
			this->setHeaders(res, "application/octet-stream");
		}
		catch (std::exception& e) {
			res.result(http::status::forbidden);
			res.prepare_payload();
			co_return res;
		}

		if (req.method() == http::verb::options)
		{
			res.result(http::status::no_content);
			res.prepare_payload();
			co_return res;
		}

		auto [stat, body, session_id] = co_await c.handleRequest(req.method(), req.target(), "", this->getSessionId());

		res.result(stat);

		if (stat == http::status::ok)
		{
			json::object meta = json::parse(body).as_object();
			std::string content_type = (meta.contains("content_type") && meta.at("content_type").is_string())
				? json::value_to<std::string>(meta.at("content_type"))
				: "application/octet-stream";

			if (req.target() == "/get_collaborators_profile")
			{
				json::array paths = meta["paths"].as_array();
				json::array usernames = meta["usernames"].as_array();

				std::string boundary = "offgrid-boundary-7f3a9c1e";
				std::string multipart_body;


				for (int i = 0; i < paths.size(); i++)
				{
					auto path = paths[i];
					std::string full_path = "FileSystem/profile_photos/" +
						json::value_to<std::string>(path);

					if (!std::filesystem::exists(full_path)) continue;

					std::ifstream in(full_path, std::ios::binary);
					std::ostringstream fbuf;
					fbuf << in.rdbuf();
					std::string file_bytes = fbuf.str();

					multipart_body += "--" + boundary + "\r\n";
					multipart_body += "Content-Disposition: form-data; name=\"file\"; filename=\"" +
						json::value_to<std::string>(usernames[i]) + "\"\r\n";
					multipart_body += "Content-Type: image/png\r\n\r\n";
					multipart_body += file_bytes;
					multipart_body += "\r\n";

				}

				multipart_body += "--" + boundary + "--\r\n";

				std::filesystem::create_directories("FileSystem/tmp");
				std::string tmp_path = "FileSystem/tmp/" + boundary + ".tmp";
				std::ofstream out(tmp_path, std::ios::binary);
				out << multipart_body;
				out.close();

				boost::beast::error_code e;
				res.body().open(tmp_path.c_str(), boost::beast::file_mode::read, e);
				if (e) {
					res.result(http::status::internal_server_error);
					co_return res;
				}
				res.result(http::status::ok);
				res.set(http::field::content_type, "multipart/form-data; boundary=" + boundary);
				res.prepare_payload();
				co_return res;

			}
			else if (req.target().starts_with("/get_folder"))
			{
				std::string path = json::value_to<std::string>(meta["path"]);
				std::string uid = json::value_to<std::string>(meta["creator_id"]);
				std::string folder_name = json::value_to<std::string>(meta["name"]);

				std::string full_path = "FileSystem/files/" + uid + "/" + path;

				if (!std::filesystem::exists(full_path) || !std::filesystem::is_directory(full_path))
				{
					res.result(http::status::not_found);
					co_return res;
				}

				std::filesystem::create_directories("FileSystem/tmp");
				std::string tmp_path = "FileSystem/tmp/" + folder_name + "_" + std::to_string(std::time(nullptr)) + ".zip";

				try {
					Helpers::zipDirectory(full_path, tmp_path);
				}
				catch (std::exception& e) {
					std::cerr << "Zip failed: " << e.what() << std::endl;
					res.result(http::status::internal_server_error);
					co_return res;
				}

				boost::beast::error_code ec;
				res.body().open(tmp_path.c_str(), boost::beast::file_mode::read, ec);
				if (ec) {
					res.result(http::status::internal_server_error);
					co_return res;
				}

				res.result(http::status::ok);
				res.set(http::field::content_type, "application/zip");
				res.set(http::field::content_disposition, "attachment; filename=\"" + folder_name + ".zip\"");
				res.prepare_payload();
				co_return res;
			}
			else {
				std::string file_path = json::value_to<std::string>(meta["path"]);

				std::string full_path;
				if (req.target() == "/get_profile_photo") {
					full_path = "FileSystem/profile_photos/" + file_path;
				}
				else {
					std::string uid = json::value_to<std::string>(meta["creator_id"]);
					full_path = "FileSystem/files/" + uid + "/" + file_path;
				}

				if (!std::filesystem::exists(full_path)) {
					res.result(http::status::not_found);
					co_return res;
				}

				boost::beast::error_code e;
				res.body().open(full_path.c_str(), boost::beast::file_mode::read, e);
				if (e) {
					res.result(http::status::internal_server_error);
					co_return res;
				}
				res.result(http::status::ok);
				res.set(http::field::content_type, content_type);
			}
		}
		else {
			co_return res;
		}

		res.prepare_payload();
		co_return res;
	}
};