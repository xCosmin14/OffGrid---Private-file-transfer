#pragma once
#include <QObject>
#include <QJsonObject>
#include <QString>

class Filters : public QObject {
    Q_OBJECT

    private:
        QJsonObject filterParams;

    public:
        explicit Filters(QObject *parent = nullptr) : QObject(parent) {
            filterParams["dateLowerBound"] = QJsonValue::Null;
            filterParams["dateUpperBound"] = QJsonValue::Null;
            filterParams["sizeLowerBound"] = QJsonValue::Null;
            filterParams["sizeUpperBound"] = QJsonValue::Null;
            filterParams["name"] = "";
            filterParams["extension"] = "";
            filterParams["sentBy"] = "";
        }

        Q_INVOKABLE QJsonObject getDate();
        Q_INVOKABLE QJsonObject getSize();
        Q_INVOKABLE QString getName();
        Q_INVOKABLE QString getExtension();

        Q_INVOKABLE void setDate(const QString &date, const QString &type);
        Q_INVOKABLE void setSize(double size, const QString &type);
        Q_INVOKABLE void setName(const QString &name);
        Q_INVOKABLE void setExtension(const QString &extension);
        Q_INVOKABLE void setSentBy(const QString &user);
};