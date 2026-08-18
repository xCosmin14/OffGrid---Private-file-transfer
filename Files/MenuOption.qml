import QtQuick
import QtQuick.Layouts
import QtQuick.Controls

Rectangle {
    id: optRoot
    implicitWidth: row.implicitWidth + 15
    height: 25
    radius: 4
    color: "transparent"

    signal clicked()

    property alias iconSource: iconBtn.icon.source
    property alias text: label.text
    property bool isHovered: mouseArea.containsMouse

    RowLayout {
        id: row
        anchors.verticalCenter: parent.verticalCenter
        anchors.left: parent.left
        anchors.leftMargin: 10
        spacing: 10

        ToolButton {
            id: iconBtn
            property color btnColor: isHovered ? root.hoverCol : root.text
            Behavior on btnColor { ColorAnimation { duration: 200 } }

            icon.color: btnColor
            icon.width: 36
            icon.height: 36
            Layout.preferredWidth: 36
            Layout.preferredHeight: 36
            background: null
        }

        Text {
            id: label
            color: isHovered ? root.hoverCol : root.text
            Behavior on color { ColorAnimation { duration: 200 } }
            font.pixelSize: 20
            font.bold: true
        }
    }

    MouseArea {
        id: mouseArea
        anchors.fill: parent
        hoverEnabled: true
        cursorShape: Qt.PointingHandCursor
        onClicked: optRoot.clicked()
    }
}