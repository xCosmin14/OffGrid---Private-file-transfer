import React, { useState, useEffect } from "react"

import "./FileViewers.css"

export default function PhotoViewer(props) {
    const [svgCode, setSvgCode] = useState("")

    useEffect(() => {
        if (props.fileContent) {
            fetch(props.fileContent)
                .then(res => res.text())
                .then(text => setSvgCode(text))
                .catch(err => console.error(err))
        }
    }, [props.fileContent])

    return (
        <div id="photoViewer">
            {(props.file.extension === "png" || props.file.extension === "bmp"
                || props.file.extension === "jpg" || props.file.extension === "jpeg") 
                && <img src={props.fileContent} id="normalPhoto"/>}

            {props.file.extension === "svg" && (
                <div 
                    id="svgContainer" 
                    dangerouslySetInnerHTML={{ __html: svgCode }} 
                />
            )}
        </div>
    )
}