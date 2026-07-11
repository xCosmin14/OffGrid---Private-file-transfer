#include "FileOps.h"
#include "SessionManager.h"

#include <QStandardPaths>
#include <QDir>
#include <QUrl>
#include <QFileInfo>
#include <QFile>

#include <QHttpMultiPart>
#include <QHttpPart>
#include <QMimeDatabase>

#include <QTime>
#include <QTimer>

#include <QNetworkCookie>
#include <QNetworkCookieJar>

void FileOps::uploadFile(const QUrl &fileUrl) {
    if (!SessionManager::instance() || !SessionManager::instance()->hasActiveSession()) return;

    QUrl uploadFileUrl("http://localhost:18080/upload_file");

    QString localPath = fileUrl.toLocalFile();
    if (localPath.isEmpty()) return;

    QFile *file = new QFile(localPath);
    if (!file->open(QIODevice::ReadOnly)) {
        delete file;
        return;
    }

    QFileInfo fileInfo(*file);

    QHttpMultiPart *multiPart = new QHttpMultiPart(QHttpMultiPart::FormDataType);
    QHttpPart filePart;

    QString dispositionHeader = QString("form-data; name=\"file\"; filename=\"%1\"").arg(fileInfo.fileName());
    filePart.setHeader(QNetworkRequest::ContentDispositionHeader, QVariant(dispositionHeader));

    QMimeDatabase mimeDb;
    QMimeType mimeType = mimeDb.mimeTypeForFile(fileInfo);
    filePart.setHeader(QNetworkRequest::ContentTypeHeader, QVariant(mimeType.name()));

    filePart.setBodyDevice(file);
    file->setParent(multiPart);
    multiPart->append(filePart);

    QNetworkRequest request(uploadFileUrl);

    QNetworkReply *reply = SessionManager::instance()->m_manager->post(request, multiPart);
    multiPart->setParent(reply);

    connect(reply, &QNetworkReply::finished, this, [reply]() {
        reply->deleteLater();
    });
}

void FileOps::uploadFolder(const QUrl &fileUrl) {
    if (!SessionManager::instance() || !SessionManager::instance()->hasActiveSession()) return;

    QUrl uploadFolderUrl("http://localhost:18080/upload_folder");
}