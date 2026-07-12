#include "sessionmanager.h"

#include <QStandardPaths>
#include <QDir>
#include <QUrl>
#include <QFileInfo>
#include <QFile>

#include <QJsonArray>

#include <QHttpMultiPart>
#include <QHttpPart>
#include <QMimeDatabase>

#include <QTime>
#include <QTimer>

#include <QNetworkCookie>
#include <QNetworkCookieJar>

SessionManager* SessionManager::m_instance = nullptr;

SessionManager::SessionManager(QObject *parent) : QObject(parent) {
    m_instance = this;

    m_manager = new QNetworkAccessManager(this);
    m_manager->setCookieJar(new QNetworkCookieJar(this));
    checkSession();
}

SessionManager* SessionManager::instance() {
    return m_instance;
}

void SessionManager::checkSession() {
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

    if (isValid && m_manager) {
        QString cookiesPath = appDataDir + "/cookies.dat";
        QFile cookiesFile(cookiesPath);

        if (cookiesFile.open(QIODevice::ReadOnly)) {
            QDataStream in(&cookiesFile);
            int size; in >> size;

            QList<QNetworkCookie> restoredCookies;
            for (int i = 0; i < size; ++i) {
                QByteArray rawCookie; in >> rawCookie;

                QList<QNetworkCookie> parsed = QNetworkCookie::parseCookies(rawCookie);
                if (!parsed.isEmpty()) restoredCookies.append(parsed.first());
            }

            m_manager->cookieJar()->setCookiesFromUrl(restoredCookies, QUrl("http://localhost:18080/"));
            cookiesFile.close();
        }
    }

    if (m_hasActiveSession != isValid) {
        m_hasActiveSession = isValid;
        emit hasActiveSessionChanged();
    }

    if (m_hasActiveSession) {
        QTimer::singleShot(500, this, [this]() {fetchPFP();});
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
    }

    QString cookiesPath = appDataDir + "/cookies.dat";
    QFile cookiesFile(cookiesPath);

    if (isLoggedIn) {
        if (cookiesFile.open(QIODevice::WriteOnly)) {
            const QList<QNetworkCookie> cookies = m_manager->cookieJar()->cookiesForUrl(QUrl("http://localhost:18080/"));

            QDataStream out(&cookiesFile);
            out << static_cast<qint32>(cookies.size());
            for (const QNetworkCookie &cookie : cookies) out << cookie.toRawForm();

            cookiesFile.close();
        }
    } else cookiesFile.remove();

    checkSession();
}

QJsonObject SessionManager::getUserData() {
    if (!SessionManager::instance() || !SessionManager::instance()->hasActiveSession()) return {};

    QUrl getUserDataUrl("http://localhost:18080/user_data");
    QNetworkRequest getUserDataRequest(getUserDataUrl);
    getUserDataRequest.setHeader(QNetworkRequest::ContentTypeHeader, "application/json");

    QJsonObject body;
    QJsonArray fieldsArray = {"username", "email", "preferences"};
    body["fields"] = fieldsArray;

    QNetworkReply *reply = m_manager->post(getUserDataRequest, QJsonDocument(body).toJson(QJsonDocument::Compact));

    QEventLoop loop;
    connect(reply, &QNetworkReply::finished, &loop, &QEventLoop::quit);
    loop.exec();

    QJsonObject responseObj;

    if (reply->error() == QNetworkReply::NoError) {
        QByteArray responseBytes = reply->readAll();
        responseObj = QJsonDocument::fromJson(responseBytes).object();

        QJsonObject returnObj;
        returnObj["email"] = responseObj["email"];
        returnObj["username"] = responseObj["username"];
        returnObj["preferences"] = responseObj["preferences"];

        return returnObj;
    } else {
        qDebug() << "Eroare server/rețea:" << reply->errorString();
    }

    reply->deleteLater();
    return {};
}

void SessionManager::registerUser(const QString &username, const QString &email, const QString &password, const QString &confirmPassword, const QString &inviteCode) {
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

    QUrl registerUrl("http://localhost:18080/register");
    QNetworkRequest registerRequest(registerUrl);
    registerRequest.setHeader(QNetworkRequest::ContentTypeHeader, "application/json");

    QJsonObject json;
    json["username"] = username;  json["email"] = email;
    json["password"] = password;
    json["invite_code"] = inviteCode;
    json["join_date"] = QDateTime::currentDateTime().toString("yyyy-MM-dd hh:mm:ss");

    QNetworkReply *reply = m_manager->post(registerRequest, QJsonDocument(json).toJson());

    connect(reply, &QNetworkReply::finished, this, [this, reply]() {
        reply->deleteLater();

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

void SessionManager::loginUser(const QString &email, const QString &password) {
    setServerMessage("");

    if (!(email.contains("@")) || !(email.contains(".")) || email.contains("@.")) {
        setServerMessage("Invalid email");
        return;
    }

    QUrl loginUrl("http://localhost:18080/log_in");
    QNetworkRequest loginRequest(loginUrl);
    loginRequest.setHeader(QNetworkRequest::ContentTypeHeader, "application/json");

    QJsonObject json;
    json["email"] = email;
    json["password"] = password;

    QNetworkReply *reply = m_manager->post(loginRequest, QJsonDocument(json).toJson());

    connect(reply, &QNetworkReply::finished, this, [this, reply]() {
        reply->deleteLater();

        QByteArray responseBytes = reply->readAll();
        QJsonObject responseObj = QJsonDocument::fromJson(responseBytes).object();

        if (reply->error() == QNetworkReply::NoError) {
            QString token = responseObj["message"].toString();

            if (!token.isEmpty()) {
                saveSession(true);
                emit loginSuccesful();
                fetchPFP();
            }
        } else {
            QString serverMessage = responseObj["message"].toString();

            if (serverMessage == "email not found") setServerMessage("Email does not exist");
            else setServerMessage("Wrong password");
        }
    });
}

void SessionManager::logoutUser() {
    setServerMessage("");

    QUrl logoutUrl("http://localhost:18080/log_out");
    QNetworkRequest logoutRequest(logoutUrl);
    logoutRequest.setHeader(QNetworkRequest::ContentTypeHeader, "application/json");

    QNetworkReply *reply = m_manager->post(logoutRequest, "{}");

    if (m_manager && m_manager->cookieJar())
        m_manager->setCookieJar(new QNetworkCookieJar(this));

    saveSession(false);

    connect(reply, &QNetworkReply::finished, this, [reply]() {
        reply->deleteLater();
    });
}

void SessionManager::fetchPFP() {
    if (!SessionManager::instance() || !SessionManager::instance()->hasActiveSession()) return;

    QUrl getPFPLink("http://localhost:18080/get_profile_photo");
    QNetworkRequest PfpRequest(getPFPLink);

    PfpRequest.setHeader(QNetworkRequest::UserAgentHeader, "OffGrid-Desktop-App/1.0");

    QNetworkReply *reply = m_manager->get(PfpRequest);

    connect(reply, &QNetworkReply::finished, this, [this, reply]() {
        reply->deleteLater();

        int statusCode = reply->attribute(QNetworkRequest::HttpStatusCodeAttribute).toInt();

        if (reply->error() == QNetworkReply::NoError) {
            QByteArray imageBlob = reply->readAll();

            if (imageBlob.isEmpty()) {
                qDebug() << "ERROR: Server returned empty profile picture file";
                return;
            }

            QString appDataDir = QStandardPaths::writableLocation(QStandardPaths::AppDataLocation);
            QString path = appDataDir + "/profile_photo.jpg";

            QFile file(path);
            if (file.open(QIODevice::WriteOnly)) {
                file.write(imageBlob);
                file.close();

                emit pfpChanged();
            } else qDebug() << "Profile picture photo can't be written on disk";
        }
    });
}

QString SessionManager::getPFP() {
    if (!SessionManager::instance() || !SessionManager::instance()->hasActiveSession()) return "assets/MockUserImg.jpg";

    QString appDataDir = QStandardPaths::writableLocation(QStandardPaths::AppDataLocation);
    QString path = appDataDir + "/profile_photo.jpg";

    if (QFile::exists(path))
        return "file:///" + path + "?t=" + QString::number(QDateTime::currentMSecsSinceEpoch());

    return "assets/MockUserImg.jpg";
}

void SessionManager::changePFP(const QUrl &fileUrl) {
    if (!SessionManager::instance() || !SessionManager::instance()->hasActiveSession()) return;

    QUrl changeUserPhotoUrl("http://localhost:18080/upload_photo");

    QString localPath = fileUrl.toLocalFile();
    if (localPath.isEmpty()) return;

    QFile *file = new QFile(localPath);
    if (!file->open(QIODevice::ReadOnly)) {
        delete file;
        return;
    }

    QFileInfo fileInfo(*file);

    QHttpMultiPart *multiPart = new QHttpMultiPart(QHttpMultiPart::FormDataType);
    QHttpPart photoPart;

    QString dispositionHeader = QString("form-data; name=\"photo\"; filename=\"%1\"").arg(fileInfo.fileName());
    photoPart.setHeader(QNetworkRequest::ContentDispositionHeader, QVariant(dispositionHeader));

    QMimeDatabase mimeDb;
    QMimeType mimeType = mimeDb.mimeTypeForFile(fileInfo);
    photoPart.setHeader(QNetworkRequest::ContentTypeHeader, QVariant(mimeType.name()));

    photoPart.setBodyDevice(file);
    file->setParent(multiPart);
    multiPart->append(photoPart);

    QNetworkRequest request(changeUserPhotoUrl);

    QNetworkReply *reply = m_manager->post(request, multiPart);
    multiPart->setParent(reply);

    connect(reply, &QNetworkReply::finished, this, [this, reply]() {
        reply->deleteLater();

        if (reply->error() == QNetworkReply::NoError) fetchPFP();
    });
}

void SessionManager::changeUsername(const QString &newUsername, const QString &password) {
    if (newUsername == "" || password == "") {
        setUsernameError("Please fill in all the fields.");
        return;
    }

    QUrl changeUsernameUrl("http://localhost:18080/change_username");
    QNetworkRequest changeUsernameRequest(changeUsernameUrl);
    changeUsernameRequest.setHeader(QNetworkRequest::ContentTypeHeader, "application/json");

    QJsonObject json;
    json["username"] = newUsername; json["password"] = password;

    QByteArray customVerb("PATCH");
    QNetworkReply *reply = m_manager->sendCustomRequest(changeUsernameRequest, customVerb, QJsonDocument(json).toJson());

    connect(reply, &QNetworkReply::finished, this, [this, reply]() {
        reply->deleteLater();

        QByteArray responseBytes = reply->readAll();
        QJsonObject responseObj = QJsonDocument::fromJson(responseBytes).object();

        QString token = responseObj["message"].toString();

        setUsernameError(token);
    });
}

void SessionManager::changePassword(const QString &currentPassword, const QString &newPassword) {
    if (currentPassword == "" || newPassword == "") {
        setUsernameError("Please fill in all the fields.");
        return;
    }

    QUrl changePasswordUrl("http://localhost:18080/change_password");
    QNetworkRequest changePasswordRequest(changePasswordUrl);
    changePasswordRequest.setHeader(QNetworkRequest::ContentTypeHeader, "application/json");

    QJsonObject json;
    json["current_password"] = currentPassword; json["new_password"] = newPassword;

    QByteArray customVerb("PATCH");
    QNetworkReply *reply = m_manager->sendCustomRequest(changePasswordRequest, customVerb, QJsonDocument(json).toJson());

    connect(reply, &QNetworkReply::finished, this, [this, reply]() {
        reply->deleteLater();

        QByteArray responseBytes = reply->readAll();
        QJsonObject responseObj = QJsonDocument::fromJson(responseBytes).object();

        QString token = responseObj["message"].toString();

        setPasswordError(token);
        qDebug() << m_passwordError;
    });
}