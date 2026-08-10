import { useState, useEffect, useRef } from "react"

import { customFetch } from "../UserContext.jsx"

import Add from "../assets/SVG/FileIcons/Add.svg?react"
import Folder from "../assets/SVG/FileIcons/Folder.svg?react"
import UploadFile from "../assets/SVG/FileIcons/UploadFile.svg?react"
import TextFile from "../assets/SVG/FileIcons/TextFile.svg?react"
import ArrowUp from "../assets/SVG/ArrowUp.svg?react"

import "./AddFile.css"

const activeUploads = new Map()

export async function cancelUpload(uploadId) {
    const uploadTask = activeUploads.get(uploadId)
    
    if (!uploadTask) {
        window.dispatchEvent(new CustomEvent('upload-progress', { detail: { isUploading: false, uploadId } }))
        return
    }

    if (uploadTask.xhr) uploadTask.xhr.abort()
    
    if (!uploadTask.transaction_id) {
        activeUploads.delete(uploadId)
        window.dispatchEvent(new CustomEvent('upload-progress', { detail: { isUploading: false, uploadId } }))
        return
    }
    
    try {
        await customFetch(`http://localhost:18080/cancel_upload?transaction_id=${uploadTask.transaction_id}`, {
            method: "DELETE",
            credentials: "include"
        })
    } catch (err) {} finally {
        activeUploads.delete(uploadId) 
        window.dispatchEvent(new CustomEvent('upload-progress', { detail: { isUploading: false, uploadId } }))
    }
}

export default function AddFile(props) {
    const [show, setShow] = useState(false)
    const menuRef = useRef(null)

    const [displayCreateFolder, setDisplayCreateFolder] = useState(false)
    const createFolderRef = useRef(null)
    const [newFolderName, setNewFolderName] = useState("")
    const [newFolderColor, setNewFolderColor] = useState("#000000")

    const [uploadProgress, setUploadProgress] = useState(0)
    const [uploadStats, setUploadStats] = useState({ loaded: 0, total: 0})
    const [isUploading, setIsUploading] = useState(false)
    
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
            types = "audio/*"
            break

        case "visual": 
            types = "image/*,video/*"
            break
            
        default:
            types = "" 
    }

    useEffect(() => {
        const handleClickOutsideFolder = (event) => {
            if (createFolderRef.current && !createFolderRef.current.contains(event.target)) {
                setDisplayCreateFolder(false)
            }
        }

        if (displayCreateFolder) {
            document.addEventListener("mousedown", handleClickOutsideFolder)
            document.addEventListener("touchstart", handleClickOutsideFolder)
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutsideFolder)
            document.removeEventListener("touchstart", handleClickOutsideFolder)
        }
    }, [displayCreateFolder])

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShow(false)
            }
        }

        if (show) {
            document.addEventListener("mousedown", handleClickOutside)
            document.addEventListener("touchstart", handleClickOutside)
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
            document.removeEventListener("touchstart", handleClickOutside)
        }
    }, [show])

    const showOptions = () => {
        setShow(prevShow => !prevShow)
    }

    const handleFileUpload = async (e) => {
        const files = e.target.files
        if (!files || files.length === 0) return

        if (files.length > 100) {
            alert("You cannot upload more than 100 files at once.")
            e.target.value = ""
            setShow(false)
            return
        }

        var totalBytes = 0
        for (let i = 0; i < files.length; i++) totalBytes += files[i].size
        
        const uploadId = crypto.randomUUID()
        activeUploads.set(uploadId, { xhr: null, transaction_id: null })

        let hasUploaded = false

        for (let i = 0; i < files.length; i++) {
            if (files[i].size / (1024 * 1024 * 1024) > 50) {
                console.error("File too big (> 50GB)")
                continue
            }

            const formData = new FormData()
            const finalPath = props.currentPath ? `${props.currentPath}/${files[i].name}` : files[i].name            
            formData.append("file", files[i], finalPath)

            try {
                await new Promise((resolve, reject) => {
                    const xhr = new XMLHttpRequest()
                    
                    const currentTask = activeUploads.get(uploadId)
                    if (currentTask) currentTask.xhr = xhr

                    xhr.upload.addEventListener("progress", (event) => {
                        if (event.lengthComputable) {
                            const percentage = Math.round((event.loaded / event.total) * 100)
                            const loadedMB = (event.loaded / (1024 * 1024)).toFixed(1)
                            const networkTotalMB = (event.total / (1024 * 1024)).toFixed(1)

                            window.dispatchEvent(new CustomEvent('upload-progress', { 
                                detail: { 
                                    isUploading: true,
                                    uploadId: uploadId, 
                                    progress: Math.min(percentage, 100), 
                                    loaded: loadedMB, 
                                    total: networkTotalMB, 
                                    currentFile: files[i].name,
                                    fileIndex: i + 1, 
                                    totalFiles: files.length
                                } 
                            }))
                        }
                    })

                    xhr.addEventListener("load", () => {
                        if (xhr.status >= 200 && xhr.status < 300) resolve()
                        else reject(new Error("Server error"))
                    })

                    xhr.addEventListener("error", reject)
                    xhr.addEventListener("abort", () => reject(new Error("Aborted")))

                    xhr.open("POST", "http://localhost:18080/upload_file")
                    xhr.withCredentials = true
                    xhr.send(formData)
                })
                
                hasUploaded = true
            } catch (error) {
                if (error.message === "Aborted") break 
            } 
        }

        if (hasUploaded && props.onUploadSuccess) props.onUploadSuccess()
        
        activeUploads.delete(uploadId)
        window.dispatchEvent(new CustomEvent('upload-progress', { detail: { isUploading: false, uploadId } }))
        setShow(false)
    }

    const handleCreateFolder = () => {
        setDisplayCreateFolder(true)
        setShow(false)
    }

    const createFolder = async () => {
        if (!newFolderColor || !newFolderName) return

        const body = { 
            name: newFolderName, 
            color: newFolderColor,
            parent_folder_id: props.parentFolderID || null 
        }

        const response = await customFetch("http://localhost:18080/create_folder", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        })
        
        let data = await response.json()
        if (response.ok) {
            setNewFolderColor("#000000")
            setNewFolderName("")
            props.onUploadSuccess()
        }
    }

    const handleFolderUpload = async (e) => {
        const files = Array.from(e.target.files)
        if (files.length === 0) return
        
        if (files.length > 100) {
            alert("Folders cannot contain more than 100 files.")
            e.target.value = "" 
            setShow(false)
            return
        }

        const uploadId = crypto.randomUUID()
        activeUploads.set(uploadId, { xhr: null, transaction_id: null })

        const paths = files.map(file => 
            props.currentPath ? `${props.currentPath}/${file.webkitRelativePath}` : file.webkitRelativePath
        )
        const totalBytes = files.reduce((acc, file) => acc + file.size, 0)
        const totalMB = (totalBytes / (1024 * 1024)).toFixed(1)

        try {
            const response = await customFetch("http://localhost:18080/upload_folder", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fields: paths })
            })
            let data = await response.json()
            
            if (!response.ok || !data.transaction_id) 
                throw new Error(data.message || `upload_folder failed: ${response.status}`)

            setUploadStats({ loaded: 0, total: totalMB })
            
            const currentTask = activeUploads.get(uploadId)
            if (currentTask) currentTask.transaction_id = data.transaction_id

            let uploadedBytes = 0

            for (let i = 0; i < files.length; i++) {
                let file = files[i], currentPathForFile = paths[i] 

                let formData = new FormData()
                formData.append('file', file, currentPathForFile) 

                await new Promise((resolve, reject) => {
                    const xhr = new XMLHttpRequest()
                    if (currentTask) currentTask.xhr = xhr

                    xhr.upload.addEventListener("progress", (event) => {
                        if (event.lengthComputable) {
                            const currentFileProgress = event.loaded / event.total
                            const scaledLoadedForCurrentFile = currentFileProgress * file.size
                            const currentTotalLoaded = uploadedBytes + scaledLoadedForCurrentFile
                            let percentage = Math.round((currentTotalLoaded / totalBytes) * 100)
                            
                            window.dispatchEvent(new CustomEvent('upload-progress', { 
                                detail: { 
                                    isUploading: true,
                                    uploadId: uploadId, 
                                    progress: Math.min(percentage, 100), 
                                    loaded: (currentTotalLoaded / (1024 * 1024)).toFixed(1), 
                                    total: totalMB, 
                                    currentFile: file.name,
                                    fileIndex: i + 1,
                                    totalFiles: files.length
                                } 
                            }))
                        }
                    })

                    xhr.addEventListener("load", () => {
                        if (xhr.status >= 200 && xhr.status < 300) {
                            uploadedBytes += file.size
                            resolve()
                        } else reject(new Error(`Server responded with status: ${xhr.status}`))
                    })

                    xhr.addEventListener("error", () => reject(new Error("Network error")))
                    xhr.addEventListener("abort", () => reject(new Error("Aborted")))

                    xhr.open("POST", `http://localhost:18080/upload_file?transaction_id=${data.transaction_id}`)
                    xhr.withCredentials = true 
                    xhr.send(formData)
                })
            }

            if (props.onUploadSuccess) props.onUploadSuccess()
        } catch (error) {} finally {
            activeUploads.delete(uploadId)
            window.dispatchEvent(new CustomEvent('upload-progress', { detail: { isUploading: false, uploadId } }))
        }
    }

    const handleCreateText = () => {
        
    }

    const renderCreateFolder = () => {
        if (!displayCreateFolder) return null

        return (
            <div id="createFolder" ref={createFolderRef}>
                <h2>Create folder</h2>
                
                <input type="text" name="newFolderName" placeholder="Name" value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value.trim())}
                    onBeforeInput={(e) => {
                        if (/[/]/.test(e.data)) e.preventDefault()     
                    }} 
                />

                <div id="newFolderColor">
                    <h3>Color:  {newFolderColor}</h3>
                    <input type="color" name="newFolderColor" value={newFolderColor}
                        minLength="1" onChange={(e) => setNewFolderColor(e.target.value)}
                    />
                </div>
                
                <div className="createFolderActions">
                    <button onClick={() => {
                        setDisplayCreateFolder(false)
                        setNewFolderColor(""), setNewFolderColor("#000000")
                    }}>Cancel</button>
                    <button  onClick={() => {
                        createFolder()
                        setDisplayCreateFolder(false)
                        setNewFolderColor(""), setNewFolderColor("#000000")
                    }}>Create</button>
                </div>
            </div>
        )
    }

    return (
        <div id="addContainer" ref={menuRef}>
            <Add id="addFileBtn" className = {show === true ? "active" : ""} 
                onClick={() => showOptions()} 
            />

            {show && <div id="fileUploadMenu">
                <div className="uploadOption">
                    <UploadFile />
                    <input 
                        type="file" name="fileUpload"
                        accept={types} 
                        multiple="1"
                        onChange = {handleFileUpload}
                    />
                    <h3>Upload file</h3>
                </div>

                <hr />

                <div className="uploadOption" onClick={handleCreateFolder}>
                    <div id="newFolderSVG">
                        <Add />
                        <Folder />
                    </div>
                    <h3>Create folder</h3>
                </div>

                <div className="uploadOption" style={{ position: "relative" }}>
                    <div id="newFolderSVG">
                        <ArrowUp />
                        <Folder />
                    </div>

                    <input 
                        type="file" name="folderUpload"
                        webkitdirectory="" directory="" multiple 
                        onChange={handleFolderUpload}
                        style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
                    />

                    <h3>Upload folder</h3>
                </div>

                <hr />

                <div className="uploadOption" onClick={handleCreateText}>
                    <TextFile id="bigger"/>
                    <h3>Create text file</h3>
                </div>
            </div>}
            
            {renderCreateFolder()}
        </div>
    )
}