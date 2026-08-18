import QtQuick
import QtQuick.Layouts
import QtQuick.Controls.Basic

ApplicationWindow {
    id: root

    TapHandler {
        onTapped: root.contentItem.forceActiveFocus()
    }

    minimumWidth: 1366
    minimumHeight: 768

    color: bgCol
    visible: true

    title: qsTr("OffGrid")
    visibility: Window.Maximized

    property bool lightMode: Application.styleHints.colorScheme === Qt.Light
    property string currentPath: "/"

    property var userData: null

    property bool isUserLoggedIn: sessionMgr ? sessionMgr.hasActiveSession : false

    function parseToQmlColor(colorStr) {
        if (!colorStr) return "#ffffff"
        var str = colorStr.toString().trim()

        if (str.indexOf("rgb") === 0) {
            var match = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/)
            if (match)
                return Qt.rgba(
                    parseFloat(match[1]) / 255.0,
                    parseFloat(match[2]) / 255.0,
                    parseFloat(match[3]) / 255.0,
                    match[4] !== undefined ? parseFloat(match[4]) : 1.0
                )
        }

        if (str.indexOf("#") === 0 && str.length === 9)
            return Qt.rgba(
                parseInt(str.substring(1, 3), 16) / 255.0,
                parseInt(str.substring(3, 5), 16) / 255.0,
                parseInt(str.substring(5, 7), 16) / 255.0,
                parseInt(str.substring(7, 9), 16) / 255.0
            )

        return str
    }

    function getThemeColor(colorName, isLight, uData, defaultLight, defaultDark) {
            var mode = isLight ? "light" : "dark"
            var rawColor = isLight ? defaultLight : defaultDark

            if (uData && uData.preferences) {
                var prefs = uData.preferences
                if (typeof prefs === "string")
                    try {
                        prefs = JSON.parse(prefs)
                    } catch (e) {
                        return parseToQmlColor(rawColor)
                    }
                if (prefs && prefs[mode] && prefs[mode][colorName])
                    rawColor = prefs[mode][colorName]
            }
            return parseToQmlColor(rawColor)
        }

    property color bgCol: getThemeColor("bgCol", lightMode, userData, "#f2effb", "#352F44")
    property color menuBgCol: getThemeColor("menuBgCol", lightMode, userData, "#ccffffff", "#94655d7a")
    property color text: getThemeColor("text", lightMode, userData, "#231e3d", "#ffffff")
    property color hoverCol: getThemeColor("hoverCol", lightMode, userData, "#3cbff3", "#3cf38f")
    property color boxShadowCol: getThemeColor("boxShadowCol", lightMode, userData, "#332e2d2d", "#33f0f0f0")
    property color boxBgCol: getThemeColor("boxBgCol", lightMode, userData, "#d9ffffff", "#0ddbdbdb")

    Shortcut {
        sequence: "F11"
        onActivated: {
            if (root.visibility === Window.Maximized)
                root.visibility = Window.Windowed
            else root.visibility = Window.Maximized
        }
    }

    Shortcut {
        sequence: "1"
        onActivated: currentPath = "/"
    }

    Shortcut {
        sequence: "2"
        onActivated: currentPath = "/myfiles/shared"
    }
    Shortcut {
        sequence: "3"
        onActivated: currentPath = "/myfiles/favorites"
    }
    Shortcut {
        sequence: "4"
        onActivated: currentPath = "/myfiles/documents"
    }

    Shortcut {
        sequence: "5"
        onActivated: currentPath = "/myfiles/music"
    }
    Shortcut {
        sequence: "6"
        onActivated: currentPath = "/myfiles/photos"
    }
    Shortcut {
        sequence: "7"
        onActivated: currentPath = "/myfiles/trash"
    }

    function updateRoute() {
        if (!root.isUserLoggedIn) {
            if (currentPath !== "/login" && currentPath !== "/register") currentPath = "/login"

            pageStack.replace(null, "Account/Login.qml", StackView.Immediate)
            return;
        }

        if (currentPath === "/") pageStack.replace(null, "Files/MyFilesPage.qml", StackView.Immediate)
        else if (currentPath === "/myfiles/shared" && isUserLoggedIn) pageStack.replace(null, "Files/SharedFilesPage.qml", StackView.Immediate)
        else if (currentPath === "/myfiles/favorites" && isUserLoggedIn) pageStack.replace(null, "Files/FavoritesPage.qml", StackView.Immediate)
        else if (currentPath === "/myfiles/documents" && isUserLoggedIn) pageStack.replace(null, "Files/DocumentsPage.qml", StackView.Immediate)
        else if (currentPath === "/myfiles/music" && isUserLoggedIn) pageStack.replace(null, "Files/MusicPage.qml", StackView.Immediate)
        else if (currentPath === "/myfiles/photos" && isUserLoggedIn) pageStack.replace(null, "Files/PhotosPage.qml", StackView.Immediate)
        else if (currentPath === "/myfiles/trash" && isUserLoggedIn) pageStack.replace(null, "Files/TrashPage.qml", StackView.Immediate)
        else if (currentPath === "/register") pageStack.replace(null, "Account/Register.qml", StackView.Immediate)
        else if (currentPath === "/login") pageStack.replace(null, "Account/Login.qml", StackView.Immediate)
        else if (currentPath === "/settings" && isUserLoggedIn) pageStack.replace(null, "Account/Settings.qml", StackView.Immediate)
    }

    onCurrentPathChanged: updateRoute()
    onIsUserLoggedInChanged: {
        updateRoute()
        if (isUserLoggedIn) userData = sessionMgr.getUserData()
        else userData = null
    }

    Component.onCompleted: {
        updateRoute()
        userData = sessionMgr.getUserData()
    }

    ColumnLayout {
        anchors.fill: parent
        spacing: 0

        Header {Layout.fillWidth: true}

        RowLayout {
            Layout.fillWidth: true
            Layout.fillHeight: true
            spacing: 0

            Sidebar {
                Layout.fillHeight: true
                visible: isUserLoggedIn
            }

            StackView {
                id: pageStack
                Layout.fillWidth: true
                Layout.fillHeight: true
                initialItem: isUserLoggedIn ? "Files/MyFilesPage.qml" : "Account/Login.qml"

                replaceEnter: Transition {}
                replaceExit: Transition {}
            }
        }
    }

    Connections {
        target: sessionMgr

        function onPreferencesChanged(newPrefs) {
            if (root.userData) {
                var newUserData = Object.assign({}, root.userData)
                newUserData.preferences = newPrefs
                root.userData = newUserData
            }
        }
    }
}