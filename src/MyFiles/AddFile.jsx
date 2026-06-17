import { useState, useEffect, useRef } from "react"

import Add from "../assets/SVG/FileIcons/Add.svg?react"
import Folder from "../assets/SVG/FileIcons/Folder.svg?react"
import UploadFile from "../assets/SVG/FileIcons/UploadFile.svg?react"
import TextFile from "../assets/SVG/FileIcons/TextFile.svg?react"
import ArrowUp from "../assets/SVG/ArrowUp.svg?react"

import "./MyFiles.css"

export default function AddFile(props) {
    const [show, setShow] = useState(false)
    const menuRef = useRef(null)
    
    let types=""

    switch(props.supports) {
        case "documents":
            types = [
                ".pdf", "application/pdf",
                ".doc", ".docx", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                ".xls", ".xlsx", ".csv", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "text/csv",
                ".ppt", ".pptx", "application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation",
                ".odt", ".ods", ".odp", "application/vnd.oasis.opendocument.text", "application/vnd.oasis.opendocument.spreadsheet", "application/vnd.oasis.opendocument.presentation",
                ".rtf", "text/plain", "application/rtf", "text/rtf"
            ].join(",")
            break
        
        case "music":
            types = "audio/*"
            break

        case "visual": 
            types = "image/*,video/*"
            break
            
        default:
            types = "" 
    }

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShow(false)
            }
        }

        if (show) {
            document.addEventListener("mousedown", handleClickOutside)
            document.addEventListener("touchstart", handleClickOutside)
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
            document.removeEventListener("touchstart", handleClickOutside)
        }
    }, [show])

    const showOptions = () => {
        setShow(prevShow => !prevShow)
    }

    const handleFileUpload = (e) => {
        
    }

    const handleCreateFolder = () => {
        
    }

    const handleFolderUpload = (e) => {
        
    }

    const handleCreateText = () => {
        
    }

    const handleCreateMarkdown = () => {
        
    }

    return (
        <div id="addContainer" ref={menuRef}>
            <Add id="addFileBtn" className = {show === true ? "active" : ""} 
                onClick={() => showOptions()} 
            />

            {show && <div id="fileUploadMenu">
                <div className="uploadOption">
                    <UploadFile />
                    <input 
                        type="file" name="fileUpload"
                        accept={types} 
                        onChange = {handleFileUpload}
                    />
                    <h3>Upload file</h3>
                </div>

                <hr />

                <div className="uploadOption" onClick={handleCreateFolder}>
                    <div id="newFolderSVG">
                        <Add />
                        <Folder />
                    </div>
                    <h3>Create folder</h3>
                </div>

                <div className="uploadOption" style={{ position: "relative" }}>
                    <div id="newFolderSVG">
                        <ArrowUp />
                        <Folder />
                    </div>

                    <input 
                        type="file" name="folderUpload"
                        webkitdirectory="" directory="" multiple 
                        onChange={handleFolderUpload}
                        style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
                    />

                    <h3>Upload folder</h3>
                </div>

                <hr />

                <div className="uploadOption" onClick={handleCreateText}>
                    <TextFile id="bigger"/>
                    <h3>Create text file</h3>
                </div>

                <div className="uploadOption" onClick={handleCreateMarkdown}>
                    <TextFile id="bigger"/>
                    <h3>Create markdown file</h3>
                </div>
            </div>}
        </div>
    )
}