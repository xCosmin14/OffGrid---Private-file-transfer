import { FileIcon, defaultStyles } from 'react-file-icon';

import Folder from "../assets/SVG/FileIcons/UserFiles.svg?react"

import "./Notifications.css"

export default function NotifFilePreview(props) {
    console.log(props.fileType)
    return (
        <div id="notifFilePreview">
            {
                (props.fileType === "folder") ? <Folder />
                : <FileIcon extension={props.fileType} {...(defaultStyles[props.fileType] || {})} />
            }

            <h4>Nume folder</h4>
        </div>
    )
}