import QtQuick
import QtQuick.Controls
import QtQuick.Layouts

Popup {
    id: datePickerPopup
    width: 280
    height: 340
    padding: 12

    // Animații la deschidere/închidere pentru un aspect fluid
    enter: Transition { NumberAnimation { property: "opacity"; from: 0.0; to: 1.0; duration: 150 } }
    exit: Transition { NumberAnimation { property: "opacity"; from: 1.0; to: 0.0; duration: 150 } }

    modal: true
    focus: true
    closePolicy: Popup.CloseOnEscape | Popup.CloseOnPressOutside

    // Semnal aruncat când se alege o dată
    signal dateAccepted(string formattedDate)

    property date selectedDate: new Date()

    background: Rectangle {
        color: root.menuBgCol
        border.color: root.boxShadowCol
        border.width: 1
        radius: 12
    }

    ColumnLayout {
        anchors.fill: parent
        spacing: 10

        // =====================================
        // 1. HEADER (Navigare Luni)
        // =====================================
        RowLayout {
            Layout.fillWidth: true

            // Buton Înapoi
            Button {
                Layout.preferredWidth: 32
                Layout.preferredHeight: 32
                background: Rectangle {
                    color: parent.hovered ? "#1affffff" : "transparent"
                    radius: 8
                }
                contentItem: Text {
                    text: "◀"
                    color: root.text
                    horizontalAlignment: Text.AlignHCenter
                    verticalAlignment: Text.AlignVCenter
                }
                onClicked: {
                    if (monthGrid.month === 0) {
                        monthGrid.month = 11
                        monthGrid.year--
                    } else {
                        monthGrid.month--
                    }
                }
            }

            // Text Lună și An
            Text {
                Layout.fillWidth: true
                horizontalAlignment: Text.AlignHCenter
                text: monthGrid.title // Titlu generat automat de MonthGrid
                color: root.text
                font.pixelSize: 16
                font.weight: Font.DemiBold
            }

            // Buton Înainte
            Button {
                Layout.preferredWidth: 32
                Layout.preferredHeight: 32
                background: Rectangle {
                    color: parent.hovered ? "#1affffff" : "transparent"
                    radius: 8
                }
                contentItem: Text {
                    text: "▶"
                    color: root.text
                    horizontalAlignment: Text.AlignHCenter
                    verticalAlignment: Text.AlignVCenter
                }
                onClicked: {
                    if (monthGrid.month === 11) {
                        monthGrid.month = 0
                        monthGrid.year++
                    } else {
                        monthGrid.month++
                    }
                }
            }
        }

        // =====================================
        // 2. ZILELE SĂPTĂMÂNII
        // =====================================
        DayOfWeekRow {
            Layout.fillWidth: true
            locale: Qt.locale("en_US") // Pentru ca săptămâna să arate standard englezesc (Sun, Mon, etc.)

            delegate: Text {
                text: model.shortName
                color: root.hoverCol // Folosim culoarea ta de accent
                font.pixelSize: 12
                font.weight: Font.Bold
                horizontalAlignment: Text.AlignHCenter
            }
        }

        // =====================================
        // 3. CALENDAR GRID
        // =====================================
        MonthGrid {
            id: monthGrid
            Layout.fillWidth: true
            Layout.fillHeight: true
            month: selectedDate.getMonth()
            year: selectedDate.getFullYear()
            locale: Qt.locale("en_US")

            delegate: Rectangle {
                property bool isSelected: model.date.getTime() === datePickerPopup.selectedDate.getTime()
                property bool isCurrentMonth: model.month === monthGrid.month

                width: monthGrid.width / 7
                height: monthGrid.height / 6
                radius: 6

                // Colorare adaptată la tema ta
                color: {
                    if (isSelected) return root.hoverCol
                    if (dayMouseArea.containsMouse) return "#1affffff"
                    return "transparent"
                }

                Text {
                    anchors.centerIn: parent
                    text: model.day
                    font.pixelSize: 14
                    color: {
                        if (isSelected) return root.bgCol // Culoarea textului inversată pe fundal selectat
                        if (!isCurrentMonth) return "#66" + root.text.toString().substring(1) // Altă lună = mai transparent
                        return root.text
                    }
                }

                MouseArea {
                    id: dayMouseArea
                    anchors.fill: parent
                    hoverEnabled: true
                    cursorShape: Qt.PointingHandCursor
                    onClicked: {
                        datePickerPopup.selectedDate = model.date

                        // Formatăm MM/DD/YYYY pentru a se potrivi cu placeholder-ul tău din Filters.qml
                        let m = (model.date.getMonth() + 1).toString().padStart(2, '0')
                        let d = model.date.getDate().toString().padStart(2, '0')
                        let y = model.date.getFullYear()

                        datePickerPopup.dateAccepted(`${m}/${d}/${y}`)
                        datePickerPopup.close()
                    }
                }
            }
        }
    }
}