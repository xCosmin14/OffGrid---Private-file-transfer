import QtQuick

Item {
    id: pageRoot
    property string pageTitle: "Favourites"

    Rectangle {
        anchors.fill: parent
        color: "transparent"

        Filters{}
    }
}