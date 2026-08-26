import React, { useState, useEffect, Suspense, lazy } from "react"
import { useContext } from "react"
import { UserContext } from "../UserContext.jsx"

import { getViewerComponent, extensionToLanguage } from "../MyFiles/FileColors"
import { customFetch } from "../UserContext.jsx"
import isMobile from "../IsMobile.js"

import sodium from 'libsodium-wrappers-sumo'

import { loadCachedPrivateKey } from "../CryptoCache.js"
import { decryptFekForUser, decryptFile } from "../CryptoUtils.js"

import Add from "../assets/SVG/FileIcons/Add.svg?react"
import Enlarge from "../assets/SVG/Enlarge.svg?react"
import Shrink from "../assets/SVG/Shrink.svg?react"
import Edit from "../assets/SVG/Edit.svg?react"

import "./FileViewers.css"
import DocumentViewer from "./DocumentViewer.jsx"

const VideoPlayer = lazy(() => import("./VideoPlayer.jsx"))
const AudioPlayer = lazy(() => import("./AudioPlayer.jsx"))
const PhotoViewer = lazy(() => import("./PhotoViewer.jsx"))
const PdfViewer = lazy(() => import("./PdfViewer.jsx"))
const CodeViewer = lazy(() => import("./CodeViewer.jsx"))
const ArchiveViewer = lazy(() => import("./ArchiveViewer.jsx"))

export default function FileViewer(props) {
    const key = import.meta.env.VITE_HOST_ADDRESS

    const { user } = useContext(UserContext)

    const [fileUrl, setFileUrl] = useState(null)
    const [fileBlob, setFileBlob] = useState(null) 
    const [loadingContent, setLoadingContent] = useState(true)
    const [fetchError, setFetchError] = useState(null)

    const [editOpen, setEditOpen] = useState(false)

    const fileId = props.file?.file_id || props.id

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                props.onExit()
                setEditOpen(false)
            } 
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
                const privateKey = await loadCachedPrivateKey()
        

                if (!privateKey) throw new Error("Private key not found.")

                if (!props.file.fek) throw new Error("No file key available.")
                if (!user?.public_key) throw new Error("Missing user public key.")

                const fek = await decryptFekForUser(props.file.fek, user.public_key, privateKey)
                

                const response = await customFetch(`http://${key}:18080/get_file?file_id=${fileId}`, {
                    method: "GET",
                    headers: { 'Content-Type': 'application/json' },
                })

                if (!response.ok) throw new Error("File content can't be loaded")

                const encryptedBuffer = await response.arrayBuffer()
                const encryptedBytes = new Uint8Array(encryptedBuffer)
                const decryptedBytes = await decryptFile(encryptedBytes, fek)

                const contentType = response.headers.get('content-type') || 'application/octet-stream'
                const blob = new Blob([decryptedBytes], { type: contentType })
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

    const openEdit = () => {
        if (editOpen === false) {
            setEditOpen(true)
            setSize("full")
        } else setEditOpen(false)
    }

    const downloadFile = async () => {
        try {
            if (fileUrl) {
                const a = document.createElement('a')
                a.href = fileUrl
                a.download = props.file.name
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
                return
            }

            const privateKey = await loadCachedPrivateKey()
            if (!privateKey) throw new Error("Private key not found.")

            if (!props.file.fek) throw new Error("No file key available.")
            if (!user?.public_key) throw new Error("Missing user public key.")

            const fek = await decryptFekForUser(props.file.fek, user.public_key, privateKey)

            const response = await customFetch(`http://${key}:18080/get_file?file_id=${fileId}`, {
                method: "GET",
                headers: { 'Content-Type': 'application/json' },
            })

            if (!response.ok) throw new Error("File content can't be loaded")

            const encryptedBuffer = await response.arrayBuffer()
            const encryptedBytes = new Uint8Array(encryptedBuffer)
            const decryptedBytes = await decryptFile(encryptedBytes, fek)

            const blob = new Blob([decryptedBytes], { type: 'application/octet-stream' })
            const url = URL.createObjectURL(blob)

            const a = document.createElement('a')
            a.href = url
            a.download = props.file.name
            document.body.appendChild(a)
            a.click()

            document.body.removeChild(a)
            URL.revokeObjectURL(url)
        } catch (err) {
            console.error("Download error:", err)
            alert(`Download error: ${err.message}`)
        }
    }       

    const mobile = isMobile()
    const size = props.viewerSize || (mobile === 0 ? "small" : "full")
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
                {(props.file.extension === "txt" || props.file.extension === "md") && <Edit id="editBtn" 
                    onClick = {() => openEdit()}
                    style = {{color: editOpen === true ? "var(--hoverCol)" : "var(--text)"}}
                />}
                {size !== "full" ? 
                    mobile == 0 && <Enlarge 
                        style={{marginRight: (props.file.extension === "txt" || props.file.extension === "md") ? "-12px" : "0px"}}
                        onClick={() => setSize("full")} /> : 
                    mobile == 0 && <Shrink onClick={() => setSize("small")} />
                }
                <Add id="closeFileViewer" onClick={() => {
                    props.onExit()
                    setEditOpen(false)
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
                            edit={editOpen}
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