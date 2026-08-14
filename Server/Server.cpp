#include <boost/beast/core.hpp>
#include <boost/beast/http.hpp>
#include <boost/asio/co_spawn.hpp>
#include <boost/asio/detached.hpp>
#include <boost/asio/io_context.hpp>
#include <boost/asio/ip/tcp.hpp>
#include <boost/beast/websocket.hpp>

#include <string>
#include <coroutine>

#include <iostream>
#include "Handler.h"
#include "Helpers.h"

template <typename T>
using Async = boost::asio::awaitable<T>;

namespace http = boost::beast::http;
namespace err = boost::asio::error;
namespace websocket = boost::beast::websocket;

Async<void> handle_websocket_session(boost::asio::ip::tcp::socket socket, http::request<http::vector_body<uint8_t>> req, std::string cookie, ClientController& c)
{
	auto ws = std::make_shared<websocket::stream<boost::asio::ip::tcp::socket>>(std::move(socket));

	std::shared_ptr<WsSession> ws_session;

	try {

		co_await ws->async_accept(req, boost::asio::use_awaitable);


		std::string session_id = Helpers::extractSessionId(cookie);
		std::string uid = co_await c.isAuthenticated(session_id);

		if (uid.empty()) co_return;

		ws_session = std::make_shared<WsSession>(ws, uid);
		c.addSocket(ws_session);

		for (;;)
		{
			boost::beast::flat_buffer buffer;
			co_await ws->async_read(buffer, boost::asio::use_awaitable);

			std::string msg = boost::beast::buffers_to_string(buffer.data());
			json::object obj = json::parse(msg).as_object();
				
			co_await c.handleWsMessage(ws_session, obj);
		}
	}
	catch (boost::system::system_error& e)
	{
		if (e.code() != websocket::error::closed && e.code() != boost::asio::error::connection_reset) {
			std::cerr << "WS session error: " << e.what();
		}


	}
	catch (std::exception& e)
	{
		std::cerr << "Unexpected error: " << e.what() << std::endl;
	}

	c.removeSessionFromAllFiles(ws_session);

	
}


Async<void> handle_session(boost::asio::ip::tcp::socket socket, ClientController& c)
{
	boost::beast::tcp_stream stream(std::move(socket));

	boost::beast::flat_buffer buffer;

	try {
		for (;;) {

			http::request_parser<http::vector_body<uint8_t>> req_parser;
			req_parser.body_limit(100000ULL * 1024 * 1024);
			co_await http::async_read(stream, buffer, req_parser, boost::asio::use_awaitable);

			if (websocket::is_upgrade(req_parser.get()))
			{
				std::string cookie{ req_parser.get()[http::field::cookie] };
				co_await handle_websocket_session(stream.release_socket(), req_parser.release(), cookie, c);
				co_return;  
			}

			auto& vec = req_parser.get().body();
			std::string target = req_parser.get().target();


			if (target.starts_with("/upload") && target.find("folder") == std::string::npos)
			{
				Handler<http::vector_body<uint8_t>, http::string_body>handler(req_parser.get(), c);
				auto res = co_await handler.getResponse();
				co_await http::async_write(stream, res, boost::asio::use_awaitable);

			}
			else {
				auto& vec = req_parser.get().body();
				http::request<http::string_body> str_req;


				str_req.method(req_parser.get().method());
				str_req.target(req_parser.get().target());
				str_req.version(req_parser.get().version());
				str_req.body() = std::string(vec.begin(), vec.end());

				for (auto& field : req_parser.get())
					str_req.insert(field.name(), field.name_string(), field.value());

				str_req.prepare_payload();


				if (target.starts_with("/get_file?") || target.starts_with("/get_folder?")
					|| target.find("profile") != std::string::npos)
				{
					Handler<http::string_body, http::file_body>handler(str_req, c);
					auto res = co_await handler.getFileResponse();
					co_await http::async_write(stream, res, boost::asio::use_awaitable);
				}
				else {
					Handler<http::string_body, http::string_body>handler(str_req, c);
					auto res = co_await handler.getResponse();
					co_await http::async_write(stream, res, boost::asio::use_awaitable);
				}

			}

			if (!req_parser.get().keep_alive()) break;
		}
	}
	catch (boost::system::system_error const& e) {
		if (e.code() != http::error::end_of_stream && e.code() != err::connection_reset)
			std::cerr << "Session error: " << e.what() << std::endl;
	}

	boost::beast::error_code ec;
	stream.socket().shutdown(boost::asio::ip::tcp::socket::shutdown_both, ec);

}

Async<void> listener(unsigned short port, ClientController& c)
{
	auto executor = co_await boost::asio::this_coro::executor;
	boost::asio::ip::tcp::acceptor acceptor(executor, { boost::asio::ip::tcp::v4(), port });

	std::cout << "Server running on port " << port << std::endl;

	for (;;) {
		boost::asio::ip::tcp::socket socket = co_await acceptor.async_accept(boost::asio::use_awaitable);
		boost::asio::co_spawn(executor, handle_session(std::move(socket), c), boost::asio::detached);
	}
}

Async<void> startUp(ClientController& c, unsigned short port)
{
	co_await c.loadLoggedUsers();
	co_await listener(port, c);
}

int main()
{
	boost::asio::io_context ioc;

	DatabaseController db_controller(ioc.get_executor());
	ClientController client_controller(db_controller);

	boost::asio::co_spawn(ioc, startUp(client_controller, 18080), boost::asio::detached);
	ioc.run();
}