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

        FileDialog {
            id: fileDialog
            title: "Select file"

            fileMode: FileDialog.OpenFile

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
                    return [
                        "Audio (*.mp3 *.wav *.ogg *.flac *.aac *.alac *.m4a *.opus)"
                    ]
                else if (root.currentPath === "/myfiles/photos")
                    return [
                        "Video (*.mp4 *.mov *.avi *.wmv *.mkv *.webm *.flv *.gif *.m4v)",
                        "Pictures (*.bmp *.gif *.jpeg *.jpg *.png *.psd *.webp *.dng *.svg)"
                    ]

                return ["All files (*)"]
            }

            onAccepted: handleUploads.uploadFile(fileDialog.selectedFile)
            onRejected: {return}
        }

        FolderDialog {
            id: folderDialog
            title: "Select folder"

            onAccepted: handleUploads.uploadFolder(folderDialog.selectedFolder)
            onRejected: {return}
        }
    }
}