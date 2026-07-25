import React, { useEffect, useRef, useState } from "react"
import { renderAsync } from "docx-preview"
import * as XLSX from "xlsx"

import isMobile from "../IsMobile.js"

import "./FileViewers.css"

export default function DocumentViewer(props) {
    const docxContainerRef = useRef(null)
    const [htmlTable, setHtmlTable] = useState("")
    const [textContent, setTextContent] = useState("") 
    const [docHeight, setDocHeight] = useState(0)

    const [scale, setScale] = useState(props.viewerSize === "full" ? 0.75 : 0.45)

    const handleScroll = (e) => {
        const el = e.target
        const maxScroll = el.scrollHeight - el.clientHeight
        const progress = maxScroll > 0 ? (el.scrollTop / maxScroll) * 100 : 0
        el.style.setProperty('--scroll-progress', `${Math.round(progress)}%`)
    }

    useEffect(() => {
        if (props.file.extension === "docx") 
            setScale(props.viewerSize === "full" ? 0.75 : 0.45)
    }, [props.viewerSize, props.file.extension])

    useEffect(() => {
        if (!props.fileContent) return

        if (props.file.extension === "docx") {
            fetch(props.fileContent)
                .then(res => res.blob())
                .then(blob => {
                    if (docxContainerRef.current) {
                        docxContainerRef.current.innerHTML = ""
                        
                        renderAsync(blob, docxContainerRef.current, null, { 
                            inWrapper: false,
                            breakPages: true,
                            ignoreLastRenderedPageBreak: true
                        })
                            .then(() => {
                                if (docxContainerRef.current) 
                                    setDocHeight(docxContainerRef.current.scrollHeight)
                            })
                    }
                }).catch()
        } else if (props.file.extension === "xlsx" || props.file.extension === "xls" || props.file.extension === "csv") {
            fetch(props.fileContent)
                .then(res => res.arrayBuffer())
                .then(buffer => {
                    const workbook = XLSX.read(buffer, { type: "array" })
                    const firstSheetName = workbook.SheetNames[0]
                    const worksheet = workbook.Sheets[firstSheetName]
                    
                    const html = XLSX.utils.sheet_to_html(worksheet)
                    setHtmlTable(html)
                }).catch()

        } else if (props.file.extension === "txt") {
            fetch(props.fileContent)
                .then(res => res.text())
                .then(text => setTextContent(text))
                .catch()
        }
    }, [props.fileContent, props.file.extension])

    const zoomIn = () => setScale(prev => Math.min(prev + 0.05, 2))
    const zoomOut = () => setScale(prev => Math.max(prev - 0.05, 0.25))
    const resetZoom = () => setScale(props.viewerSize === "full" ? 0.75 : 0.45)

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

                <div id="pdfDocumentContainer" onScroll={handleScroll} 
                >
                    <div 
                        style={{ 
                            width: `${800 * scale}px`, 
                            height: docHeight ? `${docHeight * scale}px` : "auto", 
                            margin: isMobile() === 0 ? "20px auto" : "0", 
                        }}
                    >
                        <div 
                            style={{
                                width: "800px", 
                                transform: `scale(${scale})`, 
                                transformOrigin: "top left", 
                                transition: "transform 0.3s ease"
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
            <div id="excelViewer" onScroll={handleScroll} 
                dangerouslySetInnerHTML={{ __html: htmlTable }} 
            />
        )

    if (props.file.extension === "txt")
        return (
            <pre id="txtViewer" onScroll={handleScroll}>
                {textContent}
            </pre>
        )

    return <div className="unsupported">Format nesuportat în acest viewer.</div>
}