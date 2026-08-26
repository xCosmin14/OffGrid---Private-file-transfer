import { useState, useEffect, useRef, useContext } from "react"
import { decryptFekForUser, encryptFekForUser, decryptFile } from "../CryptoUtils.js"
import { FileIcon, defaultStyles } from 'react-file-icon'

import { customFetch } from "../UserContext.jsx"
import { FileContext } from "../GetFiles.jsx"
import { UserContext } from "../UserContext.jsx"
import { loadCachedPrivateKey } from "../CryptoCache.js"

import MockUserImg from "../Assets/MockUserImg.jpg"

import Add from "../assets/SVG/FileIcons/Add.svg?react"
import Dots from "../assets/SVG/Dots.svg?react"
import Folder from "../assets/SVG/FileIcons/Folder.svg?react"
import Download from "../assets/SVG/FileIcons/Download.svg?react"
import Rename from "../assets/SVG/FileIcons/Rename.svg?react"
import Trash from "../assets/SVG/FileIcons/Trash.svg?react"
import StarFull from "../assets/SVG/StarFull.svg?react"
import Group from "../assets/SVG/UserIcons/Group.svg?react"
import ArrowDown from "../assets/SVG/ArrowDown.svg?react"

export default function File(props) {
    const key = import.meta.env.VITE_HOST_ADDRESS

    const isFolder = props.extension === "Folder"

    const { refreshFiles } = useContext(FileContext)
    const { user } = useContext(UserContext)

    const [showMenu, setShowMenu] = useState(false)
    const [isExpanded, setIsExpanded] = useState(false)
    const menuRef = useRef(null)

    const [displayRename, setDisplayRename] = useState(false)
    const renameRef = useRef(null)
    const [newName, setNewName] = useState(props.name || "")
    const [newFolderColor, setNewFolderColor] = useState(props.color || "#000000")

    const [displayAccess, setDisplayAccess] = useState(false)
    const [localCollaborators, setLocalCollaborators] = useState(props.collaborators || [])
    const [collaboratorPhotos, setCollaboratorPhotos] = useState({})

    const accessRef = useRef(null)

    const [usernameToSend, setUsernameToSend] = useState("")
    const [permissionsToSend, setPermissionsToSend] = useState("view")

    useEffect(() => {
        const handleClickOutsideRename = (event) => {
            if (renameRef.current && !renameRef.current.contains(event.target))
                setDisplayRename(false)
        }

        const handleKeyDownRename = (event) => {
            if (event.key === "Escape") setDisplayRename(false)
            else if (event.key === "Enter") submitRename()
        }

        if (displayRename) {
            document.addEventListener("mousedown", handleClickOutsideRename)
            document.addEventListener("touchstart", handleClickOutsideRename)
            window.addEventListener("keydown", handleKeyDownRename)
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutsideRename)
            document.removeEventListener("touchstart", handleClickOutsideRename)
            window.removeEventListener("keydown", handleKeyDownRename)
        }
    }, [displayRename, newName, newFolderColor])

    useEffect(() => {
        const handleClickOutsideAccess = (event) => {
            if (accessRef.current && !accessRef.current.contains(event.target))
                setDisplayAccess(false)
        }

        const handleKeyDownAccess = (event) => {
            if (event.key === "Escape") setDisplayAccess(false)
            else if (event.key === "Enter") submitAccess()
        }

        if (displayAccess) {
            document.addEventListener("mousedown", handleClickOutsideAccess)
            document.addEventListener("touchstart", handleClickOutsideAccess)
            window.addEventListener("keydown", handleKeyDownAccess)
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutsideAccess)
            document.removeEventListener("touchstart", handleClickOutsideAccess)
            window.removeEventListener("keydown", handleKeyDownAccess)
        }
    }, [displayAccess, usernameToSend, permissionsToSend])

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) setShowMenu(false)
        }

        const handleKeyDownMenu = (event) => {
            if (event.key === "Escape") setShowMenu(false)
        }

        if (showMenu) {
            document.addEventListener("mousedown", handleClickOutside)
            document.addEventListener("touchstart", handleClickOutside)
            window.addEventListener("keydown", handleKeyDownMenu)
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
            document.removeEventListener("touchstart", handleClickOutside)
            window.removeEventListener("keydown", handleKeyDownMenu)
        }
    }, [showMenu])

    useEffect(() => {
        setLocalCollaborators(props.collaborators || [])
    }, [props.collaborators])

    useEffect(() => {
        let isMounted = true, createdUrls = []

        const fetchPhotos = async () => {
            if (!displayAccess || localCollaborators.length === 0) {
                setCollaboratorPhotos({})
                return
            }

            try {
                const res = await customFetch(`http://${key}:18080/get_collaborators_profile`, {
                    method: 'GET'
                })

                if (res.ok) {
                    const formData = await res.formData()
                    const files = formData.getAll('file')

                    createdUrls = files.map(file => URL.createObjectURL(file))

                    const photosMap = {}
                    localCollaborators.forEach((collab, index) => {
                        if (createdUrls[index]) photosMap[collab] = createdUrls[index]
                    })

                    if (isMounted) setCollaboratorPhotos(photosMap)
                }
            } catch (err) {
                console.error("Error fetching collaborator photos:", err)
            }
        }

        fetchPhotos()

        return () => {
            isMounted = false
            createdUrls.forEach(url => URL.revokeObjectURL(url))
        }
    }, [displayAccess, localCollaborators])

    const handleAction = async (e, action) => {
        e.stopPropagation()
        setShowMenu(false)

        switch (action) {
            case "rename": {
                setNewName(props.name || "")
                setNewFolderColor(props.color || "#000000")
                setDisplayRename(true)
                break
            }

            case "delete": {
                const endpoint = isFolder ? "delete_folder" : "delete_file"
                const url = `http://${key}:18080/${endpoint}?${props.id}`

                const response = await customFetch(url, {
                    method: "DELETE",
                    headers: { 'Content-Type': 'application/json' },
                })

                if (response.ok) await refreshFiles()
                break
            }

            case "download": {
                try {
                    const endpoint = isFolder ? "get_folder" : "get_file"
                    const url = `http://${key}:18080/${endpoint}?${isFolder ? "folder_id" : "file_id"}=${props.id}`

                    const response = await customFetch(url, {
                        method: "GET",
                        credentials: "include",
                        headers: { 'Content-Type': 'application/json' },
                    })

                    if (!response.ok) throw new Error("Download failed")

                    let buffer = await response.arrayBuffer()
                    let downloadBytes = buffer

                    if (!isFolder) {
                        const privateKey = await loadCachedPrivateKey()
                        if (!privateKey) throw new Error("Private key not found.")
                        if (!props.fek) throw new Error("No FEK available for this file.")
                        if (!user?.public_key) throw new Error("Missing user public key.")

                        const fek = await decryptFekForUser(props.fek, user.public_key, privateKey)
                        const encryptedBytes = new Uint8Array(buffer)
                        downloadBytes = await decryptFile(encryptedBytes, fek)
                    }

                    const blobUrl = URL.createObjectURL(new Blob([downloadBytes], { type: 'application/octet-stream' }))
                    const a = document.createElement('a')
                    a.href = blobUrl
                    a.download = isFolder ? `${props.name}.zip` : props.name
                    document.body.appendChild(a)
                    a.click()

                    document.body.removeChild(a)
                    URL.revokeObjectURL(blobUrl)
                } catch (err) {
                    console.error("Download error:", err)
                    alert(`Download error: ${err.message}`)
                }

                break
            }

            case "favorites": {
                const type = isFolder ? "folder" : "file"
                const response = await customFetch(`http://${key}:18080/change_data/${type}/${props.id}`, {
                    method: "PATCH",
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ favourite: props.favourite ? 0 : 1 })
                })

                if (response.ok) await refreshFiles()
                break
            }

            case "access": {
                setUsernameToSend("")
                setDisplayAccess(true)
                break
            }

            default: return
        }
    }

    const submitRename = async () => {
        if (!newName || (newName === props.name && newFolderColor === props.color)) return

        const type = isFolder ? "folder" : "file"
        const body = isFolder
            ? { name: newName, color: newFolderColor }
            : { name: newName }

        try {
            const response = await customFetch(`http://${key}:18080/change_data/${type}/${props.id}`, {
                method: "PATCH",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            })

            if (response.ok) {
                setDisplayRename(false)
                if (refreshFiles) await refreshFiles()
            }
        } catch (err) {
            console.error("Rename error:", err)
        }
    }

    const removeCollaborator = async (username) => {
        try {
            const response = await customFetch(`http://${key}:18080/revoke_access`, {
                method: "POST",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: username,
                    file_id: props.id,
                    resource: isFolder ? "folder" : "file"
                })
            })

            if (response.ok) {
                setLocalCollaborators(prev => prev.filter(user => user !== username))
                if (refreshFiles) await refreshFiles()
            }
        } catch (err) {
            console.error("Remove error:", err)
        }
    }

    const submitAccess = async () => {
        if (!usernameToSend || usernameToSend === props.owner || localCollaborators.includes(usernameToSend)) return

        try {
            const keyRequest = await customFetch(`http://${key}:18080/public_key?${usernameToSend}`, {
                method: "GET",
                headers: { 'Content-Type': 'application/json' },
                credentials: "include"
            })

            if (keyRequest.ok) {
                const keyJson = await keyRequest.json()
                const receiverPublicKey = keyJson.public_key


                const myPrivateKey = await loadCachedPrivateKey()
                if (!myPrivateKey) throw new Error("Private key not found.")

                const fek = await decryptFekForUser(props.fek, receiverPublicKey, myPrivateKey)
                const fekForReceiver = await encryptFekForUser(fek, receiverPublicKey)

                const response = await customFetch(`http://${key}:18080/grant_access`, {
                    method: "POST",
                    headers: { 'Content-Type': 'application/json' },
                    body: isFolder ? JSON.stringify({
                        username: usernameToSend,
                        folder_id: props.id,
                        type: permissionsToSend,
                        resource: "folder",
                    }) : JSON.stringify({
                        username: usernameToSend,
                        file_id: props.id,
                        type: permissionsToSend,
                        resource: "file",
                        fek: fekForReceiver
                    })
                })

                if (response.ok) {
                    setLocalCollaborators(prev => [...prev, usernameToSend])
                    setUsernameToSend("")
                    if (refreshFiles) await refreshFiles()
                }
            }
        } catch (err) {
            console.error("Share error:", err)
        }
    }

    const handleRowClick = () => {
        if (props.onFileClick) props.onFileClick()
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
                        type="text" required
                        name="newFileName"
                        placeholder="Name"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onBeforeInput={(e) => {
                            if (/[/]/.test(e.data)) e.preventDefault()
                        }}
                    />

                    {isFolder && (
                        <div id="newFolderColor">
                            <h3>Color: {newFolderColor.includes("var") ?
                                window.getComputedStyle(document.documentElement).getPropertyValue('--hoverCol')
                                    .trim().replace("light-dark(", "").replace(", ", " / ").replace(")", "") :
                                newFolderColor}</h3>
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

    const renderAccessModal = () => {
        if (!displayAccess) return null

        return (
            <div className="modalOverlay" onClick={(e) => {
                e.stopPropagation()
                setDisplayAccess(false)
            }}>
                <div id="createFolder" ref={accessRef} onClick={(e) => e.stopPropagation()}>
                    <h2>{isFolder ? "Share folder" : "Share file"}</h2>

                    <input
                        type="text" name="username" required
                        placeholder="Username" value={usernameToSend}
                        onChange={(e) => setUsernameToSend(e.target.value)}
                        onBeforeInput={(e) => {
                            if (!/[a-zA-Z0-9]/.test(e.data)) e.preventDefault()
                        }}
                    />

                    <div id="permissions">
                        <h3>Permissions:</h3>

                        <select name="permissions" value={permissionsToSend} onChange={(e) => setPermissionsToSend(e.target.value)}>
                            <option value="view">View</option>
                            <option value="edit">Edit</option>
                        </select>
                    </div>

                    <div className="createFolderActions">
                        <button onClick={(e) => {
                            e.stopPropagation()
                            setDisplayAccess(false)
                        }}>Cancel</button>

                        <button onClick={(e) => {
                            e.stopPropagation()
                            submitAccess()
                        }}>Share</button>
                    </div>

                    {localCollaborators.length > 0 && (
                        <div className="accessInfo">
                            <h3>Collaborators:</h3>

                            <div className="collaboratorsList">
                                {localCollaborators.map((collab, index) => (
                                    <div key={`${collab}-${index}`} className="collaborator">
                                        {collaboratorPhotos[collab] && (
                                            <img
                                                src={collaboratorPhotos[collab]}
                                                alt={collab}
                                                className="collaboratorAvatar"
                                            />
                                        )}

                                        {!collaboratorPhotos[collab] && (
                                            <img
                                                src={MockUserImg}
                                                alt={collab}
                                                className="collaboratorAvatar"
                                            />
                                        )}
                                        <p>{collab}</p>
                                        <Add onClick={() => removeCollaborator(collab)} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
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

            <h3 className="fileDetail"><span className="mobileLabel">Type: </span>{isFolder ? "Folder" : props.extension}</h3>
            <h3 className="fileDetail"><span className="mobileLabel">Size: </span>{
                props.size ? props.size > 1073741824 ? `${Number.parseFloat(props.size / 1073741824.0).toFixed(2)} GB` : `${Number.parseFloat(props.size / 1048576.0).toFixed(2)} MB` : "0 MB"
            }</h3>
            <h3 className="fileDetail"><span className="mobileLabel">Created: </span>{props.created}</h3>
            <h3 className="fileDetail"><span className="mobileLabel">Modified: </span>{props.lastModified}</h3>
            <h3 className="fileDetail"><span className="mobileLabel">Owner: </span>{props.owner === user.username ? "You" : props.owner}</h3>

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
                    <div className="pathMenuOption" onClick={(e) => handleAction(e, "rename")} >
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
            {renderAccessModal()}
        </div>
    )
}