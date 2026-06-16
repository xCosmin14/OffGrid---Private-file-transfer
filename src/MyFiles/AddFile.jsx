import { useState } from "react"
import Add from "../assets/SVG/FileIcons/Add.svg?react"

import "./MyFiles.css"

export default function AddFile(props) {
    const [show, setShow] = useState(false)
    
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
            types = "audio/*"; break

        case "visual": 
            types = "image/*,video/*"; break
            
        default:
            types = "" 
    }

    const showOptions = () => {
        setShow(!show)
    }

    return (
        <div id="addContainer">
            <Add id="addFileBtn" onClick={() => showOptions()} />
            <input 
                type="file" 
                accept={types} 
                name="documentInput" 
                id="docpicker" 
            />
        </div>
    )
}