import QtQuick
import QtQuick.Layouts
import QtQuick.Controls

ColumnLayout {
    x: 64
    y: 118

    width: parent.width - 192

    spacing: 10

    Rectangle {
        id: wrapperBar

        Layout.fillWidth: true
        Layout.preferredHeight: 16
        color: root.boxShadowCol
        radius: 8
    }
}