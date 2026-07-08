#include "sessionmanager.h"
#include <QStandardPaths>
#include <QDir>
#include <QTime>
#include <QTimer>

SessionManager::SessionManager(QObject *parent) : QObject(parent) {
    checkSession();

    QUrl loginUrl("http://localhost:18080/log_in");
    QUrl logoutUrl("http://localhost:18080/log_out");
    QUrl changeUserPhotoUrl("http://localhost:18080/upload_photo");
}

void SessionManager::checkSession()
{
    QString appDataDir = QStandardPaths::writableLocation(QStandardPaths::AppDataLocation);
    QDir().mkpath(appDataDir);
    QString path = appDataDir + "/session.dat";

    QFile file(path);

    if (!file.exists()) {
        if (file.open(QIODevice::WriteOnly)) {
            file.write("0");
            file.close();
        }
    }

    bool isValid = false;
    if (file.open(QIODevice::ReadOnly)) {
        QString token = file.readAll().trimmed();
        isValid = !token.isEmpty() && token != "0";
        file.close();
    }

    if (m_hasActiveSession != isValid) {
        m_hasActiveSession = isValid;
        emit hasActiveSessionChanged();
    }
}

void SessionManager::saveSession(bool isLoggedIn) {
    QString appDataDir = QStandardPaths::writableLocation(QStandardPaths::AppDataLocation);
    QDir().mkpath(appDataDir);
    QString path = appDataDir + "/session.dat";

    QFile file(path);
    if (file.open(QIODevice::WriteOnly)) {
        file.write(isLoggedIn ? "1" : "0");
        file.close();

        checkSession();
    }
}

void SessionManager::clearSession() { saveSession(false); }

Q_INVOKABLE void SessionManager::registerUser(const QString &username, const QString &email, const QString &password, const QString &confirmPassword, const QString &inviteCode) {
    setServerMessage("");
    if (!(email.contains("@")) || !(email.contains(".")) || email.contains("@.")) {
        setServerMessage("Invalid email");
        return;
    }

    if (password.length() < 8 || confirmPassword.length() < 8 || password.length() > 20 || confirmPassword.length() > 20) {
        setServerMessage("Password has to have between 8 and 20 characters");
        return;
    }

    if (password != confirmPassword) {
        setServerMessage("Password mismatch");
        return;
    }

    QNetworkAccessManager *manager = new QNetworkAccessManager(this);

    QUrl registerUrl("http://localhost:18080/register");
    QNetworkRequest registerRequest(registerUrl);
    registerRequest.setHeader(QNetworkRequest::ContentTypeHeader, "application/json");

    QJsonObject json;
    json["username"] = username;
    json["email"] = email;
    json["password"] = password;
    json["invite_code"] = inviteCode;
    json["join_date"] = QDateTime::currentDateTime().toString("yyyy-MM-dd hh:mm:ss");

    QNetworkReply *reply = manager->post(registerRequest, QJsonDocument(json).toJson());

    connect(reply, &QNetworkReply::finished, this, [this, reply, manager]() {
        reply->deleteLater();
        manager->deleteLater();

        QByteArray responseBytes = reply->readAll();
        QJsonObject responseObj = QJsonDocument::fromJson(responseBytes).object();

        if (reply->error() == QNetworkReply::NoError) {
            if (responseObj.contains("status") && responseObj["status"].toString() == "error") {
                setServerMessage(responseObj["message"].toString());
                return;
            }

            setServerMessage("Account created. Going to Login...");

            QTimer::singleShot(2000, this, [this]() {
                emit registrationSuccessful();
            });
        } else {
            QString serverMessage = responseObj["message"].toString();

            if (serverMessage == "duplicate username")
                setServerMessage("Username is already taken");
            else if (serverMessage == "duplicate email")
                setServerMessage("Email is already taken");
            else if (!serverMessage.isEmpty()) {
                setServerMessage(serverMessage);
            } else
                setServerMessage("Network error or invalid server response.");

        }
    });
}

Q_INVOKABLE void SessionManager::loginUser(const QString &email, const QString &password) {

}