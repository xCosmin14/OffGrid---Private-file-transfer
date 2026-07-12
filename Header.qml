import QtQuick
import QtQuick.Layouts
import QtQuick.Controls
import Qt5Compat.GraphicalEffects

import "Notifications"

Rectangle {
    id: header
    width: parent.width
    height: 60
    color: root.menuBgCol

    property bool notificationsOpen: false

    RowLayout {
        anchors.fill: parent
        anchors.leftMargin: 24
        anchors.rightMargin: 24
        spacing: 16

        RowLayout {
            HoverHandler {cursorShape: Qt.PointingHandCursor}
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
            visible: root.isUserLoggedIn

            HoverHandler {cursorShape: Qt.IBeamCursor}

            Layout.preferredWidth: searchInput.activeFocus ? 375 : 300
            Layout.preferredHeight: 38

            Behavior on Layout.preferredWidth { NumberAnimation { duration: 300 } }

            Layout.leftMargin: 10
            color: "transparent"
            border.width: 2
            border.color: searchInput.activeFocus ? root.hoverCol : root.text
            Behavior on border.color { ColorAnimation { duration: 300 } }
            radius: 12

            RowLayout {
                anchors.fill: parent
                anchors.leftMargin: 14
                anchors.rightMargin: 14
                spacing: 8

                TextField {
                    id: searchInput
                    placeholderText: "Search files and folders..."
                    Layout.fillWidth: true
                    font.pixelSize: 16
                    color: root.text
                    background: null

                    Keys.onEscapePressed: {
                        header.forceActiveFocus()
                    }

                    onTextEdited: {
                        let oldCursor = cursorPosition
                        let oldLength = text.length

                        text = textFiltering.TransformAlphaNumeric(text)
                        let deletedChars = oldLength - text.length
                        cursorPosition = Math.max(0, oldCursor - deletedChars)
                    }
                }

                ToolButton {
                    hoverEnabled: true
                    property color btnColor: searchInput.activeFocus || hovered ? root.hoverCol : root.text
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
                onClicked: notificationsOpen = !notificationsOpen
                visible: root.isUserLoggedIn

                icon.source: "assets/svg/Notification.svg"
                icon.color: notificationsOpen === true ? root.hoverCol : root.text
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
            Layout.alignment: Qt.AlignVCenter
        }

        RowLayout {
            id: accountSettingsToggle
            spacing: 12
            Layout.alignment: Qt.AlignVCenter

            HoverHandler {
                id: accountHoverHandler
                cursorShape: Qt.PointingHandCursor
            }
            TapHandler {
                onTapped: { root.currentPath = "/settings" }
            }

            Item {
                Layout.preferredWidth: 38
                Layout.preferredHeight: 38

                Image {
                    id: profileImage
                    anchors.fill: parent
                    source: sessionMgr.pfp
                    fillMode: Image.PreserveAspectCrop
                    visible: false
                }

                Rectangle {
                    id: profileMask
                    anchors.fill: parent
                    radius: width / 2
                    visible: false
                }

                OpacityMask {
                    anchors.fill: parent
                    source: profileImage
                    maskSource: profileMask
                }
            }

            Text {
                text: root.userData ? root.userData.username : ""
                color: accountHoverHandler.hovered ? root.hoverCol : root.text
                font.pixelSize: 18
                font.bold: true
                Layout.alignment: Qt.AlignVCenter
                Behavior on color { ColorAnimation { duration: 200 } }
            }
        }
    }

    Item {
        id: notificationsCenter

        parent: Overlay.overlay

        property bool viewAllMode: false
        property bool allRead: false
        property real frozenHeight: notifColumn.implicitHeight

        visible: header.notificationsOpen
        width: 360
        height: (notifFlickable.y + notifFlickable.height)

        anchors.top: parent.top
        anchors.right: parent.right
        anchors.topMargin: 59
        anchors.rightMargin: 244

        ShaderEffectSource {
            id: frostCapture
            sourceItem: root.contentItem
            sourceRect: Qt.rect(root.width - 360 - 244, 60, 360, notificationsCenter.height)
            visible: false
        }

        FastBlur {
            id: frostBlur
            anchors.fill: parent
            source: frostCapture
            radius: 32
        }

        Rectangle {
            anchors.fill: parent
            color: root.boxBgCol
            opacity: 0.85
            border.width: 2
            border.color: root.menuBgCol
        }

        Text {
            id: notifTitle
            color: root.text
            font.pixelSize: 36
            font.bold: true
            text: "Notifications"
            x: 20
            y: 10
        }

        RowLayout {
            id: notifHeader
            anchors.top: notifTitle.bottom
            anchors.topMargin: 35
            anchors.left: parent.left
            anchors.leftMargin: 8
            spacing: 15

            Rectangle {
                id: btnMarkRead
                Layout.preferredHeight: 32
                Layout.preferredWidth: contentMarkRead.implicitWidth + 20
                radius: 8

                color: mouseAreaRead.containsMouse ? root.boxBgCol : "transparent"
                border.width: 1
                border.color: mouseAreaRead.containsMouse ? root.boxShadowCol : "transparent"
                Behavior on color { ColorAnimation { duration: 150 } }
                Behavior on border.color { ColorAnimation { duration: 150 } }

                RowLayout {
                    id: contentMarkRead
                    anchors.centerIn: parent
                    spacing: 6

                    Item {
                        width: 20; height: 20
                        Image {
                            id: iconSeen
                            source: "assets/svg/Seen.svg"
                            width: 20; height: 20
                            visible: false
                        }
                        ColorOverlay {
                            anchors.fill: iconSeen
                            source: iconSeen
                            color: root.hoverCol
                            Behavior on color { ColorAnimation { duration: 150 } }
                        }
                    }

                    Text {
                        text: "Mark all as read"
                        color: root.text
                        font.pixelSize: 16
                        font.bold: true
                    }
                }

                MouseArea {
                    id: mouseAreaRead
                    anchors.fill: parent
                    hoverEnabled: true
                    cursorShape: Qt.PointingHandCursor
                    onClicked: notificationsCenter.allRead = true
                }
            }

            Rectangle {
                id: btnViewAll
                Layout.preferredHeight: 32
                Layout.preferredWidth: contentViewAll.implicitWidth + 20
                radius: 8

                color: mouseAreaView.containsMouse ? root.boxBgCol : "transparent"
                border.width: 1
                border.color: mouseAreaView.containsMouse ? root.boxShadowCol : "transparent"
                Behavior on color { ColorAnimation { duration: 150 } }
                Behavior on border.color { ColorAnimation { duration: 150 } }

                Text {
                    id: contentViewAll
                    anchors.centerIn: parent
                    text: "View all"
                    color: root.text
                    font.pixelSize: 16
                    font.bold: true
                }

                MouseArea {
                    id: mouseAreaView
                    anchors.fill: parent
                    hoverEnabled: true
                    cursorShape: Qt.PointingHandCursor
                    onClicked: {
                        notificationsCenter.frozenHeight = notifColumn.implicitHeight
                        notificationsCenter.viewAllMode = true
                    }
                }
            }
        }

        Flickable {
            id: notifFlickable
            anchors.top: notifHeader.bottom
            anchors.topMargin: 15
            anchors.left: parent.left
            anchors.right: parent.right

            height: Math.min(notificationsCenter.frozenHeight, 550)
            contentHeight: notifColumn.implicitHeight
            clip: true

            visible: !notificationsCenter.allRead

            interactive: notificationsCenter.viewAllMode
            boundsBehavior: Flickable.StopAtBounds

            ScrollBar.vertical: ScrollBar {
                id: notifScrollBar
                active: notificationsCenter.viewAllMode
                policy: notificationsCenter.viewAllMode ? ScrollBar.AlwaysOn : ScrollBar.AsNeeded

                property real scrollProgress: size < 1 ? position / (1 - size) : 0

                contentItem: Item {}

                background: Rectangle {
                    implicitWidth: 4
                    radius: 2
                    color: root.boxShadowCol

                    Rectangle {
                        anchors.top: parent.top
                        width: parent.width
                        height: parent.height * notifScrollBar.scrollProgress
                        radius: 2
                        color: root.hoverCol
                    }
                }
            }

            ColumnLayout {
                id: notifColumn
                width: parent.width
                spacing: 0

                AcceptFriendNotification {
                    senderName: "Nume Prenume"; sendDate: "6.6.2026"
                }

                ActionNotification {
                    senderName: "Nume Prenume"; sendDate: "6.6.2026"
                }

                FilePreviewNotification {
                    senderName: "Nume Prenume"; sendDate: "6.6.2026"
                    actionType: 0; fileType: "folder"
                }

                FilePreviewNotification {
                    senderName: "Nume Prenume"; sendDate: "6.6.2026"
                    actionType: 1; fileType: "pdf"
                }

                FilePreviewNotification {
                    visible: notificationsCenter.viewAllMode
                    senderName: "Nume Prenume"; sendDate: "6.6.2026"
                    actionType: 1; fileType: "apk"
                }

                TextNotification {
                    visible: notificationsCenter.viewAllMode
                    senderName: "Nume Prenume"; sendDate: "6.6.2026"
                    actionType: 0
                }

                TextNotification {
                    visible: notificationsCenter.viewAllMode
                    senderName: "Nume Prenume"; sendDate: "6.6.2026"
                    actionType: 1
                }

                TextNotification {
                    visible: notificationsCenter.viewAllMode
                    senderName: "Nume Prenume"; sendDate: "6.6.2026"
                    actionType: 2
                }
            }
        }
    }
}