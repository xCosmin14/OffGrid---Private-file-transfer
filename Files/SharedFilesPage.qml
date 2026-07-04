import QtQuick

Item {
    id: pageRoot
    property string pageTitle: "Shared Files"

    Rectangle {
        anchors.fill: parent
        color: "transparent"

        Filters {
            anchors.top: parent.top
            anchors.topMargin: 11
            anchors.left: parent.left
            anchors.leftMargin: 64
        }
    }
}