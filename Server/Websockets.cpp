#include "ClientController.h"
#include "Helpers.h"

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

Async<bool> verifyField(std::shared_ptr<WsSession> session, json::object& obj, std::string field_name, json::kind value_type)
{
	if (!obj.contains(field_name) || obj.at(field_name).kind() != value_type)
	{
		co_await Helpers::sendWsMessage(session, {
			{"status", "error"},
			{"message", "missing field: " + field_name} });
		co_return false;
	}

	co_return true;
}

Async<bool> verifyFile(std::shared_ptr<WsSession> session, DatabaseController& db, std::string file_id)
{
	try {
		mysql::results results = co_await db.runQuery(Queries::VerifyFileAccess(file_id, session->uid));
		if (results.rows().empty()) {
			co_await Helpers::sendWsMessage(session, {
				{"status", "error"},
				{"message", "file access denied"} });
			co_return false;
		}

	}
	catch (boost::system::system_error& e)
	{
		std::cerr << "Failed query: " << e.what() << std::endl;
		co_return false;
	}

	co_return true;

}

Async<void> ClientController::handleWatch(std::shared_ptr<WsSession> session, std::string file_id)
{
	{
		std::unique_lock lock(viewers_mutex);
		viewers_map[file_id].viewers.insert(session);
	}

	co_await Helpers::sendWsMessage(session, {
		{"status", "success"},
		{"message", "viewer added to the file"}
		});
}

Async<void> ClientController::handleUnwatch(std::shared_ptr<WsSession> session, std::string file_id)
{
	{
		std::unique_lock lock(viewers_mutex);
		auto it = viewers_map.find(file_id);
		if (it != viewers_map.end())
		{
			it->second.viewers.erase(session);
			if (it->second.viewers.empty())
				viewers_map.erase(it);
		}
	}

	co_await Helpers::sendWsMessage(session, {
		{"status", "success"},
		{"message", "viewer removed from the watch list"}
		});

}

Async<void> ClientController::handleModify(std::shared_ptr<WsSession> session, json::object obj, std::string file_id)
{
	if (!co_await verifyField(session, obj, "position", json::kind::int64)) co_return;
	if (!co_await verifyField(session, obj, "operation", json::kind::string)) co_return;
	if (!co_await verifyField(session, obj, "on_version", json::kind::int64)) co_return;

	std::string operation = json::value_to<std::string>(obj.at("operation"));

	if (operation == "insert") {
		if (!co_await verifyField(session, obj, "text", json::kind::string)) co_return;
	}
	else if (operation == "delete") {
		if (!co_await verifyField(session, obj, "length", json::kind::int64)) co_return;
	}
	else
		co_await Helpers::sendWsMessage(session, {
		{"status", "error"}, {"message", "unknown operation"} });


	int on_version = json::value_to<int>(obj.at("on_version"));
	std::vector<std::shared_ptr<WsSession>> sessions_to_notify;

	int new_version;
	{
		std::unique_lock lock(viewers_mutex);
		auto& state = viewers_map[file_id];

		// I will add the version logic later ^^ 

		state.current_version++;
		new_version = state.current_version;
		sessions_to_notify.assign(state.viewers.begin(), state.viewers.end());
	}

	json::object broadcast;
	broadcast["type"] = "file_changed";
	broadcast["file_id"] = file_id;
	broadcast["version"] = new_version;
	broadcast["operation"] = operation;
	broadcast["position"] = obj.at("position");
	if (operation == "insert")
		broadcast["text"] = obj.at("text");
	else
		broadcast["length"] = obj.at("length");

	for (auto& it : sessions_to_notify)
	{
		if (it == session) continue;

		co_await Helpers::sendWsMessage(it, broadcast);
	}
		

	co_await Helpers::sendWsMessage(session, {
	{"status", "success"}, {"message", "update successful"} });
}

Async<void> ClientController::handleWsMessage(std::shared_ptr<WsSession> session, json::object& obj)
{
	if(! co_await verifyField(session, obj, "type", json::kind::string)) co_return;
	if(! co_await verifyField(session, obj, "file_id", json::kind::string)) co_return;


	std::string file_id = json::value_to<std::string>(obj.at("file_id"));

	if (!co_await verifyFile(session, this->db, file_id)) co_return;

	if (obj.at("type") == "watch")
		co_await handleWatch(session, file_id);

	else if (obj.at("type") == "unwatch")
		co_await handleUnwatch(session, file_id);

	else if (obj.at("type") == "modify")
		co_await handleModify(session, obj, file_id);

	else {
		co_await Helpers::sendWsMessage(session, {
			{"status", "error"}, {"message", "unknown request type"}
			});
	}


	co_return;
}

