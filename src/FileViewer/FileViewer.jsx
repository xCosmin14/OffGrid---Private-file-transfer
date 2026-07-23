import React, { useState, Suspense, lazy } from "react"
import { getFileColor, getViewerComponent, extensionToLanguage } from "../MyFiles/FileColors"

import Add from "../assets/SVG/FileIcons/Add.svg?react"
import Enlarge from "../assets/SVG/Enlarge.svg?react"
import Shrink from "../assets/SVG/Shrink.svg?react"

import "./FileViewers.css"

const VideoPlayer = lazy(() => import("./VideoPlayer.jsx"))
const AudioPlayer = lazy(() => import("./AudioPlayer.jsx"))
const PhotoViewer = lazy(() => import("./PhotoViewer.jsx"))
const DocumentViewer = lazy(() => import("./DocumentViewer.jsx"))
const SpreadsheetViewer = lazy(() => import("./SpreadsheetViewer.jsx"))
const PresentationViewer = lazy(() => import("./PresentationViewer.jsx"))
const CodeViewer = lazy(() => import("./CodeViewer.jsx"))
const ArchiveViewer = lazy(() => import("./ArchiveViewer.jsx"))

export default function FileViewer(props) {
    const [size, setSize] = useState("small")

    const componentName = getViewerComponent(props.file.name, extensionToLanguage)
    let ViewerComponent = null
    switch (componentName) {
        case "VideoPlayer": ViewerComponent = VideoPlayer; break;
        case "AudioPlayer": ViewerComponent = AudioPlayer; break;
        case "PhotoViewer": ViewerComponent = PhotoViewer; break;
        case "DocumentViewer": ViewerComponent = DocumentViewer; break;
        case "SpreadsheetViewer": ViewerComponent = SpreadsheetViewer; break;
        case "PresentationViewer": ViewerComponent = PresentationViewer; break;
        case "CodeViewer": ViewerComponent = CodeViewer; break;
        case "ArchiveViewer": ViewerComponent = ArchiveViewer; break;
        default: ViewerComponent = null; break;
    }

    return (
        <div className="fileViewer" id={size}>
            <div id="windowActions">
                {size !== "full" ? 
                    <Enlarge onClick={() => setSize("full")} /> : 
                    <Shrink onClick={() => setSize("small")} />
                }
                <Add id="closeFileViewer" onClick={() => {
                    props.onExit()
                }} />
            </div>

            <h1 id="fileTitle">{props.file.name}</h1>

            <div className="viewerContent">
                {ViewerComponent ? (
                    <Suspense fallback={<div className="loadingViewer">Loading viewer</div>}>
                        <ViewerComponent file={props.file} />
                    </Suspense>
                ) : (
                    <h1 className="unsupported">This file type can't be previewed</h1>
                )}
            </div>
        </div>
    )
}