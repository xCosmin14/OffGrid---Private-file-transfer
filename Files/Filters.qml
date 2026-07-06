import QtQuick
import QtQuick.Layouts
import QtQuick.Controls

Rectangle {
    id: filterRoot

    implicitWidth: row.implicitWidth + 40
    height: 40

    color: root.menuBgCol
    border.color: "white"
    border.width: 1

    radius: 25

    property bool userFilter: (root.currentPath === "/myfiles/shared" || root.currentPath === "/myfiles/favorites" || root.currentPath === "/myfiles/trash")

    RowLayout {
        id: row
        anchors.fill: parent
        anchors.leftMargin: 20
        anchors.rightMargin: 20
        spacing: 15

        Text { text: "Date"; color: root.text; font.bold: true }
        Text { text: "from:"; color: root.text; opacity: 0.8 }

        TextField {
                    id: dateFromInput
                    horizontalAlignment: TextInput.AlignHCenter
                    rightPadding: 30
                    Layout.preferredWidth: 120
                    Layout.preferredHeight: 28
                    color: root.text

                    background: Rectangle {
                        color: "transparent"
                        radius: 5
                        border.color: parent.activeFocus ? root.hoverCol : root.boxShadowCol
                        border.width: 1
                    }

                    Text {
                        anchors.right: parent.right
                        anchors.rightMargin: 8
                        anchors.verticalCenter: parent.verticalCenter
                        text: "📅"
                        font.pixelSize: 14
                        opacity: calMouseArea1.containsMouse ? 1.0 : 0.6
                        z: 99

                        MouseArea {
                            id: calMouseArea1
                            anchors.fill: parent
                            hoverEnabled: true
                            cursorShape: Qt.PointingHandCursor
                            onClicked: {
                                sharedDatePicker.targetInput = dateFromInput

                                let absolutePos = dateFromInput.mapToItem(filterRoot, 0, 0)
                                sharedDatePicker.x = absolutePos.x
                                sharedDatePicker.y = absolutePos.y + dateFromInput.height + 5

                                sharedDatePicker.open()
                            }
                        }
                    }

                    onTextEdited: {
                        let oldCursor = cursorPosition
                        let oldLength = text.length
                        text = textFiltering.TransformDate(text)
                        let deletedChars = oldLength - text.length
                        cursorPosition = Math.max(0, oldCursor - deletedChars)
                    }
                }

                Text { text: "to:"; color: root.text; opacity: 0.8 }

                TextField {
                    id: dateToInput
                    horizontalAlignment: TextInput.AlignHCenter
                    rightPadding: 30
                    Layout.preferredWidth: 120
                    Layout.preferredHeight: 28
                    color: root.text

                    background: Rectangle {
                        color: "transparent"
                        radius: 5
                        border.color: parent.activeFocus ? root.hoverCol : root.boxShadowCol
                        border.width: 1
                    }

                    Text {
                        anchors.right: parent.right
                        anchors.rightMargin: 8
                        anchors.verticalCenter: parent.verticalCenter
                        text: "📅"
                        font.pixelSize: 14
                        opacity: calMouseArea2.containsMouse ? 1.0 : 0.6
                        z: 99

                        MouseArea {
                            id: calMouseArea2
                            anchors.fill: parent
                            hoverEnabled: true
                            cursorShape: Qt.PointingHandCursor
                            onClicked: {
                                sharedDatePicker.targetInput = dateToInput

                                let absolutePos = dateToInput.mapToItem(filterRoot, 0, 0)
                                sharedDatePicker.x = absolutePos.x
                                sharedDatePicker.y = absolutePos.y + dateToInput.height + 5

                                sharedDatePicker.open()
                            }
                        }
                    }

                    onTextEdited: {
                        let oldCursor = cursorPosition
                        let oldLength = text.length
                        text = textFiltering.TransformDate(text)
                        let deletedChars = oldLength - text.length
                        cursorPosition = Math.max(0, oldCursor - deletedChars)
                    }
                }

        Rectangle { width: 1; height: 20; color: root.text }

        Text { text: "Size (MB)"; color: root.text; font.bold: true }
        Text { text: "from:"; color: root.text; opacity: 0.8 }
        TextField {
            horizontalAlignment: TextInput.AlignHCenter
            Layout.preferredWidth: 80
            Layout.preferredHeight: 28
            color: root.text

            background: Rectangle {
                color: "transparent"
                radius: 5
                border.color: parent.activeFocus ? root.hoverCol : root.boxShadowCol
                border.width: 1
            }

            onTextEdited: {
                let oldCursor = cursorPosition
                let oldLength = text.length
                text = textFiltering.TransformNumber(text)
                let deletedChars = oldLength - text.length
                cursorPosition = Math.max(0, oldCursor - deletedChars)
            }
        }

        Text { text: "to:"; color: root.text; opacity: 0.8 }
        TextField {
            horizontalAlignment: TextInput.AlignHCenter
            Layout.preferredWidth: 80
            Layout.preferredHeight: 28
            color: root.text

            background: Rectangle {
                color: "transparent"
                radius: 5
                border.color: parent.activeFocus ? root.hoverCol : root.boxShadowCol
                border.width: 1
            }

            onTextEdited: {
                let oldCursor = cursorPosition
                let oldLength = text.length
                text = textFiltering.TransformNumber(text)
                let deletedChars = oldLength - text.length
                cursorPosition = Math.max(0, oldCursor - deletedChars)
            }
        }

        Rectangle { width: 1; height: 20; color: root.text }

        Text { text: "Extension:"; color: root.text; font.bold: true }
        ComboBox {
            model: [".pptx", ".png"]
            Layout.preferredWidth: 100
            Layout.preferredHeight: 28

            background: Rectangle {
                color: "transparent"
                radius: 5
                border.color: parent.activeFocus ? root.hoverCol : root.boxShadowCol
                border.width: 1
            }

            contentItem: Text { text: parent.currentText; color: root.text; verticalAlignment: Text.AlignVCenter; leftPadding: 10 }
        }

        Rectangle { width: 1; height: 20; color: root.text; visible: userFilter }

        Text { text: "Sent by:"; color: root.text; font.bold: true; visible: userFilter }
        TextField {
            Layout.preferredWidth: 140
            Layout.preferredHeight: 28
            color: root.text
            visible: userFilter

            background: Rectangle {
                color: "transparent"
                radius: 5
                border.color: parent.activeFocus ? root.hoverCol : root.boxShadowCol
                border.width: 1
            }
        }
    }

    CustomDatePicker {
        id: sharedDatePicker
        property var targetInput: null

        onDateAccepted: function(formattedDate) {
            if (targetInput) {
                targetInput.text = formattedDate
            }
        }
    }
}