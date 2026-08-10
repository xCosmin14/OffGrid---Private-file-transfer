import React, { useState, useEffect } from "react"

import DOMPurify from "dompurify"

import "./FileViewers.css"

export default function PhotoViewer(props) {
    const [svgCode, setSvgCode] = useState("")
    const ext = props.file?.extension?.toLowerCase()

    useEffect(() => {
        if (props.fileContent && ext === "svg") {
            fetch(props.fileContent)
                .then(res => res.text())
                .then(text => {
                    const cleanSvg = DOMPurify.sanitize(text, { 
                        USE_PROFILES: { svg: true, svgFilters: true } 
                    })
                    setSvgCode(cleanSvg)
                })
                .catch()
        }
    }, [props.fileContent, ext])

    return (
        <div id="photoViewer">
            {(ext === "png" || ext === "bmp" || ext === "webp" || ext === "jpg" || ext === "jpeg" || ext === "gif"|| ext === "heif") && (
                <img src={props.fileContent} id="normalPhoto" alt={props.file?.name || "Preview"} />
            )}

            {ext === "svg" && (
                <div 
                    id="svgContainer" 
                    dangerouslySetInnerHTML={{ __html: svgCode }} 
                />
            )}
        </div>
    )
}