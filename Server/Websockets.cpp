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

Async<std::optional<std::string>> verifyFile(std::shared_ptr<WsSession> session, DatabaseController& db, std::string file_id)
{
	std::string path;
	try {
		mysql::results results = co_await db.runQuery(Queries::VerifyFileAccess(file_id, session->uid));
		if (results.rows().empty()) {
			co_await Helpers::sendWsMessage(session, {
				{"status", "error"},
				{"message", "file access denied"} });
			co_return std::nullopt;
		}

		path = results.rows()[0][1].as_string();

	}
	catch (boost::system::system_error& e)
	{
		std::cerr << "Failed query: " << e.what() << std::endl;
		co_return std::nullopt;
	}

	co_return path;

}

Async<void> ClientController::handleWatch(std::shared_ptr<WsSession> session, std::string file_id, std::string path)
{
	std::string content;
	int version;

	std::ifstream in(path, std::ios::binary);
	if (!in.is_open())
	{
		std::cout << "Not able to open file: " << path << std::endl;
	}
	std::string diskContent((std::istreambuf_iterator<char>(in)), std::istreambuf_iterator<char>());


	{
		std::unique_lock lock(viewers_mutex);
		auto& state = viewers_map[file_id];

		if (state.viewers.empty())
		{
			state.file_path = path; 
			state.content = PieceTable(diskContent);
		}

		state.viewers.insert(session);
		content = state.content.getContent();
		version = state.current_version;
	}

	co_await Helpers::sendWsMessage(session, {
		{"status", "success"},
		{"message", "viewer added to the file"}
		});
}

void ClientController::removeSessionFromAllFiles(std::shared_ptr<WsSession> session)
{
	std::unique_lock lock(viewers_mutex);

	for (auto it = viewers_map.begin(); it != viewers_map.end(); )
	{
		it->second.viewers.erase(session); 

		if (it->second.viewers.empty())   
		{
			std::string finalContent = it->second.content.getContent();
			std::string full_path = "FileSystem/files/" + it->second.owner_uid + "/" + it->second.file_path;

			std::filesystem::create_directories(std::filesystem::path(full_path).parent_path());

			std::ofstream out(full_path, std::ios::binary | std::ios::trunc);
			out.write(finalContent.data(), finalContent.size());
			out.close();

			viewers_map.erase(it);
		}
		else
			++it;
	}
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
			{
				std::string finalContent = it->second.content.getContent();
				std::string full_path = "FileSystem/files/" + it->second.owner_uid + "/" + it->second.file_path;

				std::filesystem::create_directories(std::filesystem::path(full_path).parent_path());


				std::ofstream out(full_path, std::ios::binary | std::ios::trunc);
				out.write(finalContent.data(), finalContent.size());
				out.close();

				viewers_map.erase(it);
			}
		}
	}

	co_await Helpers::sendWsMessage(session, {
		{"status", "success"},
		{"message", "viewer removed from the watch list"}
		});

}


Op adjustChange(Op b, const Op& a)
{
	if (a.type == "insert" && b.type == "insert")
	{

		if (a.position <= b.position)
			b.position += a.text.size();
	}
	else if (a.type == "insert" && b.type == "delete")
	{
		if (a.position <= b.position)
			b.position += (int)a.text.length();
		else if (a.position >= b.position + b.length)
			;
		else
			b.length += a.text.length();
	}
	else if (a.type == "delete" && b.type == "insert")
	{
		if (b.position <= a.position)
			; 
		else if (b.position >= a.position + a.length)
			b.position -= a.length;
		else
			b.position = a.position;
	}
	else if (a.type == "delete" && b.type == "delete")
	{
		int aEnd = a.position + a.length;
		int bEnd = b.position + b.length;

		if (bEnd <= a.position)
			; 
		else if (b.position >= aEnd)
			b.position -= a.length;
		else
		{
			int overlapStart = std::max(a.position, b.position);
			int overlapEnd = std::min(aEnd, bEnd);
			int overlapLen = overlapEnd - overlapStart;

			b.length -= overlapLen;
			if (b.position >= a.position)
				b.position = a.position;
		}
	}

	return b;
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

	
	std::exception_ptr err;
	try {
		mysql::results results = co_await this->db.runQuery(Queries::VerifyFileRights(file_id, session->uid));

		auto rows = results.rows();

		if (rows.empty()) {
			if (rows.empty()) {
				std::cerr << "VerifyFileRights returned no rows despite VerifyFileAccess passing for file_id=" << file_id << " uid=" << session->uid << std::endl;
				co_await Helpers::sendWsMessage(session, {
					{"status", "error"}, {"message", "internal server error"} });
				co_return;
			}
		}

		std::string rights = rows[0][0].as_string();
		std::string owner_id = rows[0][1].as_string();


		{
			std::unique_lock lock(viewers_mutex);
			viewers_map[file_id].owner_uid = owner_id;
		}

		if (rights != "owner" && rights != "edit") {
			co_await Helpers::sendWsMessage(session, {
			{"status", "error"}, {"message", "this user doesn't have edit rights to this file"} });
			co_return;
		}

	}
	catch (boost::system::system_error& e)
	{
		std::cerr << "Failed query: " << e.what() << std::endl;
		err = std::current_exception();
	}
	if (err) {
		co_await Helpers::sendWsMessage(session, {
		{"status", "error"}, {"message", "internal server error"} });
		co_return;
	}


	int on_version = json::value_to<int>(obj.at("on_version"));
	std::vector<std::shared_ptr<WsSession>> sessions_to_notify;

	Op incoming(obj);

	int new_version;
	{
		std::unique_lock lock(viewers_mutex);
		auto& state = viewers_map[file_id];


		for (int i = on_version; i < state.current_version; i++)
			incoming = adjustChange(incoming, state.history[i]);

		if (incoming.type == "insert")
			state.content.insert(incoming.position, incoming.text);
		else
			state.content.erase(incoming.position, incoming.length);

		state.current_version++;
		new_version = state.current_version;
		sessions_to_notify.assign(state.viewers.begin(), state.viewers.end());
		state.history.push_back(incoming);
	}


	json::object broadcast = incoming;

	broadcast["type"] = "file_changed";
	broadcast["file_id"] = file_id;
	broadcast["version"] = new_version;

	for (auto& it : sessions_to_notify)
	{
		if (it == session) continue;

		co_await Helpers::sendWsMessage(it, broadcast);
	}


		

	co_await Helpers::sendWsMessage(session, {
	{"status", "success"}, {"message", "update successful"} });
}


Async<void> ClientController::handleNotification(std::shared_ptr<WsSession> session, json::object obj)
{
	if (!co_await verifyField(session, obj, "notification_id", json::kind::string)) co_return;

	if (obj.at("type") == "answer_notification") {
		if (!co_await verifyField(session, obj, "response", json::kind::string)) co_return;
	}

	std::string type = json::value_to<std::string>(obj.at("type"));

	try {

		Query q;
		if (type == "answer_notification")

			q = Queries::AddNotificationResponse(
				json::value_to<std::string>(obj.at("response")),
				session->uid,
				json::value_to<std::string>(obj.at("notification_id")));

		else
			q = Queries::ViewNotification(
				json::value_to<std::string>(obj.at("notification_id")),
				session->uid);


		mysql::results results = co_await this->db.runQuery(q);

		if(results.affected_rows() == 0)
			co_await Helpers::sendWsMessage(session, {
				{"status", "error"}, {"message", "notification not found"} });

		else 
			co_await Helpers::sendWsMessage(session, {
				{"status", "success"}, {"message", "action: " + type + " completed successfuly"}});

	}
	catch (boost::system::system_error& e)
	{
		std::cerr << "Failed query: " << e.what();
	}

}


Async<void> ClientController::handleWsMessage(std::shared_ptr<WsSession> session, json::object& obj)
{
	if(!co_await verifyField(session, obj, "type", json::kind::string)) co_return;

	if (obj.at("type") == "answer_notification" || obj.at("type") == "view_notification")
		co_await handleNotification(session, obj);

	if(! co_await verifyField(session, obj, "file_id", json::kind::string)) co_return;


	std::string file_id = json::value_to<std::string>(obj.at("file_id"));
	auto path = co_await verifyFile(session, this->db, file_id);

	if (!path) co_return;

	if (obj.at("type") == "watch")
		co_await handleWatch(session, file_id, *path);

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



Async<void> ClientController::sendNotifications(Notification notif, std::string actor_uid, 
	std::string involvment_entity, std::string involvment_id)
{
	try {

		mysql::results senderResult = co_await this->db.runQuery(Queries::GetUsername(actor_uid));
		std::string sender_username = senderResult.rows()[0][0].as_string();
		notif.addUsername(sender_username);

		json::object notif_obj = notif.getObject();

		mysql::results results = co_await this->db.runQuery(Queries::GetInvolvedUsers(involvment_id, involvment_entity));
		std::unordered_set<std::string> uids;

		auto rows = results.rows();

		if (rows.empty()) co_return;


		for (auto row : rows)
		{
			uids.insert(row[0].as_string()); 
			if (!row[1].is_null())
				uids.insert(row[1].as_string()); 
		}


		for (auto& target_uid: uids)
		{
		
			if (target_uid == actor_uid) continue;

			std::string notification_id = this->createId("notification");

			
			json::object obj;
			obj["notification_id"] = notification_id;
			obj["receiver_id"] = target_uid;
			obj["sender_id"] = actor_uid;
			obj[involvment_entity + "_id"] = involvment_id;
			obj["info"] = notif.getObject();


			co_await this->db.runQuery(Queries::InsertNotification(obj));


			std::vector<std::shared_ptr<WsSession>> live_users;
			{
				std::shared_lock lock(online_users_mutex);
				auto it = online_users.find(target_uid);
				if (it != online_users.end())
					live_users.assign(it->second.begin(), it->second.end());
			}

			json::object payload;
			payload["type"] = "notification";
			payload["info"] = notif.getObject();
			payload["notification_id"] = notification_id;


			for (auto socket : live_users)
			{
				co_await Helpers::sendWsMessage(socket, payload);
			}
		}

	}
	catch (boost::system::system_error& e)
	{
		std::cerr << "Failed query: " << e.what() << std::endl;
	}
}