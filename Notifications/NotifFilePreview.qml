import QtQuick
import QtQuick.Layouts
import Qt5Compat.GraphicalEffects

Rectangle {
    id: previewRoot

    property string fileType: "folder"
    property string fileName: "Nume folder"

    Layout.fillWidth: true
    height: 40
    Layout.topMargin: 5
    radius: 8

    color: mouseArea.containsMouse ? root.boxBgCol : root.bgCol
    Behavior on color { ColorAnimation { duration: 300 } }

    RowLayout {
        anchors.fill: parent
        spacing: 0

        Item {
            Layout.preferredWidth: 32
            Layout.preferredHeight: 32
            Layout.leftMargin: 10
            Layout.alignment: Qt.AlignVCenter

            Image {
                id: fileIcon
                source: "../assets/svg/FileIcons/UserFiles.svg" //: "..assets/svg/FileIcons/" + previewRoot.fileType + ".svg"
                anchors.fill: parent
                fillMode: Image.PreserveAspectFit
                visible: false
            }
            ColorOverlay {
                anchors.fill: fileIcon
                source: fileIcon
                color: mouseArea.containsMouse ? root.hoverCol : root.text
                Behavior on color { ColorAnimation { duration: 300 } }
            }
        }

        Text {
            text: previewRoot.fileName
            color: mouseArea.containsMouse ? root.hoverCol : root.text
            font.pixelSize: 14
            font.bold: true
            Layout.leftMargin: 10
            Layout.topMargin: -3
            Behavior on color { ColorAnimation { duration: 300 } }
        }

        Item { Layout.fillWidth: true }
    }

    MouseArea {
        id: mouseArea
        anchors.fill: parent
        hoverEnabled: true
        cursorShape: Qt.PointingHandCursor
    }
}