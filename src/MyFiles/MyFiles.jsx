import { useState, useEffect, useRef, useContext, useMemo } from "react"
import { Link, useSearchParams, useNavigate } from 'react-router-dom' 

import { useTitle } from "../UseTitle.js"
import { FileContext } from "../GetFiles.jsx"
import { getFileColor } from "./FileColors.js"
import isMobile from "../IsMobile.js"

import AddFile from "./AddFile.jsx"
import Filters from "./Filters.jsx"
import File from "./File.jsx"
import FileViewer from "../FileViewer/FileViewer.jsx"

import ArrowRight from "../assets/SVG/ArrowRight.svg?react"
import ArrowDown from "../assets/SVG/ArrowDown.svg?react"
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

const calculateFolderSize = (folderPath, allFiles) => {
    if (!allFiles || allFiles.length === 0) return 0

    return allFiles
        .filter(file => file.inTrash == 0 && file.path.startsWith(folderPath + "/"))
        .reduce((accumulator, file) => accumulator + (parseFloat(file.size) || 0), 0)
}

const formatDate = (dateString) => {
    if (dateString) dateString = dateString.slice(0, dateString.length - 7)
    const d = new Date(dateString)
    
    return d.toLocaleDateString("en-UK", { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
    })
}

export default function MyFiles() {
    useTitle("OffGrid - Private file transfer")

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
    const handleFilterChange = (filters) => { 
        setAppliedFilters(filters) 
    }

    const [openFile, setOpenFile] = useState(null)
    const [viewerSize, setViewerSize] = useState(isMobile() == 0 ? "small" : "full")
    const isViewerSmall = openFile !== null && viewerSize === "small"

    const { sizeByTypes, totalFileSize } = useMemo(() => {
        const sizes = {}
        let total = 0 

        if (!files || files.length === 0) {
            return { sizeByTypes: [], totalFileSize: 0 }
        }

        files.forEach(file => {
            if (file.inTrash == 1) return 

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

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (pathMenuRef.current && !pathMenuRef.current.contains(event.target)) {
                setShowPathMenu(false)
            }
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

    const visibleFolders = (folders || []).filter(folder => {
        if (folder.inTrash == 1 || getParentPath(folder.path) !== currentPathStr) return false

        if (appliedFilters.extensionFilter && appliedFilters.extensionFilter != "Folder") return false
        
        if (searchQuery && !folder.name.toLowerCase().includes(searchQuery.toLowerCase())) return false
        
        if (appliedFilters.sizeFilterLowerBound && folder.size < parseFloat(appliedFilters.sizeFilterLowerBound)) return false
        if (appliedFilters.sizeFilterUpperBound && folder.size > parseFloat(appliedFilters.sizeFilterUpperBound)) return false
        if (appliedFilters.dateFilterLowerBound && folder.created < appliedFilters.dateFilterLowerBound) return false
        if (appliedFilters.dateFilterUpperBound && folder.created > appliedFilters.dateFilterUpperBound + "T23:59:59") return false
        if (appliedFilters.sentBy && (!folder.sentBy || !folder.sentBy.toLowerCase().includes(appliedFilters.sentBy.toLowerCase()))) return false

        return true
    })
    const visibleFiles = (files || []).filter(file => {
        if (file.inTrash == 1 || getParentPath(file.path) !== currentPathStr) return false

        if (appliedFilters.extensionFilter && file.extension !== appliedFilters.extensionFilter) return false

        if (searchQuery && !file.name.toLowerCase().includes(searchQuery.toLowerCase())) return false
        
        const fileMB = file.size / 1048576.0
        if (appliedFilters.sizeFilterLowerBound && fileMB < parseFloat(appliedFilters.sizeFilterLowerBound)) return false
        if (appliedFilters.sizeFilterUpperBound && fileMB > parseFloat(appliedFilters.sizeFilterUpperBound)) return false
        if (appliedFilters.dateFilterLowerBound && file.created < appliedFilters.dateFilterLowerBound) return false
        if (appliedFilters.dateFilterUpperBound && file.created > appliedFilters.dateFilterUpperBound + "T23:59:59") return false
        if (appliedFilters.sentBy && (!file.sentBy || !file.sentBy.toLowerCase().includes(appliedFilters.sentBy.toLowerCase()))) return false

        return true
    })

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

    return (
        <div className="page">
            <AddFile 
                currentPath={currentPathStr} 
                parentFolderID={currentFolderID}
                onUploadSuccess={refreshFiles}
            />
            <Filters onFilterChange = {handleFilterChange}/>

            <div id="currentPathDisplay">
                {currentPath.length === 0 ? (
                    <div style={{ position: "relative", display: "inline-block" }} ref={pathMenuRef}>
                        <a onClick={() => setShowPathMenu(prev => !prev)} 
                            style={{ display: "flex", alignItems: "center", gap: "5px", cursor: "pointer" }}>
                            My files
                            {currentPathStr && <ArrowDown id="arrowDown"/>}
                        </a>
                        {renderPathMenu()}
                    </div>
                ) : (
                    <Link to="/" onClick={() => setSearchQuery("")}>My files</Link>
                )}

                {currentPath.map((folderName, index) => {
                    const isLast = index === currentPath.length - 1
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
                                    onClick={() => setSearchQuery("")} 
                                >
                                    {folderName}
                                </Link>
                            )}
                        </span>
                    )
                })}
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
                    <div>Name</div>
                    {!isViewerSmall && <div>Type</div>}
                    <div>Size</div>
                    <div>Created</div>
                    <div>Last modified</div>
                </div>
                
                <hr className="fileTableDivider"/>

                <div className="fileList">
                    {isLoading ? (
                        <div>Loading...</div>
                    ) : visibleFolders.length === 0 && visibleFiles.length === 0 ? (
                        <h2 id="emptyMessage">No files to show</h2>
                    ) : (
                        <>
                            {visibleFolders.map(folder => {
                                const calculatedSize = calculateFolderSize(folder.path, files)
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
                                            size={calculatedSize} 
                                            favourite={folder.favourite}
                                            created={!isLoading && formatDate(folder.created)}
                                            lastModified={!isLoading && formatDate(folder.modified)}
                                        />
                                    </div>
                                )
                            })}
                            
                            {visibleFiles.map(file => (
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