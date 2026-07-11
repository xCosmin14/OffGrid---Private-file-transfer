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

    Q_PROPERTY(bool hasActiveSession READ hasActiveSession NOTIFY hasActiveSessionChanged)

    Q_PROPERTY(QString pfp READ getPFP NOTIFY pfpChanged)

    Q_PROPERTY(QString usernameError READ usernameError WRITE setUsernameError NOTIFY usernameErrorChanged)
    Q_PROPERTY(QString passwordError READ passwordError WRITE setPasswordError NOTIFY passwordErrorChanged)

    private:
        static SessionManager* m_instance;

        QString m_serverMessage = "";
        QString m_usernameError= "", m_passwordError = "";

        bool m_hasActiveSession = false;

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
        QString usernameError() const { return m_usernameError; }
        QString passwordError() const { return m_passwordError; }

        QString getPFP();
        Q_INVOKABLE void fetchPFP();
        Q_INVOKABLE void changePFP(const QUrl &fileUrl);

        Q_INVOKABLE void changeUsername(const QString &newUsername, const QString &password);
        Q_INVOKABLE void changePassword(const QString &currentPassword, const QString &newPassword);

    public slots:
        void setServerMessage(const QString &message) {
            if (m_serverMessage != message) {
                m_serverMessage = message;
                emit serverMessageChanged();
            }
        }

        void setUsernameError(const QString &message) {
            if (m_usernameError != message) {
                m_usernameError = message;
                emit usernameErrorChanged();
            }
        }

        void setPasswordError(const QString &message) {
            if (m_passwordError != message) {
                m_passwordError = message;
                emit passwordErrorChanged();
            }
        }

    signals:
        void serverMessageChanged();
        void hasActiveSessionChanged();

        void registrationSuccessful();
        void loginSuccesful();

        void pfpChanged();

        void usernameErrorChanged();
        void passwordErrorChanged();
};