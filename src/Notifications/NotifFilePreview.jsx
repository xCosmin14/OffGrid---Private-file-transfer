import { FileIcon, defaultStyles } from 'react-file-icon'
import Folder from "../assets/SVG/FileIcons/UserFiles.svg?react"
import "./Notifications.css"

export default function NotifFilePreview(props) {
    return (
        <div id="notifFilePreview">
            {props.fileType === "folder" ? (
                <Folder />
            ) : (
                <FileIcon extension={props.fileType} {...(defaultStyles[props.fileType] || {})} />
            )}
            <h4>{props.fileName || "File"}</h4>
        </div>
    )
}