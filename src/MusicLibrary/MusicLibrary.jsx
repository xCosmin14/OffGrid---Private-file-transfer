import { useState, useEffect, useRef } from "react"
import {Link} from 'react-router-dom'

import { useTitle } from "../UseTitle.js"

import Song from "./Song.jsx"
import AddFile from "../MyFiles/AddFile.jsx"
import Filters from "../MyFiles/Filters.jsx"

import ArrowRight from "../assets/SVG/ArrowRight.svg?react"
import ArrowDown from "../assets/SVG/ArrowDown.svg?react"
import Download from "../assets/SVG/FileIcons/Download.svg?react"
import Rename from "../assets/SVG/FileIcons/Rename.svg?react"
import ChangeColor from "../assets/SVG/FileIcons/ChangeColor.svg?react"
import Trash from "../assets/SVG/FileIcons/Trash.svg?react"
import StarFull from "../assets/SVG/StarFull.svg?react"
import Group from "../assets/SVG/UserIcons/Group.svg?react"

import "./MusicLibrary.css"
import "../MyFiles/MyFiles.css"

export default function MusicLibrary() {
    useTitle("Music library")
    const [showPathMenu, setShowPathMenu] = useState(false)
    const pathMenuRef = useRef(null)

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
        console.log(action)
        setShowPathMenu(false)
    }

    return (
        <div className="page">
            <AddFile supports="music" />
            <Filters />

            <div id="currentPathDisplay">
                <Link>Music library</Link>
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

            <div className="fileContainer" id="music">
                <div className="fileTableHeader">
                    <div>Title</div>
                    <div>Artists</div>
                    <div>Album</div>
                    <div>Duration</div>
                    <div>Release date</div>
                    <div>Added / Modified</div>
                    <div>Size</div>
                </div>
                
                <hr className="fileTableDivider"/>

                <div className="fileList">
                    <Song name="Exemplu.flac" extension="flac" size="5 MB" lastModified="2026-06-21" />
                    <Song name="Exemplu.flac" extension="flac" size="50 MB" lastModified="2026-06-21" />
                    <Song name="Exemplu.flac" extension="flac" size="2 MB" lastModified="2026-06-21" />
                    <Song name="Exemplu.flac" extension="flac" size="4 MB" lastModified="2026-06-21" />
                    <Song name="Exemplu.flac" extension="folder" size="400 MB" lastModified="2026-06-21" />
                </div>
            </div>
        </div>
    )
}