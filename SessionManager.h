#pragma once
#include <QObject>
#include <QFile>
#include <QDir>
#include <QString>
#include <QNetworkAccessManager>
#include <QNetworkRequest>
#include <QNetworkReply>
#include <QUrl>
#include <QJsonObject>
#include <QJsonDocument>
#include <QUrlQuery>

class SessionManager : public QObject {
    Q_OBJECT

    Q_PROPERTY(QString serverMessage READ serverMessage WRITE setServerMessage NOTIFY serverMessageChanged)
    Q_PROPERTY(QString pfp READ getPFP NOTIFY pfpChanged)
    Q_PROPERTY(bool hasActiveSession READ hasActiveSession NOTIFY hasActiveSessionChanged)

    public:
        explicit SessionManager(QObject *parent = nullptr);
        QNetworkAccessManager *m_manager = nullptr;

        ~SessionManager(){};

        static SessionManager* instance();

        Q_INVOKABLE void checkSession();
        Q_INVOKABLE void saveSession(bool isLoggedIn);

        Q_INVOKABLE void registerUser(const QString &username, const QString &email, const QString &password, const QString &confirmPassword, const QString &inviteCode);
        Q_INVOKABLE void loginUser(const QString &email, const QString &password);
        Q_INVOKABLE void logoutUser();

        Q_INVOKABLE bool hasActiveSession() const { return m_hasActiveSession; }
        QString serverMessage() const { return m_serverMessage; }

        QString getPFP();
        Q_INVOKABLE void fetchPFP();
        Q_INVOKABLE void changePFP(const QUrl &fileUrl);

    public slots:
        void setServerMessage(const QString &message) {
            if (m_serverMessage != message) {
                m_serverMessage = message;
                emit serverMessageChanged();
            }
        }

    private:
        static SessionManager* m_instance;

        QString m_serverMessage = "";
        bool m_hasActiveSession = false;

    signals:
        void serverMessageChanged();
        void hasActiveSessionChanged();

        void registrationSuccessful();
        void loginSuccesful();

        void pfpChanged();
};