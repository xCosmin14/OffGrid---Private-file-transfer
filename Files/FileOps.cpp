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

struct MultipleFileUploadState {
    QStringList localPaths;
    qint64 totalBytes = 0, uploadedBytes = 0;
    std::size_t currentIndex = 0;

    std::function<void()> doUpload;
};

struct FolderUploadState {
    QString transactionId;
    QStringList absolutePaths, relativePaths;
    qint64 totalBytes = 0, uploadedBytes = 0;
    std::size_t currentIndex = 0;

    std::function<void()> doUpload;
};

void FileOps::uploadFile(const QUrl &fileUrl) {
    uploadFiles(QList<QUrl>{ fileUrl });
}

void FileOps::uploadFiles(const QList<QUrl> &fileUrls) {
    if (!SessionManager::instance() || !SessionManager::instance()->hasActiveSession()) return;
    if (fileUrls.isEmpty()) return;

    if (fileUrls.size() > 100) {
        qDebug() << "You cannot upload more than 100 files at once.";
        emit uploadProgressUpdate(false, 0, 0, 0, "", 0, 0);
        return;
    }

    QSharedPointer<MultipleFileUploadState> st = QSharedPointer<MultipleFileUploadState>::create();

    for (const QUrl &url : fileUrls) {
        QString localPath = url.toLocalFile();
        if (!localPath.isEmpty()) {
            QFileInfo fi(localPath);

            if (fi.exists() && fi.isFile()) {
                st->totalBytes += fi.size();
                st->localPaths.append(localPath);
            }
        }
    }

    if (st->localPaths.isEmpty()) return;

    const qint64 maxSizeBytes = 50ULL * 1024 * 1024 * 1024;
    if (st->totalBytes > maxSizeBytes) {
        qDebug() << "Total upload size exceeds 50GB.";
        emit uploadProgressUpdate(false, 0, 0, 0, "", 0, 0);
        return;
    }

    st->doUpload = [this, st]() {
        if (st->currentIndex >= st->localPaths.size()) {
            double totalMB = st->totalBytes / 1048576.0;
            emit uploadProgressUpdate(false, 100, totalMB, totalMB, "", 0, 0);
            st->doUpload = nullptr;
            return;
        }

        QString absPath = st->localPaths[st->currentIndex];
        QFileInfo fileInfo(absPath);
        QString fileName = fileInfo.fileName();
        QFile *file = new QFile(absPath);

        if (!file->open(QIODevice::ReadOnly)) {
            delete file;
            st->currentIndex++;
            st->doUpload();
            return;
        }

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

        QUrl uploadFileUrl("http://localhost:18080/upload_file");
        QNetworkRequest request(uploadFileUrl);

        QNetworkReply *reply = SessionManager::instance()->m_manager->post(request, multiPart);
        multiPart->setParent(reply);

        connect(reply, &QNetworkReply::uploadProgress, this, [this, st, fileName](qint64 bytesSent, qint64 bytesTotal) {
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
                    fileName,
                    st->currentIndex + 1,
                    st->localPaths.size()
                    );
            }
        });

        connect(reply, &QNetworkReply::finished, this, [this, reply, st, fileInfo]() {
            reply->deleteLater();

            if (reply->error() == QNetworkReply::NoError) {
                st->uploadedBytes += fileInfo.size();
                st->currentIndex++;
                st->doUpload();
            } else {
                emit uploadProgressUpdate(false, 0, 0, 0, "", 0, 0);
                qDebug() << "Network error pe fisierul:" << fileInfo.fileName();
                st->doUpload = nullptr;
            }
        });
    };

    st->doUpload();
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

    if (st->absolutePaths.size() > 100) {
        qDebug() << "Folders cannot contain more than 100 files.";
        emit uploadProgressUpdate(false, 0, 0, 0, "", 0, 0);
        return;
    }

    const qint64 maxSizeBytes = 50ULL * 1073741824;
    if (st->totalBytes > maxSizeBytes) {
        qDebug() << "Total upload size exceeds 50GB.";
        emit uploadProgressUpdate(false, 0, 0, 0, "", 0, 0);
        return;
    }

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
                double totalMB = st->totalBytes / 1048576.0;
                emit uploadProgressUpdate(false, 100, totalMB, totalMB, "", 0, 0);
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
                    qDebug() << "Network error pe fisierul:" << fileInfo.fileName();
                    st->doUpload = nullptr;
                }
            });
        };

        st->doUpload();
    });
}

void FileOps::createFolder(const QString &name, const QString &color, const QString &parentFolderId) {
    if (!SessionManager::instance() || !SessionManager::instance()->hasActiveSession()) return;

    QUrl createFolderUrl("http://localhost:18080/create_folder");
    QNetworkRequest request(createFolderUrl);
    request.setHeader(QNetworkRequest::ContentTypeHeader, "application/json");

    QJsonObject json;
    json["name"] = name;
    json["color"] = color;
    if (!parentFolderId.isEmpty()) json["parent_folder_id"] = parentFolderId;
    else json["parent_folder_id"] = QJsonValue::Null;


    QNetworkReply *reply = SessionManager::instance()->m_manager->post(request, QJsonDocument(json).toJson(QJsonDocument::Compact));
    connect(reply, &QNetworkReply::finished, this, [reply, this]() {
        reply->deleteLater();
        if (reply->error() == QNetworkReply::NoError)
            emit operationCompleted(true, "Folder created successfully");
        else {
            qDebug() << "Error creating folder:" << reply->errorString();
            emit operationCompleted(false, "Failed to create folder");
        }
    });
}

void FileOps::createFile(const QString &name, const QString &folderId) {
    if (!SessionManager::instance() || !SessionManager::instance()->hasActiveSession()) return;;

    QUrl createFileUrl("http://localhost:18080/create_file");
    QNetworkRequest request(createFileUrl);
    request.setHeader(QNetworkRequest::ContentTypeHeader, "application/json");

    QString fileNameWithExt = name;
    QString extWithDot = ".txt";

    if (!fileNameWithExt.toLower().endsWith(extWithDot))
        fileNameWithExt += extWithDot;

    QJsonObject json;
    json["name"] = fileNameWithExt;
    json["extension"] = "txt";
    json["content_type"] = "text/plain";
    if (!folderId.isEmpty()) json["folder_id"] = folderId;
    else json["folder_id"] = QJsonValue::Null;

    QNetworkReply *reply = SessionManager::instance()->m_manager->post(request, QJsonDocument(json).toJson(QJsonDocument::Compact));
    connect(reply, &QNetworkReply::finished, this, [reply, this]() {
        reply->deleteLater();
        if (reply->error() == QNetworkReply::NoError)
            emit operationCompleted(true, "File created successfully");
        else {
            qDebug() << "Error creating file:" << reply->errorString();
            emit operationCompleted(false, "Failed to create file");
        }
    });
}