import QtQuick
import QtQuick.Layouts
import Qt5Compat.GraphicalEffects

Rectangle {
    id: notifRoot

    property string senderName: "Nume Prenume"
    property string sendDate: "6.6.2026"

    Layout.fillWidth: true
    implicitHeight: layout.implicitHeight + 30
    color: "transparent"

    Rectangle {
        width: parent.width; height: 1
        color: root.boxShadowCol
        anchors.bottom: parent.bottom
    }

    component NotifButton: Item {
        id: btnRoot
        property string textLabel: ""
        property bool isPrimary: true
        Layout.fillWidth: true
        Layout.preferredHeight: 28

        DropShadow {
            anchors.fill: btnRect
            verticalOffset: btnMouse.containsMouse ? 6 : 0
            radius: btnMouse.containsMouse ? 12 : 0
            samples: 15
            color: root.boxShadowCol
            source: btnRect
            Behavior on verticalOffset { NumberAnimation { duration: 300 } }
            Behavior on radius { NumberAnimation { duration: 300 } }
        }

        Rectangle {
            id: btnRect
            anchors.fill: parent
            radius: 8
            color: btnRoot.isPrimary ? root.hoverCol : "transparent"
            border.color: !btnRoot.isPrimary ? root.boxShadowCol : "transparent"
            border.width: !btnRoot.isPrimary ? 1 : 0

            Text {
                anchors.centerIn: parent
                text: btnRoot.textLabel
                color: root.text
                font.pixelSize: 14
            }
        }
        MouseArea {
            id: btnMouse
            anchors.fill: parent
            hoverEnabled: true
            cursorShape: Qt.PointingHandCursor
        }
    }

    RowLayout {
        id: layout

        anchors.left: parent.left
        anchors.right: parent.right
        anchors.top: parent.top

        anchors.leftMargin: 20
        anchors.rightMargin: 20
        anchors.topMargin: 15
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
            spacing: 10

            Text {
                Layout.fillWidth: true
                text: "<a href='/userprofile' style='text-decoration:none; color:" + root.hoverCol + "; font-weight:bold;'>" + notifRoot.senderName + "</a> sent a friend request"
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

            RowLayout {
                Layout.preferredWidth: parent.width * 0.5
                Layout.topMargin: 10
                spacing: 10

                NotifButton { textLabel: "Accept"; isPrimary: true }
                NotifButton { textLabel: "Delete"; isPrimary: false }
            }
        }
    }
}