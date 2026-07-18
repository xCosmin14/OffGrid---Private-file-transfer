import { useState, useEffect, useRef, useContext } from "react"
import { Link, useSearchParams } from 'react-router-dom' 

import { useTitle } from "../UseTitle.js"
import { FileContext } from "../GetFiles.jsx"

import AddFile from "./AddFile.jsx"
import Filters from "./Filters.jsx"
import File from "./File.jsx"

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

    const totalSize = allFiles
        .filter(file => file.inTrash == 0 && file.path.startsWith(folderPath + "/"))
        .reduce((accumulator, file) => {
            const fileSizeNum = parseFloat(file.size) || 0
            return accumulator + fileSizeNum
        }, 0)

    return totalSize > 0 ? totalSize.toFixed(2) : 0
}

const formatDate = (dateString) => {
    if (dateString) dateString = dateString.slice(0, dateString.length - 7)
    const d = new Date(dateString)
    
    return d.toLocaleDateString("ro-RO", { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
    })
}

export default function MyFiles() {
    useTitle("OffGrid - Private file transfer")

    const { files, folders, isLoading, refreshFiles } = useContext(FileContext)

    const [searchParams] = useSearchParams()
    const currentPathStr = searchParams.get("dir") || ""
    const currentPath = currentPathStr ? currentPathStr.split("/") : []

    const [showPathMenu, setShowPathMenu] = useState(false)
    const pathMenuRef = useRef(null)
    
    const [appliedFilters, setAppliedFilters] = useState({})
    const handleFilterChange = (filters) => { setAppliedFilters(filters) }

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

    const handlePathAction = (action) => {
        console.log(`Action trigged: ${action}`)
    }

    const visibleFolders = (folders || []).filter(
        folder => folder.inTrash == 0 && getParentPath(folder.path) === currentPathStr
    )
    const visibleFiles = (files || []).filter(
        file => file.inTrash == 0 && getParentPath(file.path) === currentPathStr
    )

    const renderPathMenu = () => {
        if (!showPathMenu) return null
        return (
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
                onUploadSuccess={refreshFiles}
            />
            <Filters />

            <div id="currentPathDisplay">
                {currentPath.length === 0 ? (
                    <div style={{ position: "relative", display: "inline-block" }} ref={pathMenuRef}>
                        <Link onClick={() => setShowPathMenu(prev => !prev)} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                            My files
                            <ArrowDown id="arrowDown"/>
                        </Link>
                        {renderPathMenu()}
                    </div>
                ) : (
                    <Link to="/">My files</Link>
                )}

                {currentPath.map((folderName, index) => {
                    const isLast = index === currentPath.length - 1
                    const breadcrumbPath = currentPath.slice(0, index + 1).join("/")

                    return (
                        <span key={index} style={{ display: "contents" }}>
                            <ArrowRight id="arrowRight"/>
                            {isLast ? (
                                <div style={{ position: "relative", display: "inline-block" }} ref={pathMenuRef}>
                                    <Link onClick={() => setShowPathMenu(prev => !prev)} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                                        {folderName}
                                        <ArrowDown id="arrowDown"/>
                                    </Link>
                                    {renderPathMenu()}
                                </div>
                            ) : (
                                <Link to={`/?dir=${encodeURIComponent(breadcrumbPath)}`}>
                                    {folderName}
                                </Link>
                            )}
                        </span>
                    )
                })}
            </div>

            <div className="fileSizeChart"></div>

            <div className="fileContainer">
                <div className="fileTableHeader">
                    <div>Name</div>
                    <div>Type</div>
                    <div>Size</div>
                    <div>Created</div>
                    <div>Last modified</div>
                </div>
                
                <hr className="fileTableDivider"/>

                <div className="fileList">
                    {isLoading ? (
                        <div>Loading...</div>
                    ) : visibleFolders.length === 0 && visibleFiles.length === 0 ? (
                        <h2 id="emptyMessage">You have no files here</h2>
                    ) : (
                        <>
                            {visibleFolders.map(folder => {
                                const calculatedSize = calculateFolderSize(folder.path, files)
                                
                                const nextPath = currentPathStr ? `${currentPathStr}/${folder.name}` : folder.name
                                const pathForLink = `/?dir=${encodeURIComponent(nextPath)}`
                                
                                return (
                                    <Link 
                                        to={pathForLink}
                                        key={`folder-${folder.path}`} 
                                        style={{ display: "contents", textDecoration: "none", color: "inherit", cursor: "pointer" }}
                                    >
                                        <File 
                                            name={folder.name} 
                                            extension="folder" 
                                            size={calculatedSize} 
                                            created={!isLoading && formatDate(folder.created)}
                                            lastModified={!isLoading && formatDate(folder.modified)}
                                        />
                                    </Link>
                                )
                            })}

                            {visibleFiles.map(file => (
                                <File 
                                    id={file.file_id} 
                                    key={`file-${file.path}`}
                                    name={file.name} 
                                    extension={file.extension ? file.extension.charAt(0).toUpperCase() + file.extension.slice(1) : ""} 
                                    size={file.size}
                                    created={!isLoading && formatDate(file.created)}
                                    lastModified={!isLoading && formatDate(file.modified)}
                                />
                            ))}
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}