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

    function parseColor(colorStr) {
        if (!colorStr) return { hex: "#ffffff", alpha: 1 }
        var str = colorStr.toString().trim()

        if (str.indexOf("rgb") === 0) {
            var match = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/)
            if (match) {
                var r = parseInt(match[1]).toString(16).padStart(2, '0')
                var g = parseInt(match[2]).toString(16).padStart(2, '0')
                var b = parseInt(match[3]).toString(16).padStart(2, '0')
                var alpha = match[4] !== undefined ? parseFloat(match[4]) : 1.0
                return { hex: "#" + r + g + b, alpha: alpha }
            }
        }

        if (str.indexOf("#") === 0 && str.length === 9) {
            var hexRgb = str.substring(0, 7)
            var alphaHex = str.substring(7, 9)
            var aVal = parseInt(alphaHex, 16) / 255.0
            return { hex: hexRgb, alpha: aVal }
        }

        return { hex: str, alpha: 1 }
    }

    function formatColor(hex, alpha) {
        if (alpha >= 1) return hex
        var c = hex.replace('#', '')
        if (c.length === 3) {
            c = c.charAt(0) + c.charAt(0) + c.charAt(1) + c.charAt(1) + c.charAt(2) + c.charAt(2)
        }
        var r = parseInt(c.substring(0, 2), 16)
        var g = parseInt(c.substring(2, 4), 16)
        var b = parseInt(c.substring(4, 6), 16)
        return "rgba(" + r + ", " + g + ", " + b + ", " + alpha + ")"
    }

    function colorFromString(colorStr) {
        var parsed = parseColor(colorStr)
        var hex = parsed.hex.replace('#', '')
        var r = parseInt(hex.substring(0, 2), 16) / 255
        var g = parseInt(hex.substring(2, 4), 16) / 255
        var b = parseInt(hex.substring(4, 6), 16) / 255
        return Qt.rgba(r, g, b, parsed.alpha)
    }

    function loadPreferences() {
        if (!root.userData || !root.userData.preferences) return;

        var prefs = root.userData.preferences;
        if (typeof prefs === "string") {
            try {
                prefs = JSON.parse(prefs);
            } catch (e) {
                return;
            }
        }

        if (prefs && prefs.light && prefs.dark) {
            for (var i = 0; i < colorModel.count; i++) {
                var item = colorModel.get(i);
                var k = item.key;
                if (prefs.light[k] !== undefined) {
                    colorModel.setProperty(i, "lightC", prefs.light[k]);
                }
                if (prefs.dark[k] !== undefined) {
                    colorModel.setProperty(i, "darkC", prefs.dark[k]);
                }
            }
        }
    }

    function saveTheme() {
        var lightObj = {};
        var darkObj = {};
        for (var i = 0; i < colorModel.count; i++) {
            var item = colorModel.get(i);
            lightObj[item.key] = item.lightC;
            darkObj[item.key] = item.darkC;
        }
        var prefs = {
            "light": lightObj,
            "dark": darkObj
        };
        var success = sessionMgr.changePreferences(prefs);
    }

    Component.onCompleted: loadPreferences()

    Connections {
        target: root
        function onUserDataChanged() {
            loadPreferences()
        }
    }

    component SettingsButton: Rectangle {
        id: btn
        property string text: ""
        property int type: 0
        signal clicked()

        Layout.fillWidth: false
        implicitWidth: 164
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

    Timer {
        id: uErrorTimer
        interval: 5000
        onTriggered: sessionMgr.usernameError = ""
    }

    Timer {
        id: pErrorTimer
        interval: 5000
        onTriggered: sessionMgr.passwordError = ""
    }

    Connections {
        target: sessionMgr

        function onUsernameErrorChanged() {
            if (sessionMgr.usernameError !== "") {
                uErrorTimer.restart()
            }
        }

        function onPasswordErrorChanged() {
            if (sessionMgr.passwordError !== "") {
                pErrorTimer.restart()
            }
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
                                ListElement { key: "bgCol"; name: "Page background"; cssVar: "--bgCol"; lightC: "#f2effb"; darkC: "#352f44" }
                                ListElement { key: "menuBgCol"; name: "Menu background"; cssVar: "--menuBgCol"; lightC: "#ffffff"; darkC: "#655d7a" }
                                ListElement { key: "text"; name: "Text"; cssVar: "--text"; lightC: "#231e3d"; darkC: "#ffffff" }
                                ListElement { key: "hoverCol"; name: "Accent color"; cssVar: "--hoverCol"; lightC: "#3cbff3"; darkC: "#3cf38f" }
                                ListElement { key: "boxShadowCol"; name: "Box shadow"; cssVar: "--boxShadowCol"; lightC: "#2e2d2d"; darkC: "#f0f0f0" }
                                ListElement { key: "boxBgCol"; name: "Transparency effect"; cssVar: "--boxBgCol"; lightC: "#ffffff"; darkC: "#dbdbdb" }
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
                                            colorValue: settingsPage.colorFromString(model.lightC)
                                            onCircleClicked: {
                                                settingsPage.activeModelIndex = index
                                                settingsPage.activeFieldName = "lightC"
                                                var parsed = settingsPage.parseColor(model.lightC)
                                                globalColorPicker.selectedColor = parsed.hex
                                                globalColorPicker.open()
                                            }
                                        }

                                        ColorCircle {
                                            colorValue: settingsPage.colorFromString(model.darkC)
                                            onCircleClicked: {
                                                settingsPage.activeModelIndex = index
                                                settingsPage.activeFieldName = "darkC"
                                                var parsed = settingsPage.parseColor(model.darkC)
                                                globalColorPicker.selectedColor = parsed.hex
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

                            SettingsButton {
                                text: "Save theme"; type: 1
                                Layout.fillWidth: true
                                onClicked: settingsPage.saveTheme()
                            }
                            SettingsButton {
                                text: "Log out"; type: 2
                                onClicked: sessionMgr.logoutUser()
                                Layout.fillWidth: true
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
                                text: "Profile - " + (root.userData ? root.userData.username : "")
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
                                    nameFilters: ["Images (*.jpg *.png *.dng *.webp)"]
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

                        InputGroup {
                            id: newUsername
                            labelText: "New username"; placeholder: "User123"
                        }
                        InputGroup {
                            id: changeUsernamePassword
                            labelText: "Type the password to confirm"; placeholder: "Current password"; echoMode: TextInput.Password
                        }

                        Item {
                            Layout.fillWidth: true
                            implicitHeight: 46

                            SettingsButton {
                                id: sb1
                                text: "Update username"; type: 0
                                anchors.left: parent.left
                                anchors.verticalCenter: parent.verticalCenter
                                onClicked: sessionMgr.changeUsername(newUsername.text, changeUsernamePassword.text)
                            }

                            Text {
                                text: sessionMgr.usernameError
                                visible: text !== ""
                                color: root.hoverCol
                                font.pixelSize: 20
                                font.weight: Font.Medium
                                anchors.right: parent.right
                                anchors.verticalCenter: parent.verticalCenter
                            }
                        }

                        Rectangle {
                            Layout.fillWidth: true
                            Layout.preferredHeight: 1
                            color: "#1affffff"
                            Layout.topMargin: 15
                            Layout.bottomMargin: 15
                        }

                        InputGroup {
                            id: currentPassword
                            labelText: "Current password"; placeholder: "••••••••"; echoMode: TextInput.Password
                        }
                        InputGroup {
                            id: newPassword
                            labelText: "New password"; placeholder: "••••••••"; echoMode: TextInput.Password
                        }

                        Item {
                            Layout.fillWidth: true
                            implicitHeight: 46

                            SettingsButton {
                                id: sb2
                                text: "Change password"; type: 0
                                anchors.left: parent.left
                                anchors.verticalCenter: parent.verticalCenter
                                onClicked: sessionMgr.changePassword(currentPassword.text, newPassword.text)
                            }

                            Text {
                                text: sessionMgr.passwordError
                                visible: text !== ""
                                color: root.hoverCol
                                font.pixelSize: 20
                                font.weight: Font.Medium
                                anchors.right: parent.right
                                anchors.verticalCenter: parent.verticalCenter
                            }
                        }

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
                var currentVal = colorModel.get(settingsPage.activeModelIndex)[settingsPage.activeFieldName]
                var currentAlpha = settingsPage.parseColor(currentVal).alpha
                var newHex = selectedColor.toString()
                if (newHex.indexOf("#") === 0 && newHex.length === 9) newHex = "#" + newHex.substring(3)

                var colorWithAlpha = settingsPage.formatColor(newHex, currentAlpha)
                colorModel.setProperty(settingsPage.activeModelIndex, settingsPage.activeFieldName, colorWithAlpha)
            }
        }
    }
}