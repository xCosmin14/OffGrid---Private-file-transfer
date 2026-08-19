import QtQuick
import QtQuick.Layouts
import QtQuick.Controls
import Qt5Compat.GraphicalEffects

Item {
    id: pageRoot

    property bool showMenu: false
    property bool showUploadProgress: false
    property bool uploadComplete: false
    property int uploadProgress: 0
    property real loadedMB: 0.0
    property real totalMB: 0.0
    property string currentFileName: ""
    property int fileIndex: 1
    property int totalFiles: 1

    Timer {
        id: hideProgressTimer
        interval: 3000
        onTriggered: showUploadProgress = false
    }

    Connections {
        target: handleUploads

        function onUploadProgressUpdate(isUploading, progressPercent, inLoadedMB, inTotalMB, inCurrentFile, inFileIndex, inTotalFiles) {
            pageRoot.uploadProgress = progressPercent
            pageRoot.loadedMB = inLoadedMB
            pageRoot.totalMB = inTotalMB
            pageRoot.currentFileName = inCurrentFile
            pageRoot.fileIndex = inFileIndex
            pageRoot.totalFiles = inTotalFiles

            if (isUploading) {
                pageRoot.showUploadProgress = true
                pageRoot.uploadComplete = false
                hideProgressTimer.stop()
            } else {
                pageRoot.uploadComplete = true
                pageRoot.uploadProgress = 100
                hideProgressTimer.restart()
            }
        }
    }

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

            property var pathModel: pageMgr.currentPathArr.length > 0 ? pageMgr.currentPathArr : [""]

            Row {
                id: pathRow
                spacing: 7
                anchors.verticalCenter: parent.verticalCenter

                Repeater {
                    model: currentPathDisplay.pathModel

                    delegate: Row {
                        spacing: 7
                        anchors.verticalCenter: parent.verticalCenter

                        readonly property bool isRealLast: index === currentPathDisplay.pathModel.length - 1
                        readonly property bool isSubfolder: pageMgr.currentPathArr.length > 1
                        readonly property bool isLast: isRealLast && isSubfolder

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
                                    text: pageRoot.transformText(modelData)
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

                                    transform: Translate { x: 5; y: 3 }

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
                                    if (!isLast) {
                                        console.log("Navigating to: " + modelData)
                                    }
                                }
                            }
                        }

                        Item {
                            visible: !isRealLast
                            width: 36; height: 36
                            anchors.verticalCenter: parent.verticalCenter

                            Image {
                                id: arrowRightIcon
                                source: "../assets/svg/ArrowRight.svg"
                                anchors.fill: parent
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

        Rectangle {
            id: uploadProgressContainer
            visible: showUploadProgress

            anchors.bottom: parent.bottom
            anchors.right: parent.right
            anchors.bottomMargin: 30
            anchors.rightMargin: parent.width * 0.05

            width: 250
            height: uploadColumn.implicitHeight + 20

            color: root.menuBgCol
            radius: 10
            border.color: root.boxShadowCol
            border.width: 1

            Column {
                id: uploadColumn
                anchors.centerIn: parent
                width: parent.width - 40
                spacing: 8

                Text {
                    text: uploadComplete ? "Upload complete!" : "Uploading: " + uploadProgress + "%"
                    color: root.text
                    font.pixelSize: 14
                    font.bold: true
                }

                Text {
                    text: uploadComplete
                          ? "All files were successfully saved."
                          : "Processing (" + fileIndex + "/" + totalFiles + "): <b>" + currentFileName + "</b>"
                    color: root.text
                    font.pixelSize: 12
                    opacity: 0.8
                    width: parent.width
                    elide: Text.ElideRight
                    textFormat: Text.RichText
                }

                ProgressBar {
                    width: parent.width
                    value: uploadProgress / 100

                    background: Rectangle {
                        implicitHeight: 10
                        color: root.boxShadowCol
                        radius: 8
                    }
                    contentItem: Item {
                        implicitHeight: 10
                        Rectangle {
                            width: parent.parent.visualPosition * parent.width
                            height: parent.height
                            radius: 8
                            color: root.hoverCol
                        }
                    }
                }

                Text {
                    text: loadedMB.toFixed(1) + " of " + totalMB.toFixed(1) + " MB"
                    color: root.text
                    font.pixelSize: 12
                    opacity: 0.7
                    width: parent.width
                    horizontalAlignment: Text.AlignRight
                }
            }
        }
    }

    function transformText(txt) {
        if (txt === "documents") return "Documents"
        return txt
    }
}