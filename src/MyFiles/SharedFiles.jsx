import { useState, useEffect, useRef } from "react"
import {Link} from 'react-router-dom'

import {useTitle} from "../UseTitle.js"

import File from "./File.jsx"
import AddFile from "./AddFile.jsx"
import Filters from "./Filters.jsx"

import ArrowRight from "../assets/SVG/ArrowRight.svg?react"
import ArrowDown from "../assets/SVG/ArrowDown.svg?react"
import Download from "../assets/SVG/FileIcons/Download.svg?react"
import Rename from "../assets/SVG/FileIcons/Rename.svg?react"
import ChangeColor from "../assets/SVG/FileIcons/ChangeColor.svg?react"
import Trash from "../assets/SVG/FileIcons/Trash.svg?react"
import StarFull from "../assets/SVG/StarFull.svg?react"
import Group from "../assets/SVG/UserIcons/Group.svg?react"

import "./MyFiles.css"

export default function SharedFiles() {
    useTitle("Shared files")
    const [showPathMenu, setShowPathMenu] = useState(false)
    const pathMenuRef = useRef(null)
    
        //SE VERIFICA DREPTURILE ASUPRA FISIERULUI SI SUNT OPTIUNI IN FUNCTIE DE ASTA

    return (
        <div className="page">
            <AddFile />
            <Filters />

            <div id="currentPathDisplay">
                <Link>Shared</Link>
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
                            <h5>Remove from Favorites</h5>
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
                    <div>File size</div>
                    <div>Last modified</div>
                    <div>Owner</div>
                </div>
                
                <hr className="fileTableDivider"/>

                <div className="fileList">

                </div>
            </div>
        </div>
    );
}