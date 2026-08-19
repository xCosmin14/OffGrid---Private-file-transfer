#include <QGuiApplication>
#include <QQmlApplicationEngine>
#include <QQmlContext>

#include "SessionManager.h"
#include "TextFiltering.h"

#include "Files/FileOps.h"
#include "Files/Filters.h"
#include "Pages.h"

int main(int argc, char *argv[]) {
    QGuiApplication app(argc, argv);

    app.setOrganizationName("OffGrid");
    app.setApplicationName("OffGrid");

    QQmlApplicationEngine engine;

    SessionManager sessionManager;
    TextFiltering textFilters;
    Pages pageMgr;

    Filters handleFilters;
    FileOps handleUploads(&handleFilters, &pageMgr);

    engine.rootContext()->setContextProperty("sessionMgr", &sessionManager);
    engine.rootContext()->setContextProperty("textFiltering", &textFilters);
    engine.rootContext()->setContextProperty("pageMgr", &pageMgr);

    engine.rootContext()->setContextProperty("handleUploads", &handleUploads);
    engine.rootContext()->setContextProperty("handleFilters", &handleFilters);

    sessionManager.getUserData();

    engine.load(QUrl(QStringLiteral("qrc:/qt/qml/Demo1/Main.qml")));

    return app.exec();
}