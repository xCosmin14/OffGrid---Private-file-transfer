#include "ClientController.h"
#include "Helpers.h"
#include <boost/asio/redirect_error.hpp>

Async<std::string> ClientController::isAuthenticated(std::string session_id)
{
	try {
		co_return  this->getUserId(session_id);
	}
	catch (std::exception& e)
	{
		co_return "";
	}

}


Async<void> ClientController::handleWsMessage(WsSession& session, json::object& obj)
{
	json::object res_obj;
	res_obj["status"] = "success";
	std::cout << "here\n";
	std::string payload = json::serialize(res_obj);

	boost::system::error_code ec;
	co_await session.ws->async_write(
		boost::asio::buffer(payload),
		boost::asio::redirect_error(boost::asio::use_awaitable, ec));

	if (ec)
		std::cout << "Write error: " << ec.message() << std::endl;
	else
		std::cout << "Write completed" << std::endl;

	co_return;
}

