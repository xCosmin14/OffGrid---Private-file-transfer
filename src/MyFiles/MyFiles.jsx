import { useState, useEffect, useRef } from "react"
import {Link} from 'react-router-dom'
import { useTitle } from "../UseTitle.js"

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

export default function MyFiles() {
    useTitle("OffGrid - Private file transfer")
    const [showPathMenu, setShowPathMenu] = useState(false)
    const pathMenuRef = useRef(null)

    const [appliedFilters, setAppliedFilters] = useState({});
    const handleFilterChange = (filters) => {setAppliedFilters(filters);};

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

    return (
        <div className="page">
            <AddFile />
            <Filters />

            <div id="currentPathDisplay">
                <Link>My files</Link>
                <ArrowRight id="arrowRight"/>
                <Link>Sursa 1</Link>
                <ArrowRight id="arrowRight"/>
                
                <div style={{ position: "relative", display: "inline-block" }} ref={pathMenuRef}>
                    <Link onClick={() => setShowPathMenu(prev => !prev)} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                        Sursa 2
                        <ArrowDown id="arrowDown"/>
                    </Link>

                    {showPathMenu && <div id="pathDropdownMenu">
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
                    </div>}
                </div>
            </div>

            <div className="fileSizeChart"></div>

            <div className="fileContainer">
                <div className="fileTableHeader">
                    <div>Name</div>
                    <div>Type</div>
                    <div>Size</div>
                    <div>Last modified</div>
                </div>
                
                <hr className="fileTableDivider"/>

                <div className="fileList">
                    <File name="Exemplu.pdf" extension="pdf" size="5 MB" lastModified="2026-06-21" owner="CosminN14"/>
                    <File name="Exemplu.wav" extension="wav" size="50 MB" lastModified="2026-06-21" owner="CosminN14"/>
                    <File name="Exemplu.cpp" extension="cpp" size="2 MB" lastModified="2026-06-21" owner="CosminN14"/>
                    <File name="Exemplu.png" extension="png" size="4 MB" lastModified="2026-06-21" owner="CosminN14"/>
                    <File name="Exemplu" extension="folder" size="400 MB" lastModified="2026-06-21" owner="CosminN14"/>
                </div>
            </div>
        </div>
    )
}