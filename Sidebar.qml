import QtQuick
import QtQuick.Layouts
import QtQuick.Controls

Rectangle {
    id: menu

    implicitWidth: 220
    implicitHeight: parent.height
    color: root.menuBgCol

    component MenuItem: Rectangle {
        id: itemRoot
        property string label: ""
        property string iconSource: ""
        property string targetPath: ""

        property bool isActive: root.currentPath === targetPath
        property bool isHovered: mouseArea.containsMouse

        Layout.preferredWidth: 190
        Layout.preferredHeight: 40
        Layout.alignment: Qt.AlignLeft
        Layout.leftMargin: 15
        Layout.bottomMargin: 6

        radius: 8
        color: (isHovered || isActive) ? root.boxBgCol : "transparent"
        Behavior on color { ColorAnimation { duration: 300 } }

        property color contentColor: (isHovered || isActive) ? root.hoverCol : root.text
        Behavior on contentColor { ColorAnimation { duration: 300 } }

        RowLayout {
            anchors.fill: parent
            anchors.leftMargin: 12
            anchors.rightMargin: 12
            spacing: 12

            ToolButton {
                icon.source: itemRoot.iconSource
                icon.color: itemRoot.contentColor
                icon.width: 24
                icon.height: 24
                background: null
                enabled: false
                Layout.alignment: Qt.AlignVCenter
            }

            Text {
                text: itemRoot.label
                color: itemRoot.contentColor
                font.pixelSize: 18
                font.bold: true
                Layout.fillWidth: true
                verticalAlignment: Text.AlignVCenter
            }
        }

        MouseArea {
            id: mouseArea
            anchors.fill: parent
            hoverEnabled: true
            cursorShape: Qt.PointingHandCursor
            onClicked: {
                root.currentPath = itemRoot.targetPath
            }
        }
    }

    ColumnLayout {
        anchors.fill: parent
        anchors.topMargin: 13
        spacing: 0

        MenuItem {
            label: "My Files"
            iconSource: "assets/svg/FileIcons/MyFiles.svg"
            targetPath: "/"
        }

        MenuItem {
            label: "Shared files"
            iconSource: "assets/svg/FileIcons/UserFiles.svg"
            targetPath: "/myfiles/shared"
        }

        MenuItem {
            label: "Favorites"
            iconSource: "assets/svg/StarFull.svg"
            targetPath: "/myfiles/favorites"
        }

        Item {
            Layout.preferredHeight: 15
            Layout.preferredWidth: 2
        }

        MenuItem {
            label: "Documents"
            iconSource: "assets/svg/FileIcons/Documents.svg"
            targetPath: "/myfiles/documents"
        }

        MenuItem {
            label: "Music"
            iconSource: "assets/svg/FileIcons/MusicLibrary.svg"
            targetPath: "/myfiles/music"
        }

        MenuItem {
            label: "Photos"
            iconSource: "assets/svg/FileIcons/PhotoAlbum.svg"
            targetPath: "/myfiles/photos"
        }

        Item {
            Layout.preferredHeight: 15
            Layout.preferredWidth: 2
        }

        MenuItem {
            label: "Trash"
            iconSource: "assets/svg/FileIcons/Trash.svg"
            targetPath: "/myfiles/trash"
        }

        Item {
            Layout.fillHeight: true
        }
    }
}