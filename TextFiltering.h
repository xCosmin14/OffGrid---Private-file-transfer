#ifndef TEXTFILTERING_H
#define TEXTFILTERING_H

#include <QObject>
#include <QString>
#include <QDate>

class TextFiltering : public QObject {
    Q_OBJECT

    public:
        explicit TextFiltering(QObject *parent = nullptr) : QObject(parent){};

        Q_INVOKABLE QString TransformAlpha(const QString &original) {
            QString result;
            result.reserve(original.size());

            for (const QChar &ch : original)
                if (ch.isLetter() || ch.isSpace()) result.append(ch);

            return result;
        }

        Q_INVOKABLE QString TransformNumber(const QString &original) {
            QString result;
            result.reserve(original.size());

            for (const QChar &ch : original)
                if (ch.isDigit()) result.append(ch);

            return result;
        }

        Q_INVOKABLE QString TransformAlphaNumeric(const QString &original) {
            QString result;
            result.reserve(original.size());

            for (const QChar &ch : original)
                if (ch.isLetterOrNumber() || ch.isSpace()) result.append(ch);

            return result;
        }

        Q_INVOKABLE QString TransformEmail(const QString &original) {
            QString result;
            result.reserve(original.size());

            for (const QChar &ch : original)
                if (ch.isLetterOrNumber() || ch == "." || ch == "@") result.append(ch);

            return result;
        }

        Q_INVOKABLE QString TransformComplex(const QString &original) {
            QString result;
            result.reserve(original.size());

            QString extraSpecial = "!#$%^?@.-_+";

            for (const QChar &ch : original)
                if (ch.isLetterOrNumber() || extraSpecial.contains(ch)) result.append(ch);

            return result;
        }

        Q_INVOKABLE QString TransformDate(const QString &original) {
            QString digits;
            digits.reserve(8);

            for (const QChar &ch : original)
                if (ch.isDigit()) digits.append(ch);

            if (digits.length() > 8) digits = digits.left(8);

            QString result;
            result.reserve(14);

            if (digits.length() <= 2) result = digits;
            else if (digits.length() <= 4) result = digits.left(2) + "/" + digits.mid(2);
            else result = digits.left(2) + "/" + digits.mid(2, 2) + "/" + digits.mid(4);

            return result;
        }
};
#endif
