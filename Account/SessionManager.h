#pragma once
#include <QObject>
#include <QFile>
#include <QDir>

class SessionManager : public QObject
{
    Q_OBJECT
    Q_PROPERTY(bool hasActiveSession READ hasActiveSession NOTIFY hasActiveSessionChanged)

public:
    explicit SessionManager(QObject *parent = nullptr);

    bool hasActiveSession() const { return m_hasActiveSession; }

    Q_INVOKABLE void checkSession();

signals:
    void hasActiveSessionChanged();

private:
    bool m_hasActiveSession = false;
};