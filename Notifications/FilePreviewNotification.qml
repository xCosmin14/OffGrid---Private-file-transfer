import QtQuick
import QtQuick.Layouts
import Qt5Compat.GraphicalEffects

Rectangle {
    id: notifRoot

    property string senderName: "Nume Prenume"
    property string sendDate: "6.6.2026"
    property int actionType: 0
    property string fileType: "folder"
    property string fileName: "Nume folder"

    Layout.fillWidth: true
    implicitHeight: layout.implicitHeight + 30
    color: "transparent"

    Rectangle {
        width: parent.width; height: 1
        color: root.boxShadowCol
        anchors.bottom: parent.bottom
    }

    RowLayout {
        id: layout

        anchors.left: parent.left
        anchors.right: parent.right
        anchors.top: parent.top

        anchors.leftMargin: 20
        anchors.rightMargin: 20
        anchors.topMargin: 10
        anchors.bottomMargin: 15
        spacing: 15

        Item {
            Layout.preferredWidth: 36
            Layout.preferredHeight: 36
            Layout.alignment: Qt.AlignTop

            Image {
                id: profileImg
                source: "../assets/MockUserImg.jpg"
                anchors.fill: parent
                fillMode: Image.PreserveAspectCrop
                visible: false
            }
            Rectangle { id: mask; anchors.fill: parent; radius: 18; visible: false }
            OpacityMask {
                anchors.fill: parent
                source: profileImg
                maskSource: mask

                MouseArea {
                    anchors.fill: parent
                    cursorShape: Qt.PointingHandCursor
                    onClicked: root.currentPath = "/userprofile"
                }
            }
        }

        ColumnLayout {
            Layout.fillWidth: true
            Layout.alignment: Qt.AlignTop
            Layout.topMargin: -5
            spacing: 15

            Text {
                Layout.fillWidth: true
                text: "<a href='/userprofile' style='text-decoration:none; color:" + root.hoverCol + "; font-weight:bold;'>" + notifRoot.senderName + "</a> " + (notifRoot.actionType === 0 ? "uploaded a file in FOLDER" : "sent a file/folder")
                color: root.text
                font.pixelSize: 16
                font.weight: Font.DemiBold
                textFormat: Text.RichText
                wrapMode: Text.WordWrap
                onLinkActivated: (link) => root.currentPath = link
                HoverHandler { cursorShape: parent.hoveredLink ? Qt.PointingHandCursor : Qt.ArrowCursor }
            }

            Text {
                text: notifRoot.sendDate
                color: root.text
                opacity: 0.8
                font.pixelSize: 13
                font.weight: Font.DemiBold
            }

            NotifFilePreview {
                fileType: notifRoot.fileType
                fileName: notifRoot.fileName
            }
        }
    }
}