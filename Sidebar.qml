import QtQuick
import QtQuick.Layouts
import QtQuick.Controls

Rectangle {
    id: menu

    property bool isMobile: root.width <= 500
    implicitWidth: isMobile ? root.width : 220
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
        Layout.preferredHeight: isMobile ? 48 : 40
        Layout.alignment: isMobile ? Qt.AlignHCenter : Qt.AlignLeft
        Layout.leftMargin: isMobile ? 0 : 24
        Layout.bottomMargin: isMobile ? 18 : 12

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
                icon.width: isMobile ? 28 : 24
                icon.height: isMobile ? 28 : 24
                background: null
                enabled: false
                Layout.alignment: Qt.AlignVCenter
            }

            Text {
                text: itemRoot.label
                color: itemRoot.contentColor
                font.pixelSize: isMobile ? 22 : 20
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
        anchors.topMargin: isMobile ? 60 : 0
        spacing: 0

        RowLayout {
            visible: menu.isMobile
            Layout.alignment: Qt.AlignHCenter
            Layout.topMargin: 24
            Layout.bottomMargin: 24
            spacing: 12

            Rectangle {
                width: 48
                height: 48
                radius: width / 2
                clip: true

                Image {
                    source: "assets/MockUserImg.jpg"
                    anchors.fill: parent
                    fillMode: Image.PreserveAspectCrop
                }
            }

            Text {
                text: "Nume Prenume"
                color: root.text
                font.pixelSize: 24
                font.bold: true
            }

            MouseArea {
                anchors.fill: parent
                cursorShape: Qt.PointingHandCursor
                onClicked: {
                    root.currentPath = "/settings"
                }
            }
        }

        Item {
            visible: !menu.isMobile
            Layout.preferredHeight: 64
        }

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
            Layout.preferredHeight: 24
            Layout.preferredWidth: 2
            Layout.alignment: menu.isMobile ? Qt.AlignHCenter : Qt.AlignLeft
            Layout.leftMargin: menu.isMobile ? 0 : 24
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
            Layout.preferredHeight: 24
            Layout.preferredWidth: 2
            Layout.alignment: menu.isMobile ? Qt.AlignHCenter : Qt.AlignLeft
            Layout.leftMargin: menu.isMobile ? 0 : 24
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