import { useState, useEffect, useRef } from "react"
import { FileIcon, defaultStyles } from 'react-file-icon'

import Dots from "../assets/SVG/Dots.svg?react"
import Folder from "../assets/SVG/FileIcons/UserFiles.svg?react"
import Download from "../assets/SVG/FileIcons/Download.svg?react"
import Rename from "../assets/SVG/FileIcons/Rename.svg?react"
import ChangeColor from "../assets/SVG/FileIcons/ChangeColor.svg?react"
import Trash from "../assets/SVG/FileIcons/Trash.svg?react"
import StarFull from "../assets/SVG/StarFull.svg?react"
import Group from "../assets/SVG/UserIcons/Group.svg?react"

export default function Song(props) {
    const isFolder = props.extension === "folder"

    const [showMenu, setShowMenu] = useState(false)
    const menuRef = useRef(null)

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowMenu(false)
            }
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
        console.log("Action:", action, "on song:", props.name)
        setShowMenu(false)
    }

    return (
        <div className="fileRow">
            {/* 1. Title */}
            <div className="fileNameCell">
                <div className="fileIconWrapper">
                    {isFolder ? (
                        <Folder />
                    ) : (
                        <FileIcon extension={props.extension || "mp3"} {...(defaultStyles[props.extension || "mp3"] || {})} />
                    )}
                </div>
                <h3>{props.name}</h3>
            </div>
            
            {/* 2. Artists */}
            <h3>{isFolder ? "-" : (props.artists || "-")}</h3>
            
            {/* 3. Album */}
            <h3>{isFolder ? "-" : (props.album || "-")}</h3>
            
            {/* 4. Duration */}
            <h3>{isFolder ? "-" : (props.duration || "-")}</h3>

            {/* 5. Release date */}
            <h3>{isFolder ? "-" : (props.releaseDate || "-")}</h3>
            
            {/* 6. Added / Modified */}
            <h3>{props.lastModified || "-"}</h3>

            {/* 7. Size */}
            <h3>{props.size ? props.size : "-"}</h3>

            {/* Container Meniu Contextual (Element absolut, nu afectează grid-ul) */}
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
                        <Download />
                        <h5>Download</h5>
                    </div>

                    <hr />

                    <div className="pathMenuOption" onClick={(e) => handleAction(e, "rename")}>
                        <Rename />
                        <h5>Rename</h5>
                    </div>

                    <hr />

                    <div className="pathMenuOption" onClick={(e) => handleAction(e, "delete")}>
                        <Trash />
                        <h5>Delete</h5>
                    </div>

                    <div className="pathMenuOption" onClick={(e) => handleAction(e, "favorites")}>
                        <StarFull />
                        <h5>Favorites</h5>
                    </div>

                    <hr />
                    
                    <div className="pathMenuOption" onClick={(e) => handleAction(e, "access")}>
                        <Group />
                        <h5>Manage Access</h5>
                    </div>
                </div>}
            </div>
        </div>
    )
}