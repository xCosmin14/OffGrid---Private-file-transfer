import { useState } from "react"

import AcceptFriendNotification from "./AcceptFriendNotification.jsx"
import InviteNotification from "./InviteNotification.jsx"
import FilePreviewNotification from "./FilePreviewNotification.jsx"
import TextNotification from "./TextNotification.jsx"

import {useTitle} from "../UseTitle.js"

import Seen from "../assets/SVG/Seen.svg?react"

import "./Notifications.css"

export default function Notifications() {
    const [scrollable, setScrollable] = useState(false)
    let notificationsNumber = localStorage.getItem("notificationsNumber")

    const handleScroll = (e) => {
        const el = e.target
        const progress = el.scrollTop / (el.scrollHeight - el.clientHeight)
        el.style.setProperty('--scroll-progress', `${Math.round(progress * 100)}%`)
    }

    const deleteNotifications = () => {
        const notifications = document.querySelectorAll(".notification")
        notifications.forEach(notification => {
            notification.remove()
        })
        notificationsNumber=0
        localStorage.setItem("notificationsNumber", 0)
    }

    return (
        <div id="notificationsCenter" 
            className={scrollable ? "showAll" : ""}
            style={{overflowY: scrollable ? "scroll" : "hidden"}}
            onScroll={handleScroll}
        >
            <h2>Notifications</h2>

            <div id="notificationsHeader">
                <button onClick={() => deleteNotifications()}>
                    <Seen />
                    <h4>Mark all as read</h4>
                </button>   

                <button onClick={() => setScrollable(true)}><h4>View all</h4></button> 
            </div>

            { notificationsNumber != 0 &&
            <div id="notificationsList">
                <AcceptFriendNotification id="acceptFriend" className="notification" 
                    className="notification" senderId="" sendDate=""
                />

                <InviteNotification id="InviteNotification" className="notification"
                    senderId="" sendDate="" folderID="" folderName=""
                />

                <FilePreviewNotification id="previewNotification" className="notification"
                    actionType="0" fileType="folder" senderId="" sendDate="" fileID="" folderID="" folderName=""
                    //fileType se completeaza cu extensia, actionType="0 - a incarcat un fisier in folder comun, 1 - ti-a trimis un fisier/folder"
                />

                <FilePreviewNotification id="previewNotification" className="notification"
                    actionType="1" fileType="pdf" senderId="" sendDate="" fileID="" folderID="" folderName=""
                    //fileType se completeaza cu extensia, actionType="0 - a incarcat un fisier in folder comun, 1 - ti-a trimis un fisier/folder"
                />

                <FilePreviewNotification id="previewNotification" className="notification"
                    actionType="1" fileType="apk" senderId="" sendDate="" fileID="" folderID="" folderName=""
                    //fileType se completeaza cu extensia, actionType="0 - a incarcat un fisier in folder comun, 1 - ti-a trimis un fisier/folder"
                />

                <TextNotification id="textNotification" className="notification"
                    actionType="0" senderId="" sendDate="" inviteCode="" fileID="" folderName=""
                />

                <TextNotification id="textNotification" className="notification"
                    actionType="1" senderId="" sendDate="" inviteCode="" fileID="" folderName=""
                />

                <TextNotification id="textNotification" className="notification"
                    actionType="2" senderId="" sendDate="" inviteCode="" fileID="" folderName=""
                />
            </div>
            }
        </div>
    )
}