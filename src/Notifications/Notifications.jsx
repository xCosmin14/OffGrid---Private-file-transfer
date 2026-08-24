import { useState, useContext, useEffect } from "react" 

import InviteNotification from "./InviteNotification.jsx"
import FilePreviewNotification from "./FilePreviewNotification.jsx"
import TextNotification from "./TextNotification.jsx"

import { customFetch, UserContext } from "../UserContext.jsx"
import Seen from "../assets/SVG/Seen.svg?react"

import "./Notifications.css"

const key = import.meta.env.VITE_HOST_ADDRESS

const getNotifications = async () => {
    try {
        const response = await customFetch(`http://${key}:18080/get_notifications`, {
            method: "GET",
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
        })

        const resp = await response.json()
        return resp.notifications || []
    } catch (err) {
        console.error("Error fetching notifications:", err)
        return []
    }
}

const formatTime = (dateStr) => {
    if (!dateStr) return ""
    const datePart = new Date()
    const dateTxt = datePart
        .toLocaleDateString("en-US", {weekday: "long", year: "numeric", month: "long", day: "numeric"})
        .replace(/, (\d{4})/, ' $1') 
        
    const timePart = dateStr.split(" ")[1]?.slice(0, 5) || ""
    return `${dateTxt}, ${timePart}`
}

export default function Notifications() {
    const [scrollable, setScrollable] = useState(false)
    const [notifications, setNotifications] = useState([])

    const { notifications: wsNotifications, sendMessage } = useContext(UserContext) || {}

    useEffect(() => {
        const fetchInitialNotifications = async () => {
            const data = await getNotifications()
            setNotifications(data)
        }
        fetchInitialNotifications()
    }, [])

    useEffect(() => {
        if (wsNotifications && wsNotifications.length > 0) 
            setNotifications(prev => {
                const existingIds = new Set(prev.map(n => n.notification_id))
                const newOnly = wsNotifications.filter(n => !existingIds.has(n.notification_id))
                return [...prev, ...newOnly]
            })
    }, [wsNotifications])

    const handleScroll = (e) => {
        const el = e.target
        const progress = el.scrollTop / (el.scrollHeight - el.clientHeight)
        el.style.setProperty('--scroll-progress', `${Math.round(progress * 100)}%`)
    }

    const deleteNotifications = () => {
        if (!sendMessage || notifications.length === 0) return

        notifications.forEach((notif) => {
            const notifId = notif.notification_id || notif.key
            sendMessage({ type: "view_notification", notification_id: notifId })
        })

        setNotifications([])
    }

    const deleteSingleNotification = (notifId) => {
        if (sendMessage) sendMessage({ type: "delete_notification", notification_id: notifId })
        
        setNotifications(prev => prev.filter(n => (n.notification_id || n.key) !== notifId))
    }

    const renderNotification = (notif, index) => {
        let info = {}

        if (typeof notif.info === "string")  info = JSON.parse(notif.info)
        else if (notif.info) info = notif.info
        
        const notifId = notif.notification_id || notif.key 
        const id = notifId || `notif-${index}`
        const sender = info.sender_username || notif.username || "System"
        const type = info.type || notif.type
        const entity = info.entity || notif.entity
        const itemName = info.folder_name || info.file_name || "" 
        const formattedTime = formatTime(notif.sent)

        if (type === "access_granted" && entity === "folder") {
            return (
                <InviteNotification 
                    key={id} 
                    id={notifId} 
                    onDelete={deleteSingleNotification} 
                    sender={sender} 
                    sent={formattedTime} 
                    folderName={itemName} 
                    folderID={info.entity_id}
                />
            )
        }

        if (type === "access_granted" && entity === "file") {
            const extension = itemName.includes(".") ? itemName.split(".").pop().toLowerCase() : "file"

            return (
                <FilePreviewNotification 
                    key={id} 
                    id={notifId}
                    onDelete={deleteSingleNotification} 
                    senderId={sender} 
                    sent={formattedTime}
                    actionType={1} 
                    fileType={extension} 
                    fileName={itemName}
                />
            )
        }

        return (
            <TextNotification 
                key={id} 
                id={notifId}
                onDelete={deleteSingleNotification} 
                sender={sender} 
                sent={formattedTime}
                fileName={itemName}
                actionType={0}
            />
        )
    }

    return (
        <div id="notificationsCenter" 
            className={scrollable ? "showAll" : ""}
            style={{ overflowY: scrollable ? "scroll" : "hidden" }}
            onScroll={handleScroll}
        >
            <h2>Notifications</h2>

            <div id="notificationsHeader">
                <button onClick={deleteNotifications}>
                    <Seen />
                    <h4>Mark as read</h4>
                </button>   

                <button onClick={() => setScrollable(true)}><h4>View all</h4></button> 
            </div>

            {notifications.length > 0 && (
                <div id="notificationsList">
                    {[...notifications]
                        .sort((a, b) => new Date(b.sent) - new Date(a.sent))
                        .map((notification, index) => renderNotification(notification, index))}
                </div>
            )}
        </div>
    )
}