import React, { useState, useEffect, Suspense, lazy } from "react"

import { getFileColor, getViewerComponent, extensionToLanguage } from "../MyFiles/FileColors"
import { customFetch } from "../UserContext.jsx"
import isMobile from "../IsMobile.js"

import Add from "../assets/SVG/FileIcons/Add.svg?react"
import Enlarge from "../assets/SVG/Enlarge.svg?react"
import Shrink from "../assets/SVG/Shrink.svg?react"

import "./FileViewers.css"
import DocumentViewer from "./DocumentViewer.jsx"

const VideoPlayer = lazy(() => import("./VideoPlayer.jsx"))
const AudioPlayer = lazy(() => import("./AudioPlayer.jsx"))
const PhotoViewer = lazy(() => import("./PhotoViewer.jsx"))
const PdfViewer = lazy(() => import("./PdfViewer.jsx"))
const CodeViewer = lazy(() => import("./CodeViewer.jsx"))
const ArchiveViewer = lazy(() => import("./ArchiveViewer.jsx"))

export default function FileViewer(props) {
    const [fileUrl, setFileUrl] = useState(null)
    const [fileBlob, setFileBlob] = useState(null) 
    const [loadingContent, setLoadingContent] = useState(true)
    const [fetchError, setFetchError] = useState(null)

    const fileId = props.file?.file_id || props.id

    useEffect(() => {
        const handleKeyDown = (event) => {
            event.key === "Escape" && props.onExit() 
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

                if (!response.ok) throw new Error("File content can't be loaded")

                const buffer = await response.arrayBuffer()
                const contentType = response.headers.get('content-type') || 'application/octet-stream'
                const blob = new Blob([buffer], { type: contentType })
                objectUrl = URL.createObjectURL(blob)

                if (isMounted) {
                    setFileUrl(objectUrl)
                    setFileBlob(blob)  
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

    const size = props.viewerSize || (isMobile === 0 ? "small" : "full")
    const setSize = props.setViewerSize

    const componentName = getViewerComponent(props.file.name, extensionToLanguage)
    let ViewerComponent = null
    switch (componentName) {
        case "VideoPlayer": ViewerComponent = VideoPlayer; break
        case "AudioPlayer": ViewerComponent = AudioPlayer; break
        case "PhotoViewer": ViewerComponent = PhotoViewer; break
        case "DocumentViewer": ViewerComponent = DocumentViewer; break
        case "PdfViewer": ViewerComponent = PdfViewer; break
        case "CodeViewer": ViewerComponent = CodeViewer; break
        case "ArchiveViewer": ViewerComponent = ArchiveViewer; break
        default: ViewerComponent = null; break
    }

    return (
        <div className="fileViewer" id={size}>
            <div id="windowActions">
                {size !== "full" ? 
                    isMobile() == 0 && <Enlarge onClick={() => setSize("full")} /> : 
                    isMobile() == 0 && <Shrink onClick={() => setSize("small")} />
                }
                <Add id="closeFileViewer" onClick={() => {
                    props.onExit()
                }} />
            </div>

            {ViewerComponent != AudioPlayer && <h1 id="fileTitle">{props.file.name}</h1>}

            <div className="viewerContent">
                {loadingContent ? (
                    <div className="unsupported">Loading file data...</div>
                ) : fetchError ? (
                    <div className="unsupported">Error: {fetchError}</div>
                ) : ViewerComponent ? (
                    <Suspense fallback={<div className="unsupported">Loading viewer...</div>}>
                        <ViewerComponent file={props.file} viewerSize={size}
                            fileContent={fileUrl} fileBlob={fileBlob}
                        />
                    </Suspense>
                ) : (
                    <h3 className="unsupported">This file can't be previewed</h3>
                )}
            </div>
                
            <button onClick={() => downloadFile()}>Download</button>
        </div>
    )
}