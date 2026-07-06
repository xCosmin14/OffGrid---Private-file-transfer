#include "sessionmanager.h"
#include <QStandardPaths>
#include <QDir>

SessionManager::SessionManager(QObject *parent) : QObject(parent)
{
    checkSession();
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