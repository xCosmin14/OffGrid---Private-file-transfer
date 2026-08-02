#include "Helpers.h"
#include <boost/asio/redirect_error.hpp>


Async<void> Helpers::sendWsMessage(std::shared_ptr<WsSession> session, json::object res_obj)
{
	std::string payload = json::serialize(res_obj);

	co_await session->write_lock->async_receive(boost::asio::use_awaitable);

	boost::system::error_code ec;
	co_await session->ws->async_write(
		boost::asio::buffer(payload),
		boost::asio::redirect_error(boost::asio::use_awaitable, ec));

	session->write_lock->try_send(boost::system::error_code{});

	if (ec)
		std::cout << "Write error: " << ec.message() << std::endl;
}