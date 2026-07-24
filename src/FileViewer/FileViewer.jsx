import React, { useState, useEffect, Suspense, lazy } from "react"

import { getFileColor, getViewerComponent, extensionToLanguage } from "../MyFiles/FileColors"
import { customFetch } from "../UserContext.jsx"

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
    const [fileUrl, setFileUrl] = useState(null)
    const [loadingContent, setLoadingContent] = useState(true)
    const [fetchError, setFetchError] = useState(null)

    const fileId = props.file?.file_id || props.id

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === "Escape") props.onExit()
            
        }

        window.addEventListener("keydown", handleKeyDown)

        return () => {
            window.removeEventListener("keydown", handleKeyDown)
        }
    }, [props.onExit])

    useEffect(() => {
        let objectUrl = null, isMounted = true

        const fetchFileContent = async () => {
            if (!fileId) return

            setLoadingContent(true)
            setFetchError(null)

            try {
                const response = await customFetch(`http://localhost:18080/get_file?file_id=${fileId}`, {
                    method: "GET",
                    headers: { 'Content-Type': 'application/json' },
                })

                if (!response.ok)
                    throw new Error("File content can't be loaded")

                const buffer = await response.arrayBuffer()
                objectUrl = URL.createObjectURL(new Blob([buffer], { type: 'application/octet-stream' }))

                if (isMounted) {
                    setFileUrl(objectUrl)
                    setLoadingContent(false)
                }
            } catch (err) {
                if (isMounted) {
                    setFetchError(err.message)
                    setLoadingContent(false)
                }
            }
        }

        fetchFileContent()

        return () => {
            isMounted = false
            if (objectUrl) URL.revokeObjectURL(objectUrl)
        }
    }, [fileId])

    const downloadFile = async () => {
        const response = await customFetch(`http://localhost:18080/get_file?file_id=${fileId}`, {
            method: "GET",
            headers: { 'Content-Type': 'application/json' },
        })

        let buffer = await response.arrayBuffer()
        const url = URL.createObjectURL(new Blob([buffer], { type: 'application/octet-stream' }))
        const a = document.createElement('a')
        a.href = url
        a.download = props.file.name
        document.body.appendChild(a)
        a.click()

        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }        

    const size = props.viewerSize || "small"
    const setSize = props.setViewerSize

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
                {loadingContent ? (
                    <div className="unsupported">Loading file data...</div>
                ) : fetchError ? (
                    <div className="unsupported">Eroare: {fetchError}</div>
                ) : ViewerComponent ? (
                    <Suspense fallback={<div className="unsupported">Loading viewer...</div>}>
                        <ViewerComponent file={props.file} fileContent={fileUrl} />
                    </Suspense>
                ) : (
                    <h1 className="unsupported">This file type can't be previewed</h1>
                )}
            </div>
                
            <button onClick={() => downloadFile()}>Download</button>
        </div>
    )
}