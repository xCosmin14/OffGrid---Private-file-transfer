import QtQuick
import QtQuick.Layouts
import QtQuick.Controls
import QtQuick.Dialogs
import QtQuick.Window

Item {
    id: addFileRoot

    width: 40
    height: 40
    z: 99

    property bool showMenu: false
    property bool showCreateFolderModal: false
    property bool showCreateTextModal: false
    property string textFileType: "txt"

    onShowCreateFolderModalChanged: {
        if (showCreateFolderModal) {
            folderNameInput.text = ""
            folderColorInput.text = "#000000"
            createFolderDialog.open()
            folderNameInput.forceActiveFocus()
        } else {
            createFolderDialog.close()
        }
    }

    onShowCreateTextModalChanged: {
        if (showCreateTextModal) {
            fileNameInput.text = ""
            createTextFileDialog.open()
            fileNameInput.forceActiveFocus()
        } else {
            createTextFileDialog.close()
        }
    }

    function submitCreateFolder() {
        if (!showCreateFolderModal) return
        showCreateFolderModal = false
        if (folderNameInput.text.trim() !== "") {
            handleUploads.createFolder(folderNameInput.text.trim(), folderColorInput.text.trim(), "")
        }
    }

    function submitCreateTextFile() {
        if (!showCreateTextModal) return
        showCreateTextModal = false
        if (fileNameInput.text.trim() !== "") {
            handleUploads.createFile(fileNameInput.text.trim(), null)
        }
    }

    ToolButton {
        id: roundButton
        width: 40
        height: 40
        padding: 0

        onClicked: showMenu = !showMenu
        HoverHandler { cursorShape: Qt.PointingHandCursor }

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
        Keys.onEscapePressed: showMenu = false

        anchors.top: roundButton.bottom
        anchors.topMargin: 8
        anchors.left: roundButton.left
        width: 240
        height: 230

        color: root.menuBgCol
        radius: 12
        border.color: Qt.rgba(root.text.r, root.text.g, root.text.b, 0.12)
        border.width: 1
        opacity: 0.98

        ColumnLayout {
            anchors.fill: parent
            anchors.leftMargin: 12
            anchors.rightMargin: 12
            anchors.topMargin: 14
            anchors.bottomMargin: 14
            spacing: 4

            MenuOption {
                Layout.fillWidth: true
                iconSource: "../assets/svg/FileIcons/UploadFile.svg"
                text: "Upload file"
                onClicked: {
                    showMenu = false
                    fileDialog.open()
                }
            }

            Rectangle {
                Layout.fillWidth: true
                height: 1
                color: Qt.rgba(root.text.r, root.text.g, root.text.b, 0.15)
                Layout.topMargin: 4
                Layout.bottomMargin: 4
            }

            MenuOption {
                Layout.fillWidth: true
                iconSource: "../assets/svg/FileIcons/Folder.svg"
                text: "Create folder"
                onClicked: {
                    showMenu = false
                    showCreateFolderModal = true
                }
            }

            MenuOption {
                Layout.fillWidth: true
                iconSource: "../assets/svg/FileIcons/Folder.svg"
                text: "Upload folder"
                onClicked: {
                    showMenu = false
                    folderDialog.open()
                }
            }

            Rectangle {
                Layout.fillWidth: true
                height: 1
                color: Qt.rgba(root.text.r, root.text.g, root.text.b, 0.15)
                Layout.topMargin: 4
                Layout.bottomMargin: 4
            }

            MenuOption {
                Layout.fillWidth: true
                iconSource: "../assets/svg/FileIcons/TextFile.svg"
                text: "Create text file"
                onClicked: {
                    showMenu = false
                    textFileType = "txt"
                    showCreateTextModal = true
                }
            }
        }

        FileDialog {
            id: fileDialog
            title: "Select files"
            fileMode: FileDialog.OpenFiles

            nameFilters: {
                if (root.currentPath === "/") return ["All files (*)"]
                else if (root.currentPath === "/myfiles/documents")
                    return [
                        "All Documents (*.pdf *.txt *.rtf *.md *.markdown *.doc *.docx *.odt *.xls *.xlsx *.ods *.csv *.ppt *.pptx *.odp)",
                        "PDF Documents (*.pdf)",
                        "Text & Markdown (*.txt *.md *.markdown *.rtf *.log)",
                        "Word Processing (*.doc *.docx *.odt *.pages)",
                        "Spreadsheets & Data (*.xls *.xlsx *.ods *.numbers *.csv)",
                        "Presentations (*.ppt *.pptx *.odp *.key)"
                    ]
                else if (root.currentPath === "/myfiles/music")
                    return ["Audio (*.mp3 *.wav *.ogg *.flac *.aac *.alac *.m4a *.opus)"]
                else if (root.currentPath === "/myfiles/photos")
                    return [
                        "Video (*.mp4 *.mov *.avi *.wmv *.mkv *.webm *.flv *.gif *.m4v)",
                        "Pictures (*.bmp *.gif *.jpeg *.jpg *.png *.psd *.webp *.dng *.svg)"
                    ]

                return ["All files (*)"]
            }

            onAccepted: handleUploads.uploadFiles(fileDialog.selectedFiles)
            onRejected: { return }
        }

        FolderDialog {
            id: folderDialog
            title: "Select folder"

            onAccepted: handleUploads.uploadFolder(folderDialog.selectedFolder)
            onRejected: { return }
        }
    }

    Dialog {
        id: createFolderDialog
        modal: true
        dim: true
        anchors.centerIn: Overlay.overlay
        width: 350
        padding: 20

        onClosed: showCreateFolderModal = false

        background: Rectangle {
            color: root.menuBgCol
            radius: 12
            border.color: root.boxShadowCol
            border.width: 1
        }

        contentItem: ColumnLayout {
            spacing: 0

            ColorDialog {
                id: folderColorDialog
                title: "Select Folder Color"
                onAccepted: {
                    folderColorInput.text = folderColorDialog.selectedColor.toString()
                }
            }

            Text {
                text: "Create folder"
                color: root.text
                font.pixelSize: 20
                font.bold: true
                Layout.topMargin: 5
                Layout.bottomMargin: 20
            }

            TextField {
                id: folderNameInput
                placeholderText: "Folder Name"
                placeholderTextColor: Qt.rgba(root.text.r, root.text.g, root.text.b, 0.5)
                color: root.text
                font.pixelSize: 16
                Layout.fillWidth: true
                Layout.preferredHeight: 36
                leftPadding: 12
                rightPadding: 12

                onAccepted: submitCreateFolder()

                background: Rectangle {
                    color: "transparent"
                    radius: 6
                    border.width: 2
                    border.color: folderNameInput.activeFocus ? root.hoverCol : root.boxShadowCol
                }
            }

            Item { Layout.preferredHeight: 15 }

            RowLayout {
                Layout.fillWidth: true
                spacing: 6

                Text {
                    text: "Color:"
                    color: root.text
                    font.pixelSize: 16
                    font.bold: true
                    font.letterSpacing: 1
                }

                TextField {
                    id: folderColorInput
                    text: "#000000"
                    maximumLength: 9
                    color: root.text
                    font.pixelSize: 16
                    font.bold: true
                    selectByMouse: true
                    leftPadding: 4
                    rightPadding: 4
                    topPadding: 0
                    bottomPadding: 0
                    Layout.alignment: Qt.AlignVCenter

                    onAccepted: submitCreateFolder()

                    background: Item {}
                }

                Item { Layout.fillWidth: true }

                Rectangle {
                    width: 90
                    height: 32
                    radius: 6
                    color: folderColorInput.text.trim()
                    border.width: 2
                    border.color: colorHoverHandler.hovered ? root.hoverCol : root.boxShadowCol

                    HoverHandler { id: colorHoverHandler; cursorShape: Qt.PointingHandCursor }

                    TapHandler {
                        onTapped: {
                            var val = folderColorInput.text.trim()
                            if (Qt.color(val).isValid)
                                folderColorDialog.selectedColor = val
                            folderColorDialog.open()
                        }
                    }
                }
            }

            Item { Layout.preferredHeight: 25 }

            RowLayout {
                spacing: 25

                Button {
                    text: "Cancel"
                    onClicked: showCreateFolderModal = false

                    contentItem: Text {
                        text: parent.text
                        color: parent.hovered ? root.hoverCol : root.text
                        font.pixelSize: 15
                        font.weight: Font.Medium
                        horizontalAlignment: Text.AlignHCenter
                        verticalAlignment: Text.AlignVCenter
                    }
                    background: Rectangle {
                        color: parent.hovered ? Qt.rgba(255, 255, 255, 0.1) : "transparent"
                        border.width: 1
                        border.color: parent.hovered ? root.hoverCol : root.text
                        radius: 8
                    }
                }

                Button {
                    text: "Create"
                    onClicked: submitCreateFolder()

                    contentItem: Text {
                        text: parent.text
                        color: parent.hovered ? root.hoverCol : root.text
                        font.pixelSize: 15
                        font.weight: Font.Medium
                        horizontalAlignment: Text.AlignHCenter
                        verticalAlignment: Text.AlignVCenter
                    }
                    background: Rectangle {
                        color: parent.hovered ? Qt.rgba(255, 255, 255, 0.1) : "transparent"
                        border.width: 1
                        border.color: parent.hovered ? root.hoverCol : root.text
                        radius: 8
                    }
                }
            }
        }
    }

    Dialog {
        id: createTextFileDialog
        modal: true
        dim: true
        anchors.centerIn: Overlay.overlay
        width: 350
        padding: 20

        onClosed: showCreateTextModal = false

        background: Rectangle {
            color: root.menuBgCol
            radius: 12
            border.color: root.boxShadowCol
            border.width: 1
        }

        contentItem: ColumnLayout {
            spacing: 0

            Text {
                text: "Create Text file"
                color: root.text
                font.pixelSize: 20
                font.bold: true
                Layout.topMargin: 5
                Layout.bottomMargin: 20
            }

            TextField {
                id: fileNameInput
                placeholderText: "File Name"
                placeholderTextColor: Qt.rgba(root.text.r, root.text.g, root.text.b, 0.5)
                color: root.text
                font.pixelSize: 16
                Layout.fillWidth: true
                Layout.preferredHeight: 36
                leftPadding: 12
                rightPadding: 12

                onAccepted: submitCreateTextFile()

                background: Rectangle {
                    color: "transparent"
                    radius: 6
                    border.width: 2
                    border.color: fileNameInput.activeFocus ? root.hoverCol : root.boxShadowCol
                }
            }

            Item { Layout.preferredHeight: 25 }

            RowLayout {
                spacing: 25

                Button {
                    text: "Cancel"
                    onClicked: showCreateTextModal = false

                    contentItem: Text {
                        text: parent.text
                        color: parent.hovered ? root.hoverCol : root.text
                        font.pixelSize: 15
                        font.weight: Font.Medium
                        horizontalAlignment: Text.AlignHCenter
                        verticalAlignment: Text.AlignVCenter
                    }
                    background: Rectangle {
                        color: parent.hovered ? Qt.rgba(255, 255, 255, 0.1) : "transparent"
                        border.width: 1
                        border.color: parent.hovered ? root.hoverCol : root.text
                        radius: 8
                    }
                }

                Button {
                    text: "Create"
                    onClicked: submitCreateTextFile()

                    contentItem: Text {
                        text: parent.text
                        color: parent.hovered ? root.hoverCol : root.text
                        font.pixelSize: 15
                        font.weight: Font.Medium
                        horizontalAlignment: Text.AlignHCenter
                        verticalAlignment: Text.AlignVCenter
                    }
                    background: Rectangle {
                        color: parent.hovered ? Qt.rgba(255, 255, 255, 0.1) : "transparent"
                        border.width: 1
                        border.color: parent.hovered ? root.hoverCol : root.text
                        radius: 8
                    }
                }
            }
        }
    }
}