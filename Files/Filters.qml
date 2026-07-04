import QtQuick
import QtQuick.Layouts
import QtQuick.Controls

Rectangle {
    id: filterRoot
    height: 40
    color: root.menuBgCol
    border.color: "white"
    border.width: 1
    radius: 25
    implicitWidth: row.implicitWidth + 40

    RowLayout {
        id: row
        anchors.fill: parent
        anchors.leftMargin: 20
        anchors.rightMargin: 20
        spacing: 15

        Text { text: "Date"; color: root.text; font.bold: true }
        Text { text: "from:"; color: root.text; opacity: 0.8 }
        TextField {
            placeholderText: "mm / dd / yyyy"
            Layout.preferredWidth: 140
            Layout.preferredHeight: 28
            background: Rectangle {
                color: "transparent"; radius: 5
                border.color: parent.activeFocus ? root.hoverCol : root.boxShadowCol
                border.width: 1
            }
            color: root.text
        }

        Text { text: "to:"; color: root.text; opacity: 0.8 }
        TextField {
            placeholderText: "mm / dd / yyyy"
            Layout.preferredWidth: 140
            Layout.preferredHeight: 28
            background: Rectangle {
                color: "transparent"; radius: 5
                border.color: parent.activeFocus ? root.hoverCol : root.boxShadowCol
                border.width: 1
            }
            color: root.text
        }

        Rectangle { width: 1; height: 20; color: root.text }

        Text { text: "Size (MB)"; color: root.text; font.bold: true }
        Text { text: "from:"; color: root.text; opacity: 0.8 }
        TextField {
            Layout.preferredWidth: 80
            Layout.preferredHeight: 28
            background: Rectangle {
                color: "transparent"; radius: 5
                border.color: parent.activeFocus ? root.hoverCol : root.boxShadowCol
                border.width: 1
            }
            color: root.text
        }

        Text { text: "to:"; color: root.text; opacity: 0.8 }
        TextField {
            Layout.preferredWidth: 80
            Layout.preferredHeight: 28
            background: Rectangle {
                color: "transparent"; radius: 5
                border.color: parent.activeFocus ? root.hoverCol : root.boxShadowCol
                border.width: 1
            }
            color: root.text
        }

        Rectangle { width: 1; height: 20; color: root.text }

        Text { text: "Extension:"; color: root.text; font.bold: true }
        ComboBox {
            model: [".pptx", ".png"]
            Layout.preferredWidth: 100
            Layout.preferredHeight: 28
            background: Rectangle {
                color: "transparent"; radius: 5
                border.color: parent.activeFocus ? root.hoverCol : root.boxShadowCol
                border.width: 1
            }
            contentItem: Text { text: parent.currentText; color: root.text; verticalAlignment: Text.AlignVCenter; leftPadding: 10 }
        }
    }
}