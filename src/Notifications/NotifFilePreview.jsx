import Folder from "../assets/SVG/FileIcons/UserFiles.svg?react"

import "./Notifications.css"

export default function NotifFilePreview(props) {
    return(
        <div id="notifFilePreview">
            <Folder />

            <h4>Nume folder</h4>
        </div>
    )
}