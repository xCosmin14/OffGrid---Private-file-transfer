#include "ClientController.h"
#include "Helpers.h"

Async<HttpResponse> ClientController::handleRequest(http::verb method, std::string_view target, std::string body, std::string session_id)
{
    if (method == http::verb::options) co_return Helpers::makeResponse(http::status::no_content, "");

    json::object obj;

    if (!body.empty())
    {
        try {
            json::value json_value = json::parse(body);
            if (!json_value.is_object())
                co_return Helpers::makeResponse(http::status::bad_request, "expected a json object");

            obj = json_value.as_object();
        }
        catch (std::exception& e)
        {
            std::cout << "Failed parsing: " << e.what() << std::endl;
            co_return Helpers::makeResponse(http::status::bad_request, "invalid json");
        }
    }

    if (method == http::verb::post)
    {
        if (target == "/register") co_return co_await this->registerUser(obj);
        else if (target == "/log_in") co_return co_await this->loginUser(obj);
        else if (target == "/log_out") co_return co_await this->logoutUser(obj, session_id);
        else if (target == "/delete_account") co_return co_await this->removeUser(obj, session_id);

        else if (target.starts_with("/upload_folder")) co_return co_await this->uploadFolder(obj, session_id);

        else if (target == "/create_folder") co_return co_await this->createEntity(obj, session_id, { "color", "name", "type", "parent_folder_id" }, "folder");
        else if (target == "/create_file") co_return co_await this->createEntity(obj, session_id, { "name", "folder_id" }, "file");
        else if (target == "/user_data") co_return co_await this->getUserData(obj, session_id);
        else if (target == "/user_files") co_return co_await this->getUserFiles(obj, session_id);
        else if (target.starts_with("/get_file_metadata"))
        {
            auto pos = target.find("?file_id=");
            if (pos == std::string::npos)
                co_return Helpers::makeResponse(http::status::bad_request, "missing file id");
            co_return co_await this->getFileMetadata(std::string(target.substr(pos + 9)), session_id, obj);
        }
    }
    else if (method == http::verb::get)
    {
        if (target == "/get_profile_photo") co_return co_await this->getProfilePhoto(session_id);
        else if (target.starts_with("/get_file"))
        {
            auto pos = target.find("?file_id=");
            if (pos == std::string::npos)
                co_return Helpers::makeResponse(http::status::bad_request, "missing file id");
            co_return co_await this->getFile(std::string(target.substr(pos + 9)), session_id);
        }
    }
    else if (method == http::verb::delete_)
    {
        if (target.starts_with("/cancel_upload"))
        {
            auto pos = target.find("?transaction_id=");
            if (pos == std::string::npos)
                co_return Helpers::makeResponse(http::status::bad_request, "missing transaction_id");
            co_return co_await this->cancelFolderUpload(std::string(target.substr(pos + 16)), session_id);
        }
    }
    else if (method == http::verb::patch)
    {
        if (target.starts_with("/change_username")) co_return co_await this->changeUsername(obj, session_id);
        else if (target.starts_with("/change_password")) co_return co_await this->changePassword(obj, session_id);
        else if (target.starts_with("/change_data")) {
            auto pos = target.find("/change_data/");
            if (pos == std::string::npos)
                co_return co_await this->changeData(obj, session_id);
            co_return co_await this->changeData(obj, session_id, (std::string)target.substr(pos + 12));
        }
    }

    co_return Helpers::makeResponse(http::status::not_found, "nonexistent endpoint");
}

Async<HttpResponse> ClientController::handleRequest(http::verb method, std::string_view target, std::vector<uint8_t>& body, std::string session_id)
{
    if (method == http::verb::options)
        co_return Helpers::makeResponse(http::status::no_content, "");

    if (method == http::verb::post)
    {
        if (target == "/upload_photo") co_return co_await this->uploadFile(body, session_id, "/profile_photos");

        else if (target.starts_with("/upload_file"))
        {
            auto pos = target.find("?transaction_id=");
            if (pos != std::string_view::npos) {
                std::string transaction_id = std::string(target.substr(pos + 16));
                co_return co_await this->uploadFile(body, session_id, "/files", transaction_id);
            }
            co_return co_await this->uploadFile(body, session_id, "/files");
        }
    }

    co_return Helpers::makeResponse(http::status::not_found, "nonexistent endpoint");
}