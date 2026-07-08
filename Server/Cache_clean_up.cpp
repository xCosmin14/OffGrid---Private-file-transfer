#include "ClientController.h"
#include "Helpers.h"

#include <fstream>
#include <filesystem>
#include <thread>


void ClientController::cleanUpCache()
{
	std::thread([this]() {
		while (true)
		{
			for (int i = 0; i < 30 && !this->stop_clean_up; ++i) {
				std::this_thread::sleep_for(std::chrono::seconds(1));
			}

			auto now = std::chrono::steady_clock::now();
			auto max_time = std::chrono::minutes(5);

			std::unique_lock lock(files_mutex);
			for (auto it = files_cache.begin(); it != files_cache.end();)
			{
				if (now - it->second.created > max_time)
					files_cache.erase(it++);
				else
					it++;
			}
		}
		}).detach();
}