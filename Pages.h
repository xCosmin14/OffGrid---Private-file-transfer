#pragma once

#include <QObject>
#include <QString>
#include <QVector>
#include <qdebug.h>

class Pages : public QObject {
    Q_OBJECT
    Q_PROPERTY(QString currentPath READ getCurrentPath WRITE setCurrentPath NOTIFY currentPathChanged)
    Q_PROPERTY(QVector<QString> currentPathArr READ getCurrentPathArr NOTIFY currentPathChanged)

    private:
        QString currentPathStr;
        QVector<QString> currentPathArr;

    public:
        explicit Pages(QObject *parent = nullptr) : QObject(parent) {
            setCurrentPath("/");
        }

        QString getCurrentPath() const { return currentPathStr; }

        QVector<QString> getCurrentPathArr() const { return currentPathArr; }

        Q_INVOKABLE void setCurrentPath(const QString &path) {
            if (currentPathStr == path) return;

            currentPathStr = path;
            currentPathArr = path.split('/', Qt::SkipEmptyParts);

            emit currentPathChanged();
        }

    signals:
        void currentPathChanged();
};