import { useState, useEffect, useRef, useContext } from "react"
import { useLocation } from "react-router-dom"
import { FileIcon, defaultStyles } from 'react-file-icon'

import { customFetch } from "../UserContext.jsx"
import { FileContext } from "../GetFiles.jsx"

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
    const { refreshFiles } = useContext(FileContext)

    const [showMenu, setShowMenu] = useState(false)
    const [isExpanded, setIsExpanded] = useState(false) 
    const menuRef = useRef(null)

    const [displayRename, setDisplayRename] = useState(false)
    const renameRef = useRef(null)

    const [newName, setNewName] = useState(props.name || "")
    const [newFolderColor, setNewFolderColor] = useState(props.color || "#000000")

    useEffect(() => {
        const handleClickOutsideRename = (event) => {
            if (renameRef.current && !renameRef.current.contains(event.target)) {
                setDisplayRename(false)
            }
        }

        if (displayRename) {
            document.addEventListener("mousedown", handleClickOutsideRename)
            document.addEventListener("touchstart", handleClickOutsideRename)
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutsideRename)
            document.removeEventListener("touchstart", handleClickOutsideRename)
        }
    }, [displayRename])

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

    const handleAction = async (e, action) => {
        e.stopPropagation()
        setShowMenu(false)

        switch(action) {
            case "rename": {
                setNewName(props.name || "")
                setNewFolderColor(props.color || "#000000")
                setDisplayRename(true)
                break
            }

            case "delete": {
                const endpoint = isFolder ? "delete_folder" : "delete_file"
                const url = `http://localhost:18080/${endpoint}?${props.id}`

                const response = await customFetch(url, {
                    method: "DELETE",
                    headers: { 'Content-Type': 'application/json' },
                })

                if (response.ok) await refreshFiles()
                break
            }

            case "download": {
                const response = await customFetch(`http://localhost:18080/get_file?file_id=${props.id}`, {
                    method: "GET",
                    headers: { 'Content-Type': 'application/json' },
                })

                let buffer = await response.arrayBuffer()
                const url = URL.createObjectURL(new Blob([buffer], { type: 'application/octet-stream' }))
                const a = document.createElement('a')
                a.href = url
                a.download = props.name
                document.body.appendChild(a)
                a.click()

                document.body.removeChild(a)
                URL.revokeObjectURL(url)
                break
            }

            case "favorites": {
                const type = isFolder ? "folder" : "file"
                const response = await customFetch(`http://localhost:18080/change_data/${type}/${props.id}`, {
                    method: "PATCH",
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ favourite: props.favourite ? 0 : 1 })
                })
                
                if (response.ok) await refreshFiles()
                break
            }

            default: return
        }
    }

    const submitRename = async () => {
        if (!newName) return

        const type = isFolder ? "folder" : "file"
        const body = isFolder 
            ? { name: newName, color: newFolderColor }
            : { name: newName }

        try {
            const response = await customFetch(`http://localhost:18080/change_data/${type}/${props.id}`, {
                method: "PATCH",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            })

            if (response.ok) {
                setDisplayRename(false)
                if (refreshFiles) await refreshFiles()
            }
        } catch (err) {
            console.error("Eroare la redenumire:", err)
        }
    }

    const handleRowClick = () => {
        if (!isFolder) props.onFileClick()
    }

    const renderRenameModal = () => {
        if (!displayRename) return null

        return (
            <div className="modalOverlay" onClick={(e) => {
                e.stopPropagation()
                setDisplayRename(false)
            }}>
                <div id="createFolder" ref={renameRef} onClick={(e) => e.stopPropagation()}>
                    <h2>{isFolder ? "Edit folder" : "Rename file"}</h2>
                    
                    <input 
                        type="text" 
                        name="newFileName" 
                        placeholder="Name" 
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                    />

                    {isFolder && (
                        <div id="newFolderColor">
                            <h3>Color: {newFolderColor}</h3>
                            <input 
                                type="color" 
                                name="newFolderColor" 
                                value={newFolderColor}
                                onChange={(e) => setNewFolderColor(e.target.value)}
                            />
                        </div>
                    )}
                    
                    <div className="createFolderActions">
                        <button onClick={(e) => {
                            e.stopPropagation()
                            setDisplayRename(false)
                        }}>Cancel</button>

                        <button onClick={(e) => {
                            e.stopPropagation()
                            submitRename()
                        }}>Save</button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className={`fileRow ${isExpanded ? "expanded" : ""}`} onClick={handleRowClick}>
            <div className="fileNameCell">
                
                <div className="mobileExpandBtn" onClick={(e) => { 
                    e.stopPropagation() 
                    setIsExpanded(p => !p) 
                }}>
                    <ArrowDown className={`expandIcon ${isExpanded ? "rotated" : ""}`} />
                </div>

                {isFolder ? (
                    <Folder style={{ color: props.color, fill: props.color }} />
                ) : (
                    <FileIcon extension={props.extension} {...(defaultStyles[props.extension.toLowerCase()] || {})} />
                )}

                <h3 className="itemName">{props.name}</h3>
            </div>
            
            {!props.hideType && (
                <h3 className="fileDetail"><span className="mobileLabel">Type: </span>{isFolder ? "Folder" : props.extension}</h3>
            )}
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
                        <StarFull style={{ color: props.favourite ? "var(--hoverCol)" : "var(--text)" }} />
                        <h5>{props.favourite ? "Remove from " : "Add to "}favorites</h5>
                    </div>
                    <hr />
                    <div className="pathMenuOption" onClick={(e) => handleAction(e, "access")}>
                        <Group /><h5>Manage Access</h5>
                    </div>
                </div>}
            </div>

            {renderRenameModal()}
        </div>
    )
}