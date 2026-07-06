import QtQuick
import QtQuick.Layouts
import QtQuick.Controls
import Qt5Compat.GraphicalEffects

Item {
    id: loginPage

    width: parent ? parent.width : 1280
    height: parent ? parent.height : 720

    property string errorMessage: ""

    component AccountField: Item {
        id: fieldRoot
        width: 360
        height: 50

        property alias placeholderText: placeholder.text
        property alias text: input.text
        property alias echoMode: input.echoMode
        property string iconSource: ""
        property bool isPassword: false
        property bool showPassword: false

        HoverHandler {cursorShape: Qt.IBeamCursor}

        Rectangle {
            anchors.fill: parent
            radius: 12
            color: root.bgCol
            border.width: input.activeFocus ? 2 : 1.5
            border.color: input.activeFocus ? root.hoverCol : root.boxShadowCol
            Behavior on border.color { ColorAnimation { duration: 250 } }
            Behavior on border.width { NumberAnimation { duration: 150 } }
        }

        Text {
            id: placeholder
            anchors.fill: parent
            anchors.leftMargin: 16
            verticalAlignment: Text.AlignVCenter
            font.pixelSize: 15
            color: root.text
            opacity: 0.5
            visible: input.text.length === 0
        }

        TextInput {
            id: input
            anchors.fill: parent
            anchors.leftMargin: 16
            anchors.rightMargin: fieldRoot.isPassword ? 70 : 40
            verticalAlignment: TextInput.AlignVCenter
            font.pixelSize: 15
            color: root.text
            echoMode: fieldRoot.isPassword && !fieldRoot.showPassword ? TextInput.Password : TextInput.Normal
            clip: true
        }

        Item {
            anchors.right: parent.right
            anchors.rightMargin: 14
            anchors.verticalCenter: parent.verticalCenter
            width: 20
            height: 20

            Image {
                id: mainIcon
                source: fieldRoot.iconSource
                anchors.fill: parent
                visible: false
            }
            ColorOverlay {
                anchors.fill: mainIcon
                source: mainIcon
                color: input.activeFocus ? root.hoverCol : root.text
                opacity: input.activeFocus ? 0.85 : 0.4
                Behavior on color { ColorAnimation { duration: 250 } }
                Behavior on opacity { NumberAnimation { duration: 250 } }
            }
        }

        Item {
            visible: fieldRoot.isPassword
            anchors.right: parent.right
            anchors.rightMargin: 40
            anchors.verticalCenter: parent.verticalCenter
            width: 20
            height: 20

            Image {
                id: eyeIcon
                source: fieldRoot.showPassword ? "../assets/svg/EyeHide.svg" : "../assets/svg/EyeShow.svg"
                anchors.centerIn: parent
                width: 14
                height: 14
                visible: false
            }
            ColorOverlay {
                anchors.fill: eyeIcon
                source: eyeIcon
                color: eyeMouseArea.containsMouse ? root.hoverCol : root.text
                opacity: eyeMouseArea.containsMouse ? 1.0 : 0.4
                Behavior on color { ColorAnimation { duration: 250 } }
                Behavior on opacity { NumberAnimation { duration: 250 } }
            }
            MouseArea {
                id: eyeMouseArea
                anchors.fill: parent
                hoverEnabled: true
                cursorShape: Qt.PointingHandCursor
                onClicked: fieldRoot.showPassword = !fieldRoot.showPassword
            }
        }
    }

    component FormLink: Text {
        property string linkText: ""
        signal linkClicked()

        text: linkText
        font.pixelSize: 14
        color: linkMouse.containsMouse ? root.hoverCol : root.text
        opacity: linkMouse.containsMouse ? 1.0 : 0.55
        Behavior on color { ColorAnimation { duration: 200 } }
        Behavior on opacity { NumberAnimation { duration: 200 } }

        MouseArea {
            id: linkMouse
            anchors.fill: parent
            hoverEnabled: true
            cursorShape: Qt.PointingHandCursor
            onClicked: parent.linkClicked()
        }
    }

    Rectangle {
        id: formContainer
        width: 480
        height: formLayout.implicitHeight + 104
        anchors.centerIn: parent
        color: root.boxBgCol
        radius: 24
        border.width: 1
        border.color: root.boxShadowCol

        Column {
            id: formLayout
            anchors.centerIn: parent
            width: 360
            spacing: 14

            Text {
                text: "Welcome back!"
                font.pixelSize: 44
                font.weight: Font.Bold
                color: root.text
                anchors.horizontalCenter: parent.horizontalCenter
            }

            Item {
                width: 1
                height: 18
            }

            AccountField {
                id: emailField
                placeholderText: "Email"
                iconSource: "../assets/svg/UserIcons/Email.svg"
            }

            AccountField {
                id: passwordField
                placeholderText: "Password"
                iconSource: "../assets/svg/UserIcons/Password.svg"
                isPassword: true
            }

            Text {
                text: loginPage.errorMessage
                color: "#ff4d4d"
                font.pixelSize: 14
                font.weight: Font.DemiBold
                visible: loginPage.errorMessage !== ""
                anchors.horizontalCenter: parent.horizontalCenter
            }

            Item {
                width: 1
                height: 10
            }

            Rectangle {
                id: submitBtn
                width: 360
                height: 50
                radius: 12
                color: root.hoverCol
                opacity: btnMouse.containsMouse ? 0.86 : 1.0

                transform: Translate {
                    id: btnTranslate
                    y: btnMouse.containsMouse ? -2 : 0
                    Behavior on y { NumberAnimation { duration: 150 } }
                }
                Behavior on opacity { NumberAnimation { duration: 250 } }

                Text {
                    text: "Login"
                    color: "#ffffff"
                    font.pixelSize: 15
                    font.weight: Font.DemiBold
                    font.letterSpacing: 0.3
                    anchors.centerIn: parent
                }

                MouseArea {
                    id: btnMouse
                    anchors.fill: parent
                    hoverEnabled: true
                    cursorShape: Qt.PointingHandCursor
                    onClicked: console.log("Login submitted")
                }
            }

            Item {
                width: 1
                height: 10
            }

            Column {
                anchors.horizontalCenter: parent.horizontalCenter
                spacing: 10

                FormLink {
                    linkText: "Forgot your password?"
                    anchors.horizontalCenter: parent.horizontalCenter
                    onLinkClicked: {
                        root.currentPath = "/forgotPassword"
                        pageStack.replace("ForgotPassword.qml", StackView.Immediate)
                    }
                }

                FormLink {
                    linkText: "Create an account"
                    anchors.horizontalCenter: parent.horizontalCenter
                    onLinkClicked: {
                        root.currentPath = "/register"
                        pageStack.replace("Register.qml", StackView.Immediate)
                    }
                }
            }
        }
    }
}