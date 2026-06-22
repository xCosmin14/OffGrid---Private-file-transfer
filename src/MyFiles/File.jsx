import { useState, useEffect, useRef } from "react"
import { useLocation } from "react-router-dom"
import { FileIcon, defaultStyles } from 'react-file-icon'

import Dots from "../assets/SVG/Dots.svg?react"
import Folder from "../assets/SVG/FileIcons/UserFiles.svg?react"
import Download from "../assets/SVG/FileIcons/Download.svg?react"
import Rename from "../assets/SVG/FileIcons/Rename.svg?react"
import Trash from "../assets/SVG/FileIcons/Trash.svg?react"
import StarFull from "../assets/SVG/StarFull.svg?react"
import Group from "../assets/SVG/UserIcons/Group.svg?react"
import ArrowDown from "../assets/SVG/ArrowDown.svg?react" 
export default function File(props) {
    const { pathname } = useLocation()
    const displayOwner = (pathname.includes("shared") || pathname.includes("favorites") || pathname.includes("trash"))
    const isFolder = props.extension === "folder"

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

    return (
        <div className={`fileRow ${isExpanded ? "expanded" : ""}`} onClick={() => setIsExpanded(p => !p)}>
            <div className="fileNameCell">
                {/* Butonul de expandare (vizibil doar pe mobil) */}
                <div className="mobileExpandBtn" onClick={(e) => { e.stopPropagation(); setIsExpanded(p => !p) }}>
                    <ArrowDown className={`expandIcon ${isExpanded ? "rotated" : ""}`} />
                </div>

                <div className="fileIconWrapper">
                    {isFolder ? (
                        <Folder />
                    ) : (
                        <FileIcon extension={props.extension} {...(defaultStyles[props.extension] || {})} />
                    )}
                </div>

                <h3 className="itemName">{props.name}</h3>
            </div>
            
            {/* Informațiile ascunse pe mobil până la expandare */}
            <h3 className="fileDetail"><span className="mobileLabel">Type: </span>{isFolder ? "Folder" : props.extension}</h3>
            <h3 className="fileDetail"><span className="mobileLabel">Size: </span>{props.size ? props.size : "-"}</h3>
            <h3 className="fileDetail"><span className="mobileLabel">Modified: </span>{props.lastModified}</h3>
            {displayOwner && <h3 className="fileDetail"><span className="mobileLabel">Owner: </span>{props.owner}</h3>}

            <div className="fileOptionsContainer" ref={menuRef}>
                <Dots 
                    className="fileDots" 
                    onClick={(e) => {
                        e.stopPropagation()
                        setShowMenu(p => !p)
                    }} 
                />

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