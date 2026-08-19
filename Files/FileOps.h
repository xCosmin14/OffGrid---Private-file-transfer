#pragma once
#include <QObject>
#include <QFile>
#include <QDir>
#include <QString>
#include <QList>
#include <QNetworkAccessManager>
#include <QNetworkRequest>
#include <QNetworkReply>
#include <QUrl>
#include <QJsonObject>
#include <QJsonDocument>
#include <QUrlQuery>
#include <QVector>

#include "Filters.h"
#include "Pages.h"

class FileOps : public QObject {
    Q_OBJECT

    private:
        QVector<QJsonObject> files, folders, displayedFiles, displayedFolders;
        bool loadingFiles;

        Filters* m_filters;
        Pages* m_pages;

    public:
        explicit FileOps(Filters* filters, Pages* pages, QObject *parent = nullptr)
            : QObject(parent), m_filters(filters), m_pages(pages) {
            loadingFiles = false;

            connect(m_filters, &Filters::filtersChanged, this, &FileOps::filterFiles);
            connect(m_pages, &Pages::currentPathChanged, this, &FileOps::filterFiles);

            connect(m_pages, &Pages::currentPathChanged, this, [this]() {
                QList arr = m_pages->getCurrentPathArr();
                if (arr.isEmpty()) sortFiles("name", "asc", "/");
                else sortFiles("name", "asc", arr[0]);
            });

            fetchFiles();
        }

        void fetchFiles();

        Q_INVOKABLE void uploadFile(const QUrl &fileUrl);
        Q_INVOKABLE void uploadFolder(const QUrl &folderUrl);
        Q_INVOKABLE void uploadFiles(const QList<QUrl> &fileUrls);

        Q_INVOKABLE void createFile(const QString &name, const QString &folderId);
        Q_INVOKABLE void createFolder(const QString &name, const QString &color, const QString &parentFolderId);

        Q_INVOKABLE void sortFiles(const QString &crit, const QString &ord, const QString &page);
        Q_INVOKABLE void filterFiles();

    signals:
        void uploadProgressChanged(bool isUploading, int progress, double loaded, double total, const QString &currentFile, int fileIndex, int totalFiles);
        void uploadProgressUpdate(bool isUploading, int progressPercent, double loadedMB, double totalMB, QString currentFile, int fileIndex, int totalFiles);
        void operationCompleted(bool completed, QString message);
};