#pragma once
#include <unordered_map>
#include <shared_mutex>
#include <string>
#include <stdexcept>
#include "Structs.h"

class SessionRegistry
{

	std::unordered_map < std::string, MapEntry> loggedUsers; // sesion_id -> {uid, device_id, OS}
	std::shared_mutex users_mutex; // mutex for the loggedUsers map

public:


	void add(std::string session_id, MapEntry entry)
	{
		std::unique_lock lock(users_mutex);
		loggedUsers[session_id] = std::move(entry);
	}

	void remove(std::string session_id)
	{
		std::unique_lock lock(users_mutex);
		loggedUsers.erase(session_id);
	}

	std::string getUserId(std::string session_id)
	{
		std::string uid;

		{
			std::shared_lock lock(users_mutex);
			auto it = this->loggedUsers.find(session_id);

			if (it == this->loggedUsers.end())
				throw std::runtime_error("unauthorized");

			uid = it->second.uid;
		}

		return uid;
	}

	bool contains(std::string session_id)
	{
		std::shared_lock lock(users_mutex);
		return loggedUsers.count(session_id) > 0;
	}
};