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

    signals:
        void uploadProgressChanged(bool isUploading, int progress, double loaded, double total, const QString &currentFile, int fileIndex, int totalFiles);
        void uploadProgressUpdate(bool isUploading, int progressPercent, double loadedMB, double totalMB, QString currentFile, int fileIndex, int totalFiles);
};