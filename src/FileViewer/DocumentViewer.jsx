import React, { useEffect, useRef, useState } from "react"
import { renderAsync } from "docx-preview"
import * as XLSX from "xlsx"

import "./FileViewers.css"

export default function DocumentViewer(props) {
    const docxContainerRef = useRef(null)
    const [htmlTable, setHtmlTable] = useState("")
    
    const [docHeight, setDocHeight] = useState(0) 
    const [scale, setScale] = useState(props.viewerSize === "full" ? 0.868 : 0.59)

    useEffect(() => {
        if (props.file.extension === "docx") {
            setScale(props.viewerSize === "full" ? 0.868 : 0.59)
        }
    }, [props.viewerSize, props.file.extension])

    useEffect(() => {
        if (!props.fileContent) return

        if (props.file.extension === "docx") {
            fetch(props.fileContent)
                .then(res => res.blob())
                .then(blob => {
                    if (docxContainerRef.current) {
                        docxContainerRef.current.innerHTML = ""
                        
                        renderAsync(blob, docxContainerRef.current, null, { inWrapper: false })
                            .then(() => {
                                if (docxContainerRef.current) 
                                    setDocHeight(docxContainerRef.current.scrollHeight)
                            })
                    }
                })
        } else if (props.file.extension === "xlsx" || props.file.extension === "xls" || props.file.extension === "csv") {
            fetch(props.fileContent)
                .then(res => res.arrayBuffer())
                .then(buffer => {
                    const workbook = XLSX.read(buffer, { type: "array" })
                    const firstSheetName = workbook.SheetNames[0]
                    const worksheet = workbook.Sheets[firstSheetName]
                    
                    const html = XLSX.utils.sheet_to_html(worksheet)
                    setHtmlTable(html)
                })
        }
    }, [props.fileContent, props.file.extension])

    const zoomIn = () => setScale(prev => Math.min(prev + 0.05, 2.5))
    const zoomOut = () => setScale(prev => Math.max(prev - 0.05, 0.5))
    const resetZoom = () => setScale(props.viewerSize === "full" ? 0.868 : 0.59)

    if (props.file.extension === "docx") 
        return (
            <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%" }}>
                
                <div id="pdfControls">
                    <div id="zoomControls">
                        <button onClick={zoomOut}>-</button>
                        <span>{Math.round(scale * 100)}%</span>
                        <button onClick={zoomIn}>+</button>
                        <button onClick={resetZoom}>Reset</button>
                    </div>
                </div>

                <div id="pdfDocumentContainer">
                    
                    
                    <div 
                        style={{ 
                            width: `${800 * scale}px`, 
                            height: docHeight ? `${docHeight * scale}px` : "auto", 
                            margin: "20px auto", 
                        }}
                    >
                        <div 
                            style={{
                                width: "800px", 
                                transform: `scale(${scale})`, 
                                transformOrigin: "top left", 
                                transition: "transform 0.15s ease-out"
                            }}
                        >
                            <div id="docxViewer" ref={docxContainerRef} />
                        </div>
                    </div>
                </div>
            </div>
        )

    if (props.file.extension === "xlsx" || props.file.extension === "xls" || props.file.extension === "csv") 
        return (
            <div 
                id="excelViewer"
                dangerouslySetInnerHTML={{ __html: htmlTable }} 
            />
        )

    return <div className="unsupported">Format nesuportat în acest viewer.</div>
}