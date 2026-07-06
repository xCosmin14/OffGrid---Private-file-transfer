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

    bool fileExists = QFile::exists(path);

    bool isValid = false;
    if (fileExists) {
        QFile file(path);

        if (file.open(QIODevice::ReadOnly)) {
            QString token = file.readAll().trimmed();

            isValid = !token.isEmpty() && token != "0";
        }
    }

    if (m_hasActiveSession != isValid) {
        m_hasActiveSession = isValid;
        emit hasActiveSessionChanged();
    }
}