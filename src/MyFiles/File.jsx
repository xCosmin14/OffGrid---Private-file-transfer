import { useState, useEffect, useRef } from "react"
import { useLocation } from "react-router-dom"
import { FileIcon, defaultStyles } from 'react-file-icon'

import Dots from "../assets/SVG/Dots.svg?react"
import Folder from "../assets/SVG/FileIcons/Folder.svg?react"
import Download from "../assets/SVG/FileIcons/Download.svg?react"
import Rename from "../assets/SVG/FileIcons/Rename.svg?react"
import Trash from "../assets/SVG/FileIcons/Trash.svg?react"
import StarFull from "../assets/SVG/StarFull.svg?react"
import Group from "../assets/SVG/UserIcons/Group.svg?react"
import ArrowDown from "../assets/SVG/ArrowDown.svg?react" 

export default function File(props) {
    const { pathname } = useLocation()
    const displayOwner = (pathname.includes("shared") || pathname.includes("favorites") || pathname.includes("trash"))
    const isFolder = props.extension === "Folder"

    const [showMenu, setShowMenu] = useState(false)
    const [isExpanded, setIsExpanded] = useState(false) 
    const menuRef = useRef(null)

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) setShowMenu(false)
        }

        if (showMenu) {
            document.addEventListener("mousedown", handleClickOutside)
            document.addEventListener("touchstart", handleClickOutside)
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
            document.removeEventListener("touchstart", handleClickOutside)
        }
    }, [showMenu])

    const handleAction = (e, action) => {
        e.stopPropagation()
        setShowMenu(false)
    }

    const handleRowClick = (e) => {
        if (window.innerWidth <= 500) setIsExpanded(p => !p)
        else if (isFolder && props.onFolderClick) props.onFolderClick()
    }

    return (
        <div className={`fileRow ${isExpanded ? "expanded" : ""}`} onClick={() => setIsExpanded(p => !p), handleRowClick}>
            <div className="fileNameCell">
                <div className="mobileExpandBtn" onClick={(e) => { e.stopPropagation(); setIsExpanded(p => !p) }}>
                    <ArrowDown className={`expandIcon ${isExpanded ? "rotated" : ""}`} />
                </div>

                    {isFolder ? (
                        <Folder style={{ color: props.color, fill: props.color }} />
                    ) : (
                        <FileIcon extension={props.extension} {...(defaultStyles[props.extension.toLowerCase()] || {})} />
                    )}

                <h3 className="itemName">{props.name}</h3>
            </div>
            
            <h3 className="fileDetail"><span className="mobileLabel">Type: </span>{isFolder ? "Folder" : props.extension}</h3>
            <h3 className="fileDetail"><span className="mobileLabel">Size: </span>{
                props.size ? props.size > 1073741824 ? `${Number.parseFloat(props.size/1000000.0).toFixed(2)} GB` : `${Number.parseFloat(props.size/1048576.0).toFixed(2)} MB` : "0 MB"
            }</h3>
            <h3 className="fileDetail"><span className="mobileLabel">Created: </span>{props.created}</h3>
            <h3 className="fileDetail"><span className="mobileLabel">Modified: </span>{props.lastModified}</h3>
            {displayOwner && <h3 className="fileDetail"><span className="mobileLabel">Owner: </span>{props.owner}</h3>}

            <div className="fileOptionsContainer" ref={menuRef} 
                onClick={(e) => {
                    e.stopPropagation()
                    setShowMenu(p => !p)
                }}>
                <Dots className="fileDots" />

                {showMenu && <div className="fileDropdownMenu">
                    <div className="pathMenuOption" onClick={(e) => handleAction(e, "download")}>
                        <Download /><h5>Download</h5>
                    </div>
                    <hr />
                    <div className="pathMenuOption" onClick={(e) => handleAction(e, "rename")}>
                        <Rename /><h5>Rename</h5>
                    </div>
                    <hr />
                    <div className="pathMenuOption" onClick={(e) => handleAction(e, "delete")}>
                        <Trash /><h5>Delete</h5>
                    </div>
                    <div className="pathMenuOption" onClick={(e) => handleAction(e, "favorites")}>
                        <StarFull /><h5>Favorites</h5>
                    </div>
                    <hr />
                    <div className="pathMenuOption" onClick={(e) => handleAction(e, "access")}>
                        <Group /><h5>Manage Access</h5>
                    </div>
                </div>}
            </div>
        </div>
    )
}