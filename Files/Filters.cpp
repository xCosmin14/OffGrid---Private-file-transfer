#include <QJsonObject>
#include <QString>

#include "Filters.h"

QJsonObject Filters::getDate() {
    QJsonObject date;
    date["lower"] = filterParams.value("dateLowerBound").toString();
    date["upper"] = filterParams.value("dateUpperBound").toString();

    return date;
}

QJsonObject Filters::getSize() {
    QJsonObject size;
    size["lower"] = filterParams.value("sizeLowerBound").toDouble();
    size["upper"] = filterParams.value("sizeUpperBound").toDouble();

    return size;
}

QString Filters::getName() {
    return filterParams.value("name").toString();
}

QString Filters::getExtension() {
    return filterParams.value("extension").toString();
}

void Filters::setDate(const QString &date, const QString &type) {
    if (type != "lower" && type != "upper") return;

    if (type == "lower") filterParams["dateLowerBound"] = date;
    else filterParams["dateUpperBound"] = date;
}

void Filters::setSize(double size, const QString &type) {
    if (type != "lower" && type != "upper") return;

    if (type == "lower") filterParams["sizeLowerBound"] = size;
    else filterParams["sizeUpperBound"] = size;
}

void Filters::setName(const QString &name) {
    filterParams["name"] = name;
}

void Filters::setExtension(const QString &extension) {
    filterParams["extension"] = extension;
}

void Filters::setSentBy(const QString &user) {
    filterParams["sentBy"] = user;
}