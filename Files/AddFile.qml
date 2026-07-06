import QtQuick
import QtQuick.Layouts
import QtQuick.Controls
import QtQuick.Dialogs

Item {
    id: addFileRoot

    width: 40
    height: 40
    z: 99

    property bool showMenu: false

    ToolButton {
        id: roundButton
        width: 40
        height: 40
        padding: 0

        onClicked: showMenu = !showMenu
        HoverHandler {cursorShape: Qt.PointingHandCursor}

        background: Rectangle {
            color: "transparent"
            border.width: 2
            border.color: (roundButton.hovered || showMenu) ? root.hoverCol : root.text
            radius: width / 2
        }

        icon.source: "../assets/svg/FileIcons/Add.svg"
        icon.width: 24
        icon.height: 24
        icon.color: (roundButton.hovered || showMenu) ? root.hoverCol : root.text
    }

    Rectangle {
        id: fileUploadMenu
        visible: showMenu
        anchors.top: roundButton.bottom
        anchors.topMargin: 10
        anchors.left: roundButton.left
        width: 300
        height: 255

        color: root.menuBgCol
        radius: 8
        border.color: root.boxShadowCol
        opacity: 0.95

        ColumnLayout {
            anchors.fill: parent
            anchors.margins: 10
            spacing: 5

            MenuOption {
                iconSource: "../assets/svg/FileIcons/UploadFile.svg"
                text: "Upload file"
                onClicked: fileDialog.open()
            }

            Rectangle { height: 2; width: parent.width; color: root.boxShadowCol }

            MenuOption {
                iconSource: "../assets/svg/FileIcons/Folder.svg"
                text: "Create folder"
                onClicked: console.log("Create folder")
            }

            MenuOption {
                iconSource: "../assets/svg/FileIcons/Folder.svg"
                text: "Upload folder"
                onClicked: folderDialog.open()
            }

            Rectangle { height: 2; width: parent.width; color: root.boxShadowCol }

            MenuOption {
                iconSource: "../assets/svg/FileIcons/TextFile.svg"
                text: "Create Text file"
            }

            MenuOption {
                iconSource: "../assets/svg/FileIcons/TextFile.svg"
                text: "Create Markdown file"
            }
        }
    }
}