#include "FileOps.h"
#include "SessionManager.h"

#include <cmath>
#include <QSharedPointer>

#include <QJsonObject>
#include <QJsonArray>
#include <QJsonDocument>

#include <QStandardPaths>
#include <QDir>
#include <QUrl>
#include <QFileInfo>
#include <QFile>
#include <QDirIterator>

#include <QHttpMultiPart>
#include <QHttpPart>
#include <QMimeDatabase>

#include <QTime>
#include <QTimer>

#include <QNetworkCookie>
#include <QNetworkCookieJar>
#include <functional>


struct FolderUploadState {
    QString transactionId;
    QStringList absolutePaths;
    QStringList relativePaths;
    qint64 totalBytes = 0;
    qint64 uploadedBytes = 0;
    int currentIndex = 0;

    std::function<void()> doUpload;
};


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
    QString fileName = fileInfo.fileName();

    QHttpMultiPart *multiPart = new QHttpMultiPart(QHttpMultiPart::FormDataType);
    QHttpPart filePart;

    QString dispositionHeader = QString("form-data; name=\"file\"; filename=\"%1\"").arg(fileName);
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

    connect(reply, &QNetworkReply::uploadProgress, this, [this, fileName](qint64 bytesSent, qint64 bytesTotal) {
        if (bytesTotal > 0) {
            int percentage = static_cast<int>((bytesSent * 100) / bytesTotal);
            double loadedMB = static_cast<double>(bytesSent) / (1024.0 * 1024.0);
            double totalMB = static_cast<double>(bytesTotal) / (1024.0 * 1024.0);

            emit uploadProgressChanged(true, percentage, loadedMB, totalMB, fileName, 1, 1);
        }
    });

    connect(reply, &QNetworkReply::finished, this, [this, reply]() {
        reply->deleteLater();

        if (reply->error() == QNetworkReply::NoError)
            emit uploadProgressChanged(false, 100, 0, 0, "", 1, 1);
        else
            emit uploadProgressChanged(false, 0, 0, 0, "", 1, 1);
    });
}

void FileOps::uploadFolder(const QUrl &folderUrl) {
    if (!SessionManager::instance() || !SessionManager::instance()->hasActiveSession()) return;

    QString localPath = folderUrl.toLocalFile();
    if (localPath.isEmpty()) return;

    QDir baseDir(localPath);
    QString folderName = baseDir.dirName();

    QSharedPointer<FolderUploadState> st = QSharedPointer<FolderUploadState>::create();

    QDirIterator it(localPath, QDir::Files, QDirIterator::Subdirectories);
    while (it.hasNext()) {
        it.next();

        st->totalBytes += it.fileInfo().size();

        st->absolutePaths.append(it.filePath());
        st->relativePaths.append(folderName + "/" + baseDir.relativeFilePath(it.filePath()));
    }

    if (st->absolutePaths.isEmpty()) return;

    QJsonObject pathsJson;
    pathsJson["fields"] = QJsonArray::fromStringList(st->relativePaths);

    QUrl uploadFolderUrl("http://localhost:18080/upload_folder");
    QNetworkRequest request(uploadFolderUrl);
    request.setHeader(QNetworkRequest::ContentTypeHeader, "application/json");

    QNetworkReply *reply = SessionManager::instance()->m_manager->post(request, QJsonDocument(pathsJson).toJson(QJsonDocument::Compact));
    connect(reply, &QNetworkReply::finished, this, [this, reply, st]() {
        reply->deleteLater();

        QJsonObject data = QJsonDocument::fromJson(reply->readAll()).object();

        if (reply->error() != QNetworkReply::NoError || !data.contains("transaction_id")) {
            emit uploadProgressUpdate(false, 0, 0, 0, "", 0, 0);
            qDebug() << "Upload failed:" << data["message"].toString();
            return;
        }

        st->transactionId = data["transaction_id"].toString();

        st->doUpload = [this, st]() {
            if (st->currentIndex >= st->absolutePaths.size()) {
                emit uploadProgressUpdate(false, 100, st->totalBytes / 1048576.0, st->totalBytes / 1048576.0, "", 0, 0);

                // IMPORTANT: Distrugem referința circulară pentru a elibera memoria!
                st->doUpload = nullptr;
                return;
            }

            QString absPath = st->absolutePaths[st->currentIndex];
            QString relPath = st->relativePaths[st->currentIndex];
            QFileInfo fileInfo(absPath);
            QString currentFileName = fileInfo.fileName();

            QHttpMultiPart *multiPart = new QHttpMultiPart(QHttpMultiPart::FormDataType);

            QHttpPart filePart;
            filePart.setHeader(QNetworkRequest::ContentDispositionHeader, QVariant(QString("form-data; name=\"file\"; filename=\"%1\"").arg(currentFileName)));
            QFile *file = new QFile(absPath);
            if (file->open(QIODevice::ReadOnly)) {
                filePart.setBodyDevice(file);
                file->setParent(multiPart);
                multiPart->append(filePart);
            }

            QHttpPart pathPart;
            pathPart.setHeader(QNetworkRequest::ContentDispositionHeader, QVariant("form-data; name=\"path\""));
            pathPart.setBody(relPath.toUtf8());
            multiPart->append(pathPart);

            QHttpPart txPart;
            txPart.setHeader(QNetworkRequest::ContentDispositionHeader, QVariant("form-data; name=\"transaction_Id\""));
            txPart.setBody(st->transactionId.toUtf8());
            multiPart->append(txPart);

            QUrl uploadFileUrl(QString("http://localhost:18080/upload_file?transaction_id=%1").arg(st->transactionId));
            QNetworkRequest fileReq(uploadFileUrl);

            QNetworkReply *fileReply = SessionManager::instance()->m_manager->post(fileReq, multiPart);
            multiPart->setParent(fileReply);

            connect(fileReply, &QNetworkReply::uploadProgress, this, [this, st, currentFileName](qint64 bytesSent, qint64 bytesTotal) {
                if (bytesTotal > 0) {
                    qint64 currentTotalLoaded = st->uploadedBytes + bytesSent;

                    int percentage = std::round((static_cast<double>(currentTotalLoaded) / st->totalBytes) * 100.0);
                    double loadedMB = currentTotalLoaded / 1048576.0;
                    double totalMB = st->totalBytes / 1048576.0;

                    emit uploadProgressUpdate(
                        true,
                        percentage,
                        loadedMB,
                        totalMB,
                        currentFileName,
                        st->currentIndex + 1,
                        st->absolutePaths.size()
                        );
                }
            });

            connect(fileReply, &QNetworkReply::finished, this, [this, fileReply, st, fileInfo]() {
                fileReply->deleteLater();

                if (fileReply->error() == QNetworkReply::NoError) {
                    st->uploadedBytes += fileInfo.size();
                    st->currentIndex++;

                    st->doUpload();
                } else {
                    emit uploadProgressUpdate(false, 0, 0, 0, "", 0, 0);
                    qDebug() << "Network error pe fișierul:" << fileInfo.fileName();

                    st->doUpload = nullptr;
                }
            });
        };

        st->doUpload();
    });
}