import QtQuick
import QtQuick.Layouts
import QtQuick.Controls.Basic

ApplicationWindow {
    id: root
    minimumWidth: 1366
    minimumHeight: 768

    color: bgCol
    visible: true

    title: qsTr("OffGrid")
    visibility: Window.Maximized

    property bool lightMode: Application.styleHints.colorScheme === Qt.Light
    property string currentPath: "/"

    property color bgCol: lightMode ? "#f2effb" : "#352F44"
    property color menuBgCol : lightMode ? "#ccffffff" : "#94655d7a"
    property color text: lightMode ? "#231e3d" : "#ffffff"
    property color hoverCol: lightMode ? "#3cbff3" : "#3cf38f"
    property color boxShadowCol: lightMode ? "#332e2d2d" : "#33f0f0f0"
    property color boxBgCol: lightMode ? "#d9ffffff" : "#0ddbdbdb"

    onCurrentPathChanged: {
        if (currentPath === "/") pageStack.replace("MyFilesPage.qml")
        else if (currentPath === "/myfiles/shared") pageStack.replace("SharedFilesPage.qml")
        else if (currentPath === "/myfiles/favorites") pageStack.replace("FavoritesPage.qml")
        else if (currentPath === "/myfiles/documents") pageStack.replace("DocumentsPage.qml")
        else if (currentPath === "/myfiles/music") pageStack.replace("MusicPage.qml")
        else if (currentPath === "/myfiles/photos") pageStack.replace("PhotosPage.qml")
        else if (currentPath === "/myfiles/trash") pageStack.replace("TrashPage.qml")
        else if (currentPath === "/settings") pageStack.replace("SettingsPage.qml")
    }

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

    ColumnLayout {
        anchors.fill: parent
        spacing: 0

        Header {Layout.fillWidth: true}

        RowLayout {
            Layout.fillWidth: true
            Layout.fillHeight: true
            spacing: 0

            Sidebar {Layout.fillHeight: true}

            StackView {
                id: pageStack
                Layout.fillWidth: true
                Layout.fillHeight: true
                initialItem: "MyFilesPage.qml"

                pushEnter: Transition { NumberAnimation { property: "opacity"; from: 0; to: 1; duration: 200 } }
                pushExit: Transition { NumberAnimation { property: "opacity"; from: 1; to: 0; duration: 200 } }
                popEnter: Transition { NumberAnimation { property: "opacity"; from: 0; to: 1; duration: 200 } }
                popExit: Transition { NumberAnimation { property: "opacity"; from: 1; to: 0; duration: 200 } }
            }
        }
    }
}