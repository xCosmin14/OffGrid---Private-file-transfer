#include <boost/beast/core.hpp>
#include <boost/beast/http.hpp>
#include <boost/asio/co_spawn.hpp>
#include <boost/asio/detached.hpp>
#include <boost/asio/io_context.hpp>
#include <boost/asio/ip/tcp.hpp>

#include <string>
#include <coroutine>

#include <iostream>
#include "Handler.h"

template <typename T>
using Async = boost::asio::awaitable<T>;

namespace http = boost::beast::http;
namespace err = boost::asio::error;


Async<void> handle_session(boost::asio::ip::tcp::socket socket, ClientController& c)
{
	boost::beast::tcp_stream stream(std::move(socket));

	boost::beast::flat_buffer buffer;

	try {
		for (;;) {

			http::request_parser<http::vector_body<uint8_t>> req_parser;
			req_parser.body_limit(10 * 1024 * 1024);
			co_await http::async_read(stream, buffer, req_parser, boost::asio::use_awaitable);

			std::string target = req_parser.get().target();

			if (target == "/upload_photo") 
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
				str_req.prepare_payload();


				if (target == "/get_file")
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

int main()
{
	boost::asio::io_context ioc;

	DatabaseController db_controller(ioc.get_executor());
	ClientController client_controller(db_controller);

	boost::asio::co_spawn(ioc, listener(18080, client_controller), boost::asio::detached);
	ioc.run();
}
