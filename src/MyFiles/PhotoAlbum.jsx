import { useState, useEffect, useRef, useContext, useMemo } from "react"
import { Link, useSearchParams, useNavigate } from 'react-router-dom' 

import { useTitle } from "../UseTitle.js"
import { FileContext } from "../GetFiles.jsx"
import { viewerComponentsMap, getFileColor } from "./FileColors.js"
import isMobile from "../IsMobile.js"
import { customFetch } from "../UserContext.jsx"

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

import "../MyFiles/MyFiles.css"

const getParentPath = (fullPath) => {
    if (!fullPath) return ""
    const lastSlash = fullPath.lastIndexOf("/")
    return lastSlash === -1 ? "" : fullPath.substring(0, lastSlash)
}

const calculateFolderSize = (folderPath, allFiles) => {
    if (!allFiles || allFiles.length === 0) return 0

    return allFiles
        .filter(file => (viewerComponentsMap[file.extension] == "PhotoViewer" || 
                viewerComponentsMap[file.extension] == "VideoPlayer") 
                && file.path.startsWith(folderPath + "/"))
        .reduce((accumulator, file) => accumulator + (parseFloat(file.size) || 0), 0)
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

export default function PhotoAlbum() {
    useTitle("Photo album")

    const { files, folders, isLoading, refreshFiles, searchQuery, setSearchQuery } = useContext(FileContext)

    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
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

    const [openFile, setOpenFile] = useState(null)
    const [viewerSize, setViewerSize] = useState(isMobile() == 0 ? "small" : "full")
    const isViewerSmall = openFile !== null && viewerSize === "small"

    const { sizeByTypes, totalFileSize } = useMemo(() => {
        const sizes = {}
        let total = 0 

        if (!files || files.length === 0) 
            return { sizeByTypes: [], totalFileSize: 0 } 

        files.forEach(file => {
            if (viewerComponentsMap[file.extension] != "PhotoViewer" && 
                viewerComponentsMap[file.extension] != "VideoPlayer") 
                return

            const fileSizeNum = parseFloat(file.size) || 0
            const fileSizeMB = fileSizeNum / 1048576.0 

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
    }, [files])

    const { processedFolders, processedFiles } = useMemo(() => {
        const safeFiles = files || [], safeFolders = folders || []

        let filteredFolders = safeFolders
            .map(folder => ({
                ...folder,
                calculatedSize: calculateFolderSize(folder.path, safeFiles)
            }))
            .filter(folder => {
                if (getParentPath(folder.path) !== currentPathStr) return false

                const hasRelevantFiles = safeFiles.some(file => 
                    (viewerComponentsMap[file.extension] === "PhotoViewer" || 
                     viewerComponentsMap[file.extension] === "VideoPlayer") && 
                    file.path.startsWith(folder.path + "/")
                )
                if (!hasRelevantFiles) return false

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
            if (viewerComponentsMap[file.extension] != "PhotoViewer" && 
                viewerComponentsMap[file.extension] != "VideoPlayer") 
                return false
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
    }, [files, folders, currentPathStr, appliedFilters, searchQuery, sortFilter])

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

    const handlePathAction = (action) => {
        setShowPathMenu(false)
    }

    const handleFileAction = async (action) => {
        if (!openFile) return
        setShowPathMenu(false)
    
        switch (action) {
            case "download": {
                const response = await customFetch(`http://localhost:18080/get_file?file_id=${openFile.file_id || openFile.id}`, {
                    method: "GET",
                    headers: { 'Content-Type': 'application/json' },
                })

                let buffer = await response.arrayBuffer()
                const url = URL.createObjectURL(new Blob([buffer], { type: 'application/octet-stream' }))
                const a = document.createElement('a')

                a.href = url
                a.download = openFile.name
                document.body.appendChild(a)
                a.click()

                document.body.removeChild(a)
                URL.revokeObjectURL(url)
                break
            }
            case "delete": {
                const response = await customFetch(`http://localhost:18080/delete_file?${openFile.file_id || openFile.id}`, {
                    method: "DELETE",
                    headers: { 'Content-Type': 'application/json' },
                })
                if (response.ok) {
                    setOpenFile(null) 
                    await refreshFiles()
                }
                break
            }
            case "favorites": {
                const response = await customFetch(`http://localhost:18080/change_data/file/${openFile.file_id || openFile.id}`, {
                    method: "PATCH",
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ favourite: openFile.favourite ? 0 : 1 })
                })
                if (response.ok) {
                    setOpenFile(prev => ({ ...prev, favourite: prev.favourite ? 0 : 1 }))
                    await refreshFiles()
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
                    <StarFull />
                    <h5>Add to Favorites</h5>
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
                            Documents
                            {currentPathStr && <ArrowDown id="arrowDown"/>}
                        </a>
                        {renderPathMenu()}
                    </div>
                ) : (
                    <Link to="/documents" onClick={() => { setSearchQuery(""); setOpenFile(null); }}>Documents</Link>
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
                                <Link to={`/?dir=${encodeURIComponent(breadcrumbPath)}`}
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
                                const pathForLink = `/?dir=${encodeURIComponent(nextPath)}`
                                
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
                                />
                            ))}
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}