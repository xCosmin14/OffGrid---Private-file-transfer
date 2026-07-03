import QtQuick
import QtQuick.Layouts
import QtQuick.Controls

Rectangle {
    id: header
    width: parent.width
    height: 60
    color: root.menuBgCol

    RowLayout {
        anchors.fill: parent
        anchors.leftMargin: 24
        anchors.rightMargin: 24
        spacing: 16

        RowLayout {
            spacing: 12

            Image {
                source: "assets/Logo.png"
                Layout.preferredWidth: 42
                Layout.preferredHeight: 42
            }

            Text {
                text: "OffGrid"
                font.pixelSize: 34
                color: root.text
                font.bold: true
            }
        }

        Rectangle {
            id: headerFileSearch
            Layout.preferredWidth: 300
            Layout.preferredHeight: 38
            Layout.leftMargin: 10
            color: "transparent"
            border.width: 2
            border.color: root.text
            radius: 12

            RowLayout {
                anchors.fill: parent
                anchors.leftMargin: 14
                anchors.rightMargin: 14
                spacing: 8

                TextField {
                    placeholderText: "Search files and folders..."
                    Layout.fillWidth: true
                    font.pixelSize: 16
                    color: root.text
                    background: null
                }

                ToolButton {
                    hoverEnabled: true
                    property color btnColor: hovered ? root.hoverCol : root.text
                    Behavior on btnColor { ColorAnimation { duration: 300 } }
                    HoverHandler {cursorShape: Qt.PointingHandCursor}

                    icon.source: "assets/svg/Search.svg"
                    icon.color: btnColor
                    icon.width: 32
                    icon.height: 32
                    Layout.preferredWidth: 32
                    Layout.preferredHeight: 32
                    background: null
                }
            }
        }

        Item {
            Layout.fillWidth: true
        }

        RowLayout {
            spacing: 4

            ToolButton {
                hoverEnabled: true
                property color btnColor: hovered ? root.hoverCol : root.text
                Behavior on btnColor { ColorAnimation { duration: 300 } }
                HoverHandler {cursorShape: Qt.PointingHandCursor}

                icon.source: "assets/svg/Notification.svg"
                icon.color: btnColor
                icon.width: 34
                icon.height: 34
                Layout.preferredWidth: 34
                Layout.preferredHeight: 34
                background: null
            }

            ToolButton {
                hoverEnabled: true
                property color btnColor: hovered ? root.hoverCol : root.text
                Behavior on btnColor { ColorAnimation { duration: 300 } }
                HoverHandler {cursorShape: Qt.PointingHandCursor}

                icon.source: root.lightMode ? "assets/svg/Sun.svg" : "assets/svg/Moon.svg"
                icon.color: btnColor
                icon.width: 36
                icon.height: 36
                Layout.preferredWidth: 36
                Layout.preferredHeight: 36
                background: null

                onClicked: root.lightMode = !root.lightMode
            }
        }

        Rectangle {
            id: headerVerticalLine
            Layout.preferredWidth: 1
            Layout.preferredHeight: 32
            color: root.text
        }

        Rectangle {
            id: accountSettingsToggle
            Layout.preferredWidth: 32
            Layout.preferredHeight: 32
            radius: width / 2
            clip: true

            Image {
                source: "assets/MockUserImg.jpg"
                anchors.fill: parent
                fillMode: Image.PreserveAspectCrop
            }
        }
    }
}