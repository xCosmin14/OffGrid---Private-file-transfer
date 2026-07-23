#include "Helpers.h"
#include <boost/asio/redirect_error.hpp>


Async<void> Helpers::sendWsMessage(std::shared_ptr<WsSession> session, json::object res_obj)
{
	std::string payload = json::serialize(res_obj);

	boost::system::error_code ec;
	co_await session->ws->async_write(
		boost::asio::buffer(payload),
		boost::asio::redirect_error(boost::asio::use_awaitable, ec));

	if (ec)
		std::cout << "Write error: " << ec.message() << std::endl;
}