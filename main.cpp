#include <QGuiApplication>
#include <QQmlApplicationEngine>
#include <QQmlContext>
#include "Account/SessionManager.h"

int main(int argc, char *argv[]) {
    QGuiApplication app(argc, argv);

    app.setOrganizationName("OffGrid");
    app.setApplicationName("Demo1");

    QQmlApplicationEngine engine;

    SessionManager sessionManager;
    engine.rootContext()->setContextProperty("sessionMgr", &sessionManager);

    engine.load(QUrl(QStringLiteral("qrc:/qt/qml/Demo1/Main.qml")));

    return app.exec();
}