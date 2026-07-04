import QtQuick
import QtQuick.Layouts

Item {
    id: pageRoot
    property string pageTitle: "My Files"

    Rectangle {
        anchors.fill: parent
        color: "transparent"

        AddFile {
            id: addFileBtn
            anchors.top: parent.top
            anchors.left: parent.left
            anchors.topMargin: 12
            anchors.leftMargin: 10
        }

        Filters {
            anchors.top: parent.top
            anchors.topMargin: 11
            anchors.left: parent.left
            anchors.leftMargin: 64
        }
    }
}