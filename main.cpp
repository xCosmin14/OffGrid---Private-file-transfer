#include <QGuiApplication>
#include <QQmlApplicationEngine>
#include <QQmlContext>

#include "SessionManager.h"
#include "TextFiltering.h"
#include "Files/FileOps.h"

int main(int argc, char *argv[]) {
    QGuiApplication app(argc, argv);

    app.setOrganizationName("OffGrid");
    app.setApplicationName("Demo1");

    QQmlApplicationEngine engine;

    SessionManager sessionManager;
    TextFiltering textFilters;
    FileOps handleUploads;

    engine.rootContext()->setContextProperty("sessionMgr", &sessionManager);
    engine.rootContext()->setContextProperty("textFiltering", &textFilters);
    engine.rootContext()->setContextProperty("handleUploads", &handleUploads);

    engine.load(QUrl(QStringLiteral("qrc:/qt/qml/Demo1/Main.qml")));

    return app.exec();
}