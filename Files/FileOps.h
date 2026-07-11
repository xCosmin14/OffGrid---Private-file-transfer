#pragma once
#include <QObject>
#include <QFile>
#include <QDir>
#include <QString>
#include <QNetworkAccessManager>
#include <QNetworkRequest>
#include <QNetworkReply>
#include <QUrl>
#include <QJsonObject>
#include <QJsonDocument>
#include <QUrlQuery>

class FileOps : public QObject {
    Q_OBJECT

    private:

    public:
        Q_INVOKABLE void uploadFile(const QUrl &fileUrl);
        Q_INVOKABLE void uploadFolder(const QUrl &folderUrl);
};