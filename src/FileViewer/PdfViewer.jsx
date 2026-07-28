import React, { useState, useEffect } from "react"
import { Document, Page, pdfjs } from "react-pdf"

import "react-pdf/dist/Page/AnnotationLayer.css"
import "react-pdf/dist/Page/TextLayer.css"

import "./FileViewers.css"

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

export default function PdfViewer(props) {
    const [numPages, setNumPages] = useState(null)
    const [index, setIndex] = useState(1)
    
    const [scale, setScale] = useState(props.viewerSize === "full" ? 0.868 : 0.59)

    const handleScroll = (e) => {
        const el = e.target
        const maxScroll = el.scrollHeight - el.clientHeight
        const progress = maxScroll > 0 ? (el.scrollTop / maxScroll) * 100 : 0
        el.style.setProperty('--scroll-progress', `${Math.round(progress)}%`)
    }

    useEffect(() => {
        setScale(props.viewerSize === "full" ? 0.868 : 0.59)
    }, [props.viewerSize])

    function onDocumentLoadSuccess({ numPages }) {
        setNumPages(numPages)
    }

    useEffect(() => {
        const container = document.getElementById("pdfDocumentContainer")
        if (!container || !numPages) return

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) 
                        setIndex(Number(entry.target.dataset.pageNumber))
                })
            },
            {
                root: container,
                rootMargin: "-49% 0px -49% 0px" 
            }
        )

        const pages = container.querySelectorAll(".pdfPageWrapper")
        pages.forEach((page) => observer.observe(page))

        return () => observer.disconnect()
    }, [numPages, scale])

    const zoomIn = () => setScale(prev => Math.min(prev + 0.05, 2.5))
    const zoomOut = () => setScale(prev => Math.max(prev - 0.05, 0.5))
    const resetZoom = () => setScale(props.viewerSize === "full" ? 0.8 : 0.59)

    return (
        <div id="pdfViewer">
            
            <div id="pdfControls">
                <div id="zoomControls">
                    <button onClick={zoomOut}>-</button>
                    <span>{Math.round(scale * 100)}%</span>
                    <button onClick={zoomIn}>+</button>
                    <button onClick={resetZoom}>Reset</button>
                </div>

                {numPages && (
                    <span id="pageCount">
                        Page {index} of {numPages}
                    </span>
                )}
            </div>

            <div 
                id="pdfDocumentContainer" 
                onScroll={handleScroll}
            >
                <Document
                    file={props.fileContent}
                    onLoadSuccess={onDocumentLoadSuccess}
                    loading={<div>Loading document...</div>}
                    error={<div>Error loading file</div>}
                >
                    {Array.from(new Array(numPages), (_, i) => (
                        <div 
                            key={`page_${i + 1}`} 
                            className="pdfPageWrapper"
                            data-page-number={i + 1} 
                        >
                            <Page 
                                pageNumber={i + 1} 
                                scale={scale} 
                                renderTextLayer={true}
                                renderAnnotationLayer={true}
                            />
                        </div>
                    ))}
                </Document>
            </div>
        </div>
    )
}