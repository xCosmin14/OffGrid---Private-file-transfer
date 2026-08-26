import { useState, useEffect, useRef, useContext, useMemo } from "react"
import { Link, useSearchParams, useNavigate, useLocation } from 'react-router-dom' 

import { useTitle } from "../UseTitle.js"

import { UserContext } from "../UserContext.jsx"
import { FileContext } from "../GetFiles.jsx"

import { getFileColor } from "./FileColors.js"
import isMobile from "../IsMobile.js"
import { customFetch, UserContext } from "../UserContext.jsx" 
import { loadCachedPrivateKey } from "../CryptoCache.js"
import { decryptFekForUser, decryptFile } from "../CryptoUtils.js"

import AddFile from "./AddFile.jsx"
import Filters from "./Filters.jsx"
import File from "./File.jsx"
import FileViewer from "../FileViewer/FileViewer.jsx"

import ArrowRight from "../assets/SVG/ArrowRight.svg?react"
import ArrowDown from "../assets/SVG/ArrowDown.svg?react"
import ArrowUp from "../assets/SVG/ArrowUp.svg?react"
import Download from "../assets/SVG/FileIcons/Download.svg?react"
import Rename from "../assets/SVG/FileIcons/Rename.svg?react"
import ChangeColor from "../assets/SVG/FileIcons/ChangeColor.svg?react"
import Trash from "../assets/SVG/FileIcons/Trash.svg?react"
import StarFull from "../assets/SVG/StarFull.svg?react"
import Group from "../assets/SVG/UserIcons/Group.svg?react"

import "./MyFiles.css"

const getParentPath = (fullPath) => {
    if (!fullPath) return ""
    const lastSlash = fullPath.lastIndexOf("/")
    return lastSlash === -1 ? "" : fullPath.substring(0, lastSlash)
}

const formatDate = (dateString) => {
    if (!dateString) return ""
    const d = new Date(dateString.slice(0, dateString.length - 7))
    
    return d.toLocaleDateString("en-UK", { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
    })
}

const sortItems = (items, crit, order) => {
    return [...items].sort((a, b) => { 
        let valA = a[crit], valB = b[crit]

        if (crit === "size" || crit === "calculatedSize") {
            valA = parseFloat(valA) || 0
            valB = parseFloat(valB) || 0
        } else {
            valA = (valA || "").toString().toLowerCase()
            valB = (valB || "").toString().toLowerCase()
        }

        if (valA < valB) return order === "asc" ? -1 : 1
        if (valA > valB) return order === "asc" ? 1 : -1
        return 0
    })
}

export default function SharedFiles() {
    const key = import.meta.env.VITE_HOST_ADDRESS

    useTitle("Shared files")

    const { user } = useContext(UserContext)
    const { files, setFiles, folders, setFolders, isLoading, refreshFiles, searchQuery, setSearchQuery } = useContext(FileContext)

    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const location = useLocation()
    const currentPathStr = searchParams.get("dir") || ""
    const currentPath = currentPathStr ? currentPathStr.split("/") : []

    const currentFolderObj = (folders || []).find(f => f.path === currentPathStr)
    const currentFolderID = currentFolderObj ? currentFolderObj.folder_id : ""

    const [showPathMenu, setShowPathMenu] = useState(false)
    const pathMenuRef = useRef(null)
    
    const [appliedFilters, setAppliedFilters] = useState({})
    const [sortFilter, setSortFilter] = useState({crit: "name", order: "asc"})
    
    const handleFilterChange = (filters) => { 
        setAppliedFilters(filters) 
    }

    const handleSortChange = (sort) => {
        setSortFilter(sort)
    }

    const calculateFolderSize = (folderPath, allFiles) => {
        if (!allFiles || allFiles.length === 0) return 0

        return allFiles
            .filter(file => file.creator_username !== user.username && file.path.startsWith(folderPath + "/"))
            .reduce((accumulator, file) => accumulator + (parseFloat(file.size) || 0), 0)
    }

    const [openFile, setOpenFile] = useState(null)
    const [viewerSize, setViewerSize] = useState(() => isMobile() == 0 ? "small" : "full")
    const isViewerSmall = openFile !== null && viewerSize === "small"

    const { processedFolders, processedFiles } = useMemo(() => {
        const safeFiles = files || [], safeFolders = folders || []

        let filteredFolders = safeFolders
            .map(folder => ({
                ...folder,
                calculatedSize: calculateFolderSize(folder.path, safeFiles)
            }))
            .filter(folder => {
                if (folder.creator_username === user.username) return false
                if (getParentPath(folder.path) !== currentPathStr) return false
                if (appliedFilters.extensionFilter && appliedFilters.extensionFilter !== "Folder") return false
                if (searchQuery && !folder.name.toLowerCase().includes(searchQuery.toLowerCase())) return false
                
                const folderMB = folder.calculatedSize / 1048576.0
                if (appliedFilters.sizeFilterLowerBound && folderMB < parseFloat(appliedFilters.sizeFilterLowerBound)) return false
                if (appliedFilters.sizeFilterUpperBound && folderMB > parseFloat(appliedFilters.sizeFilterUpperBound)) return false
                if (appliedFilters.dateFilterLowerBound && folder.created < appliedFilters.dateFilterLowerBound) return false
                if (appliedFilters.dateFilterUpperBound && folder.created > appliedFilters.dateFilterUpperBound + "T23:59:59") return false
                if (appliedFilters.sentBy && (!folder.sentBy || !folder.sentBy.toLowerCase().includes(appliedFilters.sentBy.toLowerCase()))) return false
                return true
            })

        let filteredFiles = safeFiles.filter(file => {
            if (file.creator_username === user.username) return false
            if (getParentPath(file.path) !== currentPathStr) return false
            if (appliedFilters.extensionFilter && file.extension !== appliedFilters.extensionFilter) return false
            if (searchQuery && !file.name.toLowerCase().includes(searchQuery.toLowerCase())) return false
            
            const fileMB = (parseFloat(file.size) || 0) / 1048576.0
            if (appliedFilters.sizeFilterLowerBound && fileMB < parseFloat(appliedFilters.sizeFilterLowerBound)) return false
            if (appliedFilters.sizeFilterUpperBound && fileMB > parseFloat(appliedFilters.sizeFilterUpperBound)) return false
            if (appliedFilters.dateFilterLowerBound && file.created < appliedFilters.dateFilterLowerBound) return false
            if (appliedFilters.dateFilterUpperBound && file.created > appliedFilters.dateFilterUpperBound + "T23:59:59") return false
            if (appliedFilters.sentBy && (!file.sentBy || !file.sentBy.toLowerCase().includes(appliedFilters.sentBy.toLowerCase()))) return false
            return true
        })

        const folderSortCrit = sortFilter.crit === "size" ? "calculatedSize" : sortFilter.crit
        
        filteredFolders = sortItems(filteredFolders, folderSortCrit, sortFilter.order)
        filteredFiles = sortItems(filteredFiles, sortFilter.crit, sortFilter.order)

        return { processedFolders: filteredFolders, processedFiles: filteredFiles }
    }, [files, folders, currentPathStr, appliedFilters, searchQuery, sortFilter, user])

    const { sizeByTypes, totalFileSize } = useMemo(() => {
        const sizes = {}
        let total = 0 

        if (!processedFiles || processedFiles.length === 0) 
            return { sizeByTypes: [], totalFileSize: 0 } 

        processedFiles.forEach(file => {
            const fileSizeNum = parseFloat(file.size) || 0, fileSizeMB = fileSizeNum / 1048576.0 

            const ext = file.extension ? file.extension.charAt(0).toUpperCase() + file.extension.slice(1).toLowerCase() : "Unknown"

            sizes[ext] = (sizes[ext] || 0) + fileSizeMB
            total += fileSizeMB 
        })

        const sortedTypes = Object.entries(sizes)
            .map(([extension, size]) => ({ extension, size }))
            .sort((a, b) => b.size - a.size)

        return {
            sizeByTypes: sortedTypes,
            totalFileSize: total
        }
    }, [processedFiles])

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (pathMenuRef.current && !pathMenuRef.current.contains(event.target)) 
                setShowPathMenu(false)
        }

        if (showPathMenu) {
            document.addEventListener("mousedown", handleClickOutside)
            document.addEventListener("touchstart", handleClickOutside)
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
            document.removeEventListener("touchstart", handleClickOutside)
        }
    }, [showPathMenu])

    const handlePathAction = async (action) => {
        if (!currentFolderObj) return
        setShowPathMenu(false)

        const targetId = currentFolderObj.folder_id || currentFolderObj.id

        switch (action) {
            case "download": {
                const targetObj = openFile || currentFolderObj
                const isTargetFolder = isFolder || openFile?.extension === "folder" || (openFile && 'folder_id' in openFile)

                const endpoint = isTargetFolder ? "get_folder" : "get_file"
                const param = isTargetFolder ? `folder_id=${targetId}` : `file_id=${targetId}`

                try {
                    const response = await customFetch(`http://${key}:18080/${endpoint}?${param}`, {
                        method: "GET",
                        credentials: "include",
                        headers: { 'Content-Type': 'application/json' },
                    })

                    if (!response.ok) throw new Error("Download failed")

                    let buffer = await response.arrayBuffer()
                    let downloadBytes = buffer

                    if (!isTargetFolder && targetObj) {
                        const privateKey = await loadCachedPrivateKey()
                        if (!privateKey) throw new Error("Private key not found.")
                        if (!targetObj.fek) throw new Error("No FEK available for file.")
                        if (!user?.public_key) throw new Error("Missing user public key.")

                        const fek = await decryptFekForUser(targetObj.fek, user.public_key, privateKey)
                        const encryptedBytes = new Uint8Array(buffer)
                        downloadBytes = await decryptFile(encryptedBytes, fek)
                    }

                    const url = URL.createObjectURL(new Blob([downloadBytes], { type: 'application/octet-stream' }))
                    const a = document.createElement('a')
                    a.href = url
                    a.download = isTargetFolder 
                        ? `${openFile?.name || currentFolderObj?.name || "folder"}.zip` 
                        : (targetObj?.name || "file")
                    
                    document.body.appendChild(a)
                    a.click()

                    document.body.removeChild(a)
                    URL.revokeObjectURL(url)
                } catch (err) {
                    console.error("Download error:", err)
                    alert(`Download error: ${err.message}`)
                }
                break
            }
            case "delete": {
                const response = await customFetch(`http://${key}:18080/delete_file?${targetId}`, {
                    method: "DELETE",
                    headers: { 'Content-Type': 'application/json' },
                })
                if (response.ok) {
                    if (setFolders) 
                        setFolders(prev => prev.filter(f => (f.folder_id || f.id) !== targetId))
                    
                    const parentPath = getParentPath(currentPathStr)
                    navigate(`${location.pathname}${parentPath ? `?dir=${encodeURIComponent(parentPath)}` : ""}`)
                }
                break
            }
            case "favorites": {
                const currentFav = currentFolderObj.favourite
                const newFavStatus = currentFav ? 0 : 1
                
                if (setFolders) 
                    setFolders(prev => prev.map(f => (f.folder_id || f.id) === targetId ? { ...f, favourite: newFavStatus } : f))
                
                try {
                    const response = await customFetch(`http://${key}:18080/change_data/file/${targetId}`, {
                        method: "PATCH",
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ favourite: newFavStatus })
                    })
                    
                    if (!response.ok) throw new Error("Update failed")
                } catch (error) {
                    if (setFolders) 
                        setFolders(prev => prev.map(f => (f.folder_id || f.id) === targetId ? { ...f, favourite: currentFav } : f))
                }
                break
            }
            default: break
        }
    }

    const handleFileAction = async (action) => {
        if (!openFile) return
        setShowPathMenu(false)

        const targetId = openFile.file_id || openFile.id
        const isFolder = 'folder_id' in openFile || openFile.extension === "Folder"
    
        switch (action) {
            case "download": {
                try {
                    const response = await customFetch(`http://${key}:18080/get_file?file_id=${targetId}`, {
                        method: "GET",
                        headers: { 'Content-Type': 'application/json' },
                    })

                    if (!response.ok) throw new Error("Download failed")

                    let buffer = await response.arrayBuffer()
                    let downloadBytes = buffer

                    if (openFile?.fek) {
                        const privateKey = await loadCachedPrivateKey()
                        if (!privateKey) throw new Error("Private key not found.")
                        if (!user?.public_key) throw new Error("Missing user public key.")

                        const fek = await decryptFekForUser(openFile.fek, user.public_key, privateKey)
                        const encryptedBytes = new Uint8Array(buffer)
                        downloadBytes = await decryptFile(encryptedBytes, fek)
                    }

                    const url = URL.createObjectURL(new Blob([downloadBytes], { type: 'application/octet-stream' }))
                    const a = document.createElement('a')

                    a.href = url
                    a.download = openFile.name
                    document.body.appendChild(a)
                    a.click()

                    document.body.removeChild(a)
                    URL.revokeObjectURL(url)
                } catch (err) {
                    console.error("Download error:", err)
                    alert(`Download error: ${err.message}`)
                }
                break
            }
            case "delete": {
                const response = await customFetch(`http://${key}:18080/delete_file?${openFile.file_id || openFile.id}`, {
                    method: "DELETE",
                    headers: { 'Content-Type': 'application/json' },
                })
                if (response.ok) {
                    setOpenFile(null) 
                    
                    if (isFolder && setFolders) 
                        setFolders(prev => prev.filter(f => (f.folder_id || f.id) !== targetId))
                    else if (setFiles) 
                        setFiles(prev => prev.filter(f => (f.file_id || f.id) !== targetId))
                }
                break
            }
            case "favorites": {
                const currentFav = openFile.favourite
                const newFavStatus = currentFav ? 0 : 1
                
                setOpenFile(prev => ({ ...prev, favourite: newFavStatus }))
                
                if (isFolder && setFolders) 
                    setFolders(prev => prev.map(f => (f.folder_id || f.id) === targetId ? { ...f, favourite: newFavStatus } : f))
                else if (setFiles) 
                    setFiles(prev => prev.map(f => (f.file_id || f.id) === targetId ? { ...f, favourite: newFavStatus } : f))
                
                try {
                    const response = await customFetch(`http://${key}:18080/change_data/file/${targetId}`, {
                        method: "PATCH",
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ favourite: newFavStatus })
                    })
                    
                    if (!response.ok) throw new Error("Update failed")
                } catch (error) {
                    setOpenFile(prev => ({ ...prev, favourite: currentFav }))
                    
                    if (isFolder && setFolders) 
                        setFolders(prev => prev.map(f => (f.folder_id || f.id) === targetId ? { ...f, favourite: currentFav } : f))
                     else if (setFiles) 
                        setFiles(prev => prev.map(f => (f.file_id || f.id) === targetId ? { ...f, favourite: currentFav } : f))
                }
                break
            }
            default: break
        }
    }

    const renderPathMenu = () => {
        if (!showPathMenu) return null

        if (currentPathStr) return (
            <div id="pathDropdownMenu">
                <div className="pathMenuOption" onClick={() => handlePathAction("download")}>
                    <Download />
                    <h5>Download</h5>
                </div>
                <hr />
                <div className="pathMenuOption" onClick={() => handlePathAction("rename")}>
                    <Rename />
                    <h5>Rename</h5>
                </div>
                <div className="pathMenuOption" onClick={() => handlePathAction("color")}>
                    <ChangeColor />
                    <h5>Change color</h5>
                </div>
                <hr />
                <div className="pathMenuOption" onClick={() => handlePathAction("delete")}>
                    <Trash />
                    <h5>Delete</h5>
                </div>
                <div className="pathMenuOption" onClick={() => handlePathAction("favorites")}>
                    <StarFull style={{ color: currentFolderObj?.favourite ? "var(--hoverCol)" : "var(--text)" }} />
                    <h5>{currentFolderObj?.favourite ? "Remove from favorites" : "Add to Favorites"}</h5>
                </div>
                <hr />
                <div className="pathMenuOption" onClick={() => handlePathAction("access")}>
                    <Group />
                    <h5>Manage Access</h5>
                </div>
            </div>
        )
    }

    const renderFilePathMenu = () => {
        if (!showPathMenu || !openFile) return null
    
        return (
            <div id="pathDropdownMenu">
                <div className="pathMenuOption" onClick={() => handleFileAction("download")}>
                    <Download />
                    <h5>Download</h5>
                </div>
                <hr />
                <div className="pathMenuOption" onClick={() => handleFileAction("delete")}>
                    <Trash />
                    <h5>Delete</h5>
                </div>
                <div className="pathMenuOption" onClick={() => handleFileAction("favorites")}>
                    <StarFull style={{ color: openFile.favourite ? "var(--hoverCol)" : "var(--text)" }} />
                    <h5>{openFile.favourite ? "Remove from favorites" : "Add to Favorites"}</h5>
                </div>
                <hr />
                <div className="pathMenuOption" onClick={() => handleFileAction("access")}>
                    <Group />
                    <h5>Manage Access</h5>
                </div>
            </div>
        )
    }

    return (
        <div className="page">
            <AddFile 
                currentPath={currentPathStr} 
                parentFolderID={currentFolderID}
                onUploadSuccess={refreshFiles}
            />
            
            <Filters 
                onFilterChange={handleFilterChange} 
                onSortChange={handleSortChange} 
            />

            <div id="currentPathDisplay">
                {currentPath.length === 0 && !openFile ? (
                    <div style={{ position: "relative", display: "inline-block" }} ref={pathMenuRef}>
                        <a onClick={() => setShowPathMenu(prev => !prev)} 
                            style={{ display: "flex", alignItems: "center", gap: "5px", cursor: "pointer" }}>
                            Shared files
                            {currentPathStr && <ArrowDown id="arrowDown"/>}
                        </a>
                        {renderPathMenu()}
                    </div>
                ) : (
                    <Link to="/shared" onClick={() => { setSearchQuery(""); setOpenFile(null); }}>Shared files</Link>
                )}

                {currentPath.map((folderName, index) => {
                    const isLast = index === currentPath.length - 1 && !openFile
                    const breadcrumbPath = currentPath.slice(0, index + 1).join("/")

                    return (
                        <span key={index} style={{ display: "contents" }}>
                            <ArrowRight id="arrowRight"/>
                            {isLast ? (
                                <div style={{ position: "relative", display: "inline-block" }} ref={pathMenuRef}>
                                    <a onClick={() => {
                                        setShowPathMenu(prev => !prev)
                                        setSearchQuery("")
                                    }}
                                        style={{ display: "flex", alignItems: "center", gap: "5px", cursor: "pointer" }}
                                    >
                                        {folderName}
                                        <ArrowDown id="arrowDown"/>
                                    </a>
                                    {renderPathMenu()}
                                </div>
                            ) : (
                                <Link to={`${location.pathname}?dir=${encodeURIComponent(breadcrumbPath)}`}
                                    onClick={() => { setSearchQuery(""); setOpenFile(null); }} 
                                >
                                    {folderName}
                                </Link>
                            )}
                        </span>
                    )
                })}

                {openFile && (
                    <span style={{ display: "contents" }}>
                        <ArrowRight id="arrowRight"/>
                        <div style={{ position: "relative", display: "inline-block" }} ref={pathMenuRef}>
                            <a onClick={() => setShowPathMenu(prev => !prev)}
                                style={{ display: "flex", alignItems: "center", gap: "5px", cursor: "pointer", fontWeight: "600" }}
                            >
                                {openFile.name}
                                <ArrowDown id="arrowDown"/>
                            </a>
                            {renderFilePathMenu()}
                        </div>
                    </span>
                )}
            </div>

            <div className="fileSizeChart">
                {totalFileSize > 0 && sizeByTypes.map((entry) => (
                    <div 
                        key={entry.extension}
                        className="chartBar" 
                        style={{
                            backgroundColor: getFileColor(entry.extension), 
                            width: `${(entry.size / totalFileSize) * 100}%`
                        }}
                    />
                ))}
            </div>

            <div className="fileExtensionChart">
                {totalFileSize > 0 && sizeByTypes.map((entry) => (
                    <div key={entry.extension} className="chartItem" >
                        <div id="square" style={{backgroundColor: getFileColor(entry.extension)}}></div>
                        <h5>{entry.extension}</h5>
                    </div>
                ))}
            </div>

            {openFile !== null && (
                <FileViewer 
                    file={openFile} 
                    onExit={() => { setOpenFile(null); setViewerSize(isMobile() == 0 ? "small" : "full"); }} 
                    viewerSize={viewerSize}
                    setViewerSize={setViewerSize}
                />
            )}

            <div className={`fileContainer ${isViewerSmall ? "viewer-open-small" : ""}`}
                style={{width: isViewerSmall ? "75%" : "100%"}}>
                <div className="fileTableHeader">
                    <div style={{color: sortFilter.crit === "name" ? "var(--hoverCol)" : "var(--text)"}}
                        onClick={() => setSortFilter({crit: "name", order: sortFilter.order === "asc" ? "desc" : "asc"})}
                    >
                        {sortFilter.crit === "name" && <ArrowUp style={{ 
                            transform: sortFilter.order === "asc" ? "rotate(0deg)" : "rotate(180deg)",
                            transition: "transform 0.2s ease"
                        }}/>}
                        Name
                    </div>

                    {!isViewerSmall && <div style={{color: sortFilter.crit === "extension" ? "var(--hoverCol)" : "var(--text)"}}
                        onClick={() => setSortFilter({crit: "extension", order: sortFilter.order === "asc" ? "desc" : "asc"})}>
                        {sortFilter.crit === "extension" && <ArrowUp style={{ 
                            transform: sortFilter.order === "asc" ? "rotate(0deg)" : "rotate(180deg)",
                            transition: "transform 0.2s ease"
                        }}/>}
                        Type
                    </div>}

                    <div style={{color: sortFilter.crit === "size" ? "var(--hoverCol)" : "var(--text)"}}
                        onClick={() => setSortFilter({crit: "size", order: sortFilter.order === "asc" ? "desc" : "asc"})}>
                        {sortFilter.crit === "size" && <ArrowUp style={{ 
                            transform: sortFilter.order === "asc" ? "rotate(0deg)" : "rotate(180deg)",
                            transition: "transform 0.2s ease"
                        }}/>}
                        Size
                    </div>
                    <div style={{color: sortFilter.crit === "created" ? "var(--hoverCol)" : "var(--text)"}}
                        onClick={() => setSortFilter({crit: "created", order: sortFilter.order === "asc" ? "desc" : "asc"})}>
                        {sortFilter.crit === "created" && <ArrowUp style={{ 
                            transform: sortFilter.order === "asc" ? "rotate(0deg)" : "rotate(180deg)",
                            transition: "transform 0.2s ease"
                        }}/>}
                        Created
                    </div>

                    <div style={{color: sortFilter.crit === "modified" ? "var(--hoverCol)" : "var(--text)"}}
                        onClick={() => setSortFilter({crit: "modified", order: sortFilter.order === "asc" ? "desc" : "asc"})}>
                        {sortFilter.crit === "modified" && <ArrowUp style={{ 
                            transform: sortFilter.order === "asc" ? "rotate(0deg)" : "rotate(180deg)",
                            transition: "transform 0.2s ease"
                        }}/>}
                        Last modified
                    </div>

                    <div style={{color: sortFilter.crit === "creator_username" ? "var(--hoverCol)" : "var(--text)"}}
                        onClick={() => setSortFilter({crit: "creator_username", order: sortFilter.order === "asc" ? "desc" : "asc"})}>
                        {sortFilter.crit === "creator_username" && <ArrowUp style={{ 
                            transform: sortFilter.order === "asc" ? "rotate(0deg)" : "rotate(180deg)",
                            transition: "transform 0.2s ease"
                        }}/>}
                        Owner
                    </div>
                </div>
                
                <hr className="fileTableDivider"/>

                <div className="fileList">
                    {isLoading ? (
                        <div>Loading...</div>
                    ) : processedFolders.length === 0 && processedFiles.length === 0 ? (
                        <h2 id="emptyMessage">No files to show</h2>
                    ) : (
                        <>
                            {processedFolders.map(folder => {
                                const nextPath = currentPathStr ? `${currentPathStr}/${folder.name}` : folder.name
                                const pathForLink = `${location.pathname}?dir=${encodeURIComponent(nextPath)}`                                
                                
                                return (
                                    <div 
                                        key={`folder-${folder.path}`} 
                                        onClick={() => {setSearchQuery(""); navigate(pathForLink);}}
                                        style={{ display: "contents", textDecoration: "none", color: "inherit", cursor: "pointer" }}
                                    >
                                        <File 
                                            path={folder.path}
                                            id={folder.folder_id}
                                            name={folder.name} 
                                            extension="Folder" 
                                            color={folder.color}
                                            size={folder.calculatedSize} 
                                            favourite={folder.favourite}
                                            created={!isLoading && formatDate(folder.created)}
                                            lastModified={!isLoading && formatDate(folder.modified)}
                                            owner={folder.creator_username}
                                            collaborators={folder.collaborators}
                                        />
                                    </div>
                                )
                            })}
                            
                            {processedFiles.map(file => (
                                <File 
                                    path={file.path}
                                    id={file.file_id} 
                                    key={`file-${file.path}`}
                                    name={file.name} 
                                    extension={file.extension ? file.extension.charAt(0).toUpperCase() + file.extension.slice(1) : ""} 
                                    size={file.size}
                                    favourite={file.favourite}
                                    created={!isLoading && formatDate(file.created)}
                                    lastModified={!isLoading && formatDate(file.modified)}
                                    onFileClick = {() => setOpenFile(file)}
                                    hideType={isViewerSmall}
                                    owner={file.creator_username}
                                    collaborators={file.collaborators}
                                />
                            ))}
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}