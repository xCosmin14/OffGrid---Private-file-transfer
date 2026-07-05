import QtQuick
import QtQuick.Layouts
import QtQuick.Controls
import Qt5Compat.GraphicalEffects

Item {
    id: pageRoot
    property string pageTitle: "Photo album"

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

        Item {
            id: currentPathDisplay

            x: 47
            y: 55
            width: childrenRect.width
            height: 50

            property var pathModel: ["My files", "Sursa 1", "Sursa 2"]

            Row {
                id: pathRow
                spacing: 7
                anchors.verticalCenter: parent.verticalCenter

                Repeater {
                    model: currentPathDisplay.pathModel

                    delegate: Row {
                        spacing: 7
                        anchors.verticalCenter: parent.verticalCenter

                        readonly property bool isLast: index === currentPathDisplay.pathModel.length - 1

                        Rectangle {
                            id: linkBg
                            color: mouseArea.containsMouse ? root.boxBgCol : "transparent"
                            radius: 999
                            width: contentRow.implicitWidth + 30
                            height: contentRow.implicitHeight + 4
                            anchors.verticalCenter: parent.verticalCenter

                            Behavior on color { ColorAnimation { duration: 300 } }

                            Row {
                                id: contentRow
                                anchors.centerIn: parent
                                spacing: 5

                                Text {
                                    text: modelData
                                    font.pixelSize: 32
                                    font.bold: true
                                    color: mouseArea.containsMouse ? root.hoverCol : root.text
                                    anchors.verticalCenter: parent.verticalCenter

                                    Behavior on color { ColorAnimation { duration: 300 } }
                                }

                                Item {
                                    visible: isLast
                                    width: 24; height: 24
                                    anchors.verticalCenter: parent.verticalCenter

                                    Image {
                                        id: arrowDownIcon
                                        source: "../assets/svg/ArrowDown.svg"
                                        anchors.fill: parent
                                        visible: false
                                    }
                                    ColorOverlay {
                                        anchors.fill: arrowDownIcon
                                        source: arrowDownIcon
                                        color: mouseArea.containsMouse ? root.hoverCol : root.text

                                        Behavior on color { ColorAnimation { duration: 300 } }
                                    }
                                }
                            }

                            MouseArea {
                                id: mouseArea
                                anchors.fill: parent
                                hoverEnabled: true
                                cursorShape: Qt.PointingHandCursor
                                onClicked: {
                                    if (isLast) {
                                        if (pathDropdownMenu.opened) {
                                            pathDropdownMenu.close()
                                        } else {
                                            pathDropdownMenu.open()
                                        }
                                    } else {
                                        console.log("Navigating to: " + modelData)
                                    }
                                }
                            }

                            Popup {
                                id: pathDropdownMenu
                                y: parent.height + 13
                                width: 275
                                padding: 15

                                background: Rectangle {
                                    color: root.menuBgCol
                                    radius: 8
                                    border.width: 1
                                    border.color: Qt.rgba(0,0,0,0.1)
                                }

                                contentItem: Column {
                                    spacing: 15

                                    component MenuOption: Item {
                                        property string iconSrc
                                        property string label
                                        signal actionTriggered()

                                        width: parent.width
                                        height: 28

                                        Row {
                                            spacing: 12
                                            anchors.verticalCenter: parent.verticalCenter

                                            Item {
                                                width: 24; height: 24
                                                anchors.verticalCenter: parent.verticalCenter
                                                anchors.verticalCenterOffset: 2

                                                Image {
                                                    id: optIcon
                                                    source: iconSrc
                                                    anchors.fill: parent
                                                    visible: false
                                                }
                                                ColorOverlay {
                                                    anchors.fill: optIcon
                                                    source: optIcon
                                                    color: optMouseArea.containsMouse ? root.hoverCol : root.text
                                                    Behavior on color { ColorAnimation { duration: 300 } }
                                                }
                                            }

                                            Text {
                                                text: label
                                                font.pixelSize: 27
                                                font.bold: true
                                                color: optMouseArea.containsMouse ? root.hoverCol : root.text
                                                anchors.verticalCenter: parent.verticalCenter
                                                Behavior on color { ColorAnimation { duration: 300 } }
                                            }
                                        }

                                        MouseArea {
                                            id: optMouseArea
                                            anchors.fill: parent
                                            hoverEnabled: true
                                            cursorShape: Qt.PointingHandCursor
                                            onClicked: {
                                                actionTriggered()
                                                pathDropdownMenu.close()
                                            }
                                        }
                                    }

                                    component MenuDivider: Rectangle {
                                        width: parent.width
                                        height: 1
                                        color: root.boxShadowCol
                                        opacity: 0.5
                                    }

                                    MenuOption { iconSrc: "../assets/svg/FileIcons/Download.svg"; label: "Download"; onActionTriggered: console.log("Download action") }
                                    MenuDivider {}
                                    MenuOption { iconSrc: "../assets/svg/FileIcons/Rename.svg"; label: "Rename"; onActionTriggered: console.log("Rename action") }
                                    MenuOption { iconSrc: "../assets/svg/FileIcons/ChangeColor.svg"; label: "Change color"; onActionTriggered: console.log("Color action") }
                                    MenuDivider {}
                                    MenuOption { iconSrc: "../assets/svg/FileIcons/Trash.svg"; label: "Delete"; onActionTriggered: console.log("Delete action") }
                                    MenuOption { iconSrc: "../assets/svg/StarLine.svg"; label: "Add to Favorites"; onActionTriggered: console.log("Fav action") }
                                    MenuDivider {}
                                    MenuOption { iconSrc: "../assets/svg/UserIcons/Group.svg"; label: "Manage Access"; onActionTriggered: console.log("Access action") }
                                }
                            }
                        }

                        Item {
                            visible: !isLast
                            width: 36; height: 36
                            anchors.verticalCenter: parent.verticalCenter

                            Image {
                                id: arrowRightIcon
                                source: "../assets/svg/ArrowRight.svg"
                                anchors.fill: parent
                                opacity: 0.5
                                visible: false
                            }
                            ColorOverlay {
                                anchors.fill: arrowRightIcon
                                source: arrowRightIcon
                                color: root.text
                                opacity: 0.5
                            }
                        }
                    }
                }
            }
        }

        FileSizeChart {}
    }
}