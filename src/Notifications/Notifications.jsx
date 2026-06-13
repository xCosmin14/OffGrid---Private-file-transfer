import { useState } from "react"

import AcceptFriendNotification from "./AcceptFriendNotification.jsx"
import ActionNotification from "./ActionNotification.jsx"
import FilePreviewNotification from "./FilePreviewNotification.jsx"
import TextNotification from "./TextNotification.jsx"

import {useTitle} from "../UseTitle.js"

import Seen from "../assets/SVG/Seen.svg?react"

import "./Notifications.css"

export default function Notifications() {
    const [scrollable, setScrollable] = useState(false)

    useTitle("Notifications")

    return (
        <div id="notificationsCenter" style={{overflowY: scrollable ? "scroll" : "hidden"}}>
            <div id="notificationsHeader">
                <h2>Notifications</h2>

                <button onClick={() => setScrollable(true)}>
                    <Seen />
                    <h4>Mark all as read</h4>
                </button>                
            </div>

            {
                /*
                AcceptFriendNotification - text + butoane : a trimis cererea
                ActionNotification - text + preview + butoane : a trimis fișierul, te-a invitat în folder
                FilePreviewNotification text + preview : a încărcat, a trimis
                TextNotification - doar text : a șters, a acceptat cererea, a făcut cont
                */
            }
            <div id="notificationsList">
                <AcceptFriendNotification senderId="" sendDate=""/>
                <ActionNotification actionType="" senderId="" sendDate="" fileID="" folderID=""/>
                <FilePreviewNotification actionType="" senderId="" sendDate="" fileID="" folderID=""/>
                <TextNotification actionType="" senderId="" sendDate="" inviteCode="" fileID="" folderID=""/>
            </div>
        </div>
    )
}