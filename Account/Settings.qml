import QtQuick
import QtQuick.Layouts
import QtQuick.Controls
import QtQuick.Dialogs
import QtQuick.Window
import Qt5Compat.GraphicalEffects

Rectangle {
    id: settingsPage
    objectName: "settingsPage"
    color: root.bgCol

    property int activeModelIndex: -1
    property string activeFieldName: ""

    component SettingsButton: Rectangle {
        id: btn
        property string text: ""
        property int type: 0
        signal clicked()

        Layout.fillWidth: true
        implicitHeight: 46
        radius: 8
        border.width: 1

        color: {
            if (type === 1) return btnMouse.containsMouse ? "transparent" : root.hoverCol
            if (type === 2) return btnMouse.containsMouse ? "#1aff4d4d" : "transparent"
            return btnMouse.containsMouse ? "#1affffff" : "transparent"
        }

        border.color: {
            if (type === 1) return root.hoverCol
            if (type === 2) return btnMouse.containsMouse ? "#ff1a1a" : "#ff4d4d"
            return btnMouse.containsMouse ? root.hoverCol : root.text
        }
        Behavior on color { ColorAnimation { duration: 200 } }
        Behavior on border.color { ColorAnimation { duration: 200 } }

        Text {
            anchors.centerIn: parent
            text: btn.text
            font.pixelSize: 15
            font.weight: type === 1 ? Font.DemiBold : Font.Medium
            color: {
                if (type === 1) return btnMouse.containsMouse ? root.hoverCol : root.bgCol
                if (type === 2) return btnMouse.containsMouse ? "#ff1a1a" : "#ff4d4d"
                return btnMouse.containsMouse ? root.hoverCol : root.text
            }
            Behavior on color { ColorAnimation { duration: 200 } }
        }

        MouseArea {
            id: btnMouse
            anchors.fill: parent
            hoverEnabled: true
            cursorShape: Qt.PointingHandCursor
            onClicked: btn.clicked()
        }
    }

    component InputGroup: ColumnLayout {
        property string labelText: ""
        property alias placeholder: input.placeholderText
        property alias text: input.text
        property alias echoMode: input.echoMode

        spacing: 8
        Layout.fillWidth: true

        Text {
            text: labelText
            color: root.text
            font.pixelSize: 14
            font.weight: Font.Medium
            opacity: 0.9
        }

        TextField {
            id: input
            Layout.fillWidth: true
            font.pixelSize: 15
            color: root.text
            leftPadding: 16
            rightPadding: 16

            background: Rectangle {
                implicitHeight: 44
                color: "#0dffffff"
                radius: 8
                border.width: 1
                border.color: input.activeFocus ? root.hoverCol : "#1affffff"
                Behavior on border.color { ColorAnimation { duration: 200 } }
            }
        }
    }

    component ColorCircle: Rectangle {
        id: rootCircle
        property color colorValue: "white"
        signal circleClicked()

        width: 44
        height: 44
        radius: 22
        color: colorValue
        border.width: 2
        border.color: "#33ffffff"

        scale: area.containsMouse ? 1.1 : 1.0
        Behavior on scale { NumberAnimation { duration: 200 } }

        MouseArea {
            id: area
            anchors.fill: parent
            hoverEnabled: true
            cursorShape: Qt.PointingHandCursor
            onClicked: rootCircle.circleClicked()
        }
    }

    Flickable {
        id: settingsFlick
        anchors.fill: parent
        anchors.margins: 40
        contentWidth: width
        contentHeight: mainLayout.implicitHeight + 80
        clip: true
        interactive: root.visibility !== Window.FullScreen
        boundsBehavior: Flickable.StopAtBounds

        ScrollBar.vertical: ScrollBar {
            policy: ScrollBar.AsNeeded
        }

        ColumnLayout {
            id: mainLayout
            width: parent.width
            spacing: 30

            Text {
                text: "Settings"
                font.pixelSize: settingsPage.width < 500 ? 28 : 36
                font.weight: Font.DemiBold
                color: root.text
                Layout.leftMargin: settingsPage.width < 500 ? 0 : 8
            }

            GridLayout {
                id: settingsGrid
                Layout.fillWidth: true
                columns: settingsPage.width > 900 ? 2 : 1
                columnSpacing: 30
                rowSpacing: 30

                Rectangle {
                    Layout.fillWidth: true
                    Layout.alignment: Qt.AlignTop
                    implicitHeight: card1Layout.implicitHeight + (settingsPage.width < 500 ? 30 : 60)
                    color: root.boxBgCol
                    radius: 16
                    border.width: 1
                    border.color: "#0dffffff"

                    ColumnLayout {
                        id: card1Layout
                        anchors.fill: parent
                        anchors.margins: settingsPage.width < 500 ? 15 : 30
                        spacing: 15

                        ColumnLayout {
                            spacing: 10
                            Text {
                                text: "Aspect and colors"
                                font.pixelSize: 22
                                font.weight: Font.Bold
                                color: root.text
                            }
                            Rectangle {
                                Layout.preferredWidth: parent.width
                                Layout.preferredHeight: 2
                                color: root.hoverCol
                            }
                        }

                        Item {
                            Layout.fillWidth: true
                            Layout.preferredHeight: 20
                            RowLayout {
                                anchors.right: parent.right
                                spacing: 20
                                Text { text: "Light"; color: root.text; font.pixelSize: 14; opacity: 0.8; Layout.preferredWidth: 44; horizontalAlignment: Text.AlignHCenter }
                                Text { text: "Dark"; color: root.text; font.pixelSize: 14; opacity: 0.8; Layout.preferredWidth: 44; horizontalAlignment: Text.AlignHCenter }
                            }
                        }

                        Repeater {
                            id: colorRepeater
                            model: ListModel {
                                id: colorModel
                                ListElement { name: "Page background"; cssVar: "--bgCol"; lightC: "#f2effb"; darkC: "#352f44" }
                                ListElement { name: "Menu background"; cssVar: "--menuBgCol"; lightC: "#ffffff"; darkC: "#655d7a" }
                                ListElement { name: "Text"; cssVar: "--text"; lightC: "#231e3d"; darkC: "#ffffff" }
                                ListElement { name: "Accent color"; cssVar: "--hoverCol"; lightC: "#3cbff3"; darkC: "#3cf38f" }
                                ListElement { name: "Box shadow"; cssVar: "--boxShadowCol"; lightC: "#2e2d2d"; darkC: "#f0f0f0" }
                                ListElement { name: "Transparency effect"; cssVar: "--boxBgCol"; lightC: "#ffffff"; darkC: "#dbdbdb" }
                            }

                            delegate: Rectangle {
                                Layout.fillWidth: true
                                Layout.preferredHeight: 68
                                radius: 10
                                color: rowMouse.containsMouse ? "#0fffffff" : "#08ffffff"
                                Behavior on color { ColorAnimation { duration: 200 } }

                                MouseArea {
                                    id: rowMouse
                                    anchors.fill: parent
                                    hoverEnabled: true
                                    acceptedButtons: Qt.NoButton
                                }

                                RowLayout {
                                    anchors.fill: parent
                                    anchors.margins: 12
                                    anchors.leftMargin: 20
                                    anchors.rightMargin: 20

                                    ColumnLayout {
                                        spacing: 4
                                        Text { text: model.name; color: root.text; font.pixelSize: 16; font.weight: Font.Medium }
                                        Text { text: model.cssVar; color: root.text; font.pixelSize: 12; opacity: 0.5; font.family: "monospace" }
                                    }

                                    Item { Layout.fillWidth: true }

                                    RowLayout {
                                        spacing: 20

                                        ColorCircle {
                                            colorValue: model.lightC
                                            onCircleClicked: {
                                                settingsPage.activeModelIndex = index
                                                settingsPage.activeFieldName = "lightC"
                                                globalColorPicker.selectedColor = model.lightC
                                                globalColorPicker.open()
                                            }
                                        }

                                        ColorCircle {
                                            colorValue: model.darkC
                                            onCircleClicked: {
                                                settingsPage.activeModelIndex = index
                                                settingsPage.activeFieldName = "darkC"
                                                globalColorPicker.selectedColor = model.darkC
                                                globalColorPicker.open()
                                            }
                                        }
                                    }
                                }
                            }
                        }

                        Item { Layout.fillHeight: true }

                        ColumnLayout {
                            Layout.fillWidth: true
                            spacing: 15
                            Layout.topMargin: 15

                            SettingsButton { text: "Save theme"; type: 1 }
                            SettingsButton {
                                text: "Log out"
                                type: 2
                                onClicked: sessionMgr.logoutUser()
                            }
                        }
                    }
                }

                Rectangle {
                    Layout.fillWidth: true
                    Layout.alignment: Qt.AlignTop
                    implicitHeight: card2Layout.implicitHeight + (settingsPage.width < 500 ? 30 : 60)
                    color: root.boxBgCol
                    radius: 16
                    border.width: 1
                    border.color: "#0dffffff"

                    ColumnLayout {
                        id: card2Layout
                        anchors.fill: parent
                        anchors.margins: settingsPage.width < 500 ? 15 : 30
                        spacing: 15

                        ColumnLayout {
                            spacing: 10
                            Text {
                                text: "Profile"
                                font.pixelSize: 22
                                font.weight: Font.Bold
                                color: root.text
                            }
                            Rectangle {
                                Layout.preferredWidth: parent.width
                                Layout.preferredHeight: 2
                                color: root.hoverCol
                            }
                        }

                        ColumnLayout {
                            Layout.fillWidth: true
                            spacing: 12
                            Layout.bottomMargin: 15
                            Layout.topMargin: 10

                            Item {
                                Layout.alignment: Qt.AlignHCenter
                                width: 90
                                height: 90

                                Rectangle {
                                    id: avatarWrapper
                                    anchors.fill: parent
                                    radius: width / 2
                                    color: "#1affffff"
                                    border.width: 3
                                    border.color: avatarMouse.containsMouse ? root.hoverCol : "transparent"
                                    scale: avatarMouse.containsMouse ? 1.05 : 1.0
                                    Behavior on scale { NumberAnimation { duration: 200 } }
                                    Behavior on border.color { ColorAnimation { duration: 200 } }

                                    Rectangle {
                                        anchors.fill: parent
                                        anchors.margins: -1
                                        radius: width / 2
                                        color: "transparent"
                                        border.width: 1
                                        border.color: root.hoverCol
                                        opacity: avatarMouse.containsMouse ? 0 : 1
                                    }

                                    Image {
                                        id: avatarImg
                                        source: sessionMgr.pfp
                                        anchors.fill: parent
                                        fillMode: Image.PreserveAspectCrop
                                        layer.enabled: true
                                        layer.effect: OpacityMask {
                                            maskSource: Rectangle { width: 90; height: 90; radius: 45 }
                                        }
                                    }
                                }

                                MouseArea {
                                    id: avatarMouse
                                    anchors.fill: parent
                                    hoverEnabled: true
                                    cursorShape: Qt.PointingHandCursor
                                    onClicked: fileDialog.open()
                                }

                                FileDialog {
                                        id: fileDialog
                                        title: "Select photo"

                                        fileMode: FileDialog.OpenFile

                                        nameFilters: ["Images (*.jpg *.png *.dng *.webp)", ]

                                        onAccepted: sessionMgr.changePFP(fileDialog.selectedFile)
                                        onRejected: {return}
                                    }
                            }

                            Text {
                                text: "Change profile picture"
                                color: root.text
                                font.pixelSize: 14
                                opacity: 0.7
                                Layout.alignment: Qt.AlignHCenter
                            }
                        }

                        InputGroup { labelText: "New username"; placeholder: "User123" }
                        InputGroup { labelText: "Type the password to confirm"; placeholder: "Current password"; echoMode: TextInput.Password }
                        SettingsButton { text: "Update username"; type: 0 }

                        Rectangle {
                            Layout.fillWidth: true
                            Layout.preferredHeight: 1
                            color: "#1affffff"
                            Layout.topMargin: 15
                            Layout.bottomMargin: 15
                        }

                        InputGroup { labelText: "Current password"; placeholder: "••••••••"; echoMode: TextInput.Password }
                        InputGroup { labelText: "New password"; placeholder: "••••••••"; echoMode: TextInput.Password }
                        SettingsButton { text: "Change password"; type: 0 }

                        Item { Layout.fillHeight: true }
                    }
                }
            }
        }
    }

    ColorDialog {
        id: globalColorPicker
        title: "Select Color"

        onAccepted: {
            if (settingsPage.activeModelIndex !== -1 && settingsPage.activeFieldName !== "") {
                colorModel.setProperty(settingsPage.activeModelIndex, settingsPage.activeFieldName, selectedColor.toString())
            }
        }
    }
}