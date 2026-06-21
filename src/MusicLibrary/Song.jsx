import { useLocation } from "react-router-dom"
import { FileIcon, defaultStyles } from 'react-file-icon';

import Dots from "../assets/SVG/Dots.svg?react"
import Folder from "../assets/SVG/FileIcons/UserFiles.svg?react"

export default function File(props) {
    const { pathname } = useLocation()
    const displayOwner = (pathname.includes("shared") || pathname.includes("favorites") || pathname.includes("trash"))

    const isFolder = props.extension === "folder";

    return (
        <div className="fileRow">
            <div className="fileNameCell">
                <div className="fileIconWrapper">
                    <FileIcon extension={props.extension} {...(defaultStyles[props.extension] || {})} />
                </div>
                <h3>{props.name}</h3>
            </div>
            
            <h3>{isFolder ? "Folder" : props.extension}</h3>
            
            <h3>{props.size ? props.size : "-"}</h3>
            
            <h3>{props.lastModified}</h3>
            {displayOwner && <h3>{props.owner}</h3>}

            <Dots className="fileDots"/>
        </div>
    )
}