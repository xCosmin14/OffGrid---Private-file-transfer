import { useState, useEffect, useRef, useContext } from "react"

import { customFetch, UserContext } from "../UserContext.jsx"

import Add from "../assets/SVG/FileIcons/Add.svg?react"
import Folder from "../assets/SVG/FileIcons/Folder.svg?react"
import UploadFile from "../assets/SVG/FileIcons/UploadFile.svg?react"
import TextFile from "../assets/SVG/FileIcons/TextFile.svg?react"
import ArrowUp from "../assets/SVG/ArrowUp.svg?react"

import { generateFEK, encryptFile, encryptFekForUser } from "../CryptoUtils.js" 

import "./AddFile.css"

const activeUploads = new Map()
const HOST_ADDRESS = import.meta.env.VITE_HOST_ADDRESS

function generateUUID() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') 
        return crypto.randomUUID()
    
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0
        const v = c === 'x' ? r : (r & 0x3) | 0x8
        return v.toString(16)
    })
}

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
        await customFetch(`http://${HOST_ADDRESS}:18080/cancel_upload?transaction_id=${uploadTask.transaction_id}`, {
            method: "DELETE",
            credentials: "include"
        })
    } catch (err) {} finally {
        activeUploads.delete(uploadId) 
        window.dispatchEvent(new CustomEvent('upload-progress', { detail: { isUploading: false, uploadId } }))
    }
}

export default function AddFile(props) {
    const key = import.meta.env.VITE_HOST_ADDRESS
    
    const { user } = useContext(UserContext) 

    const [show, setShow] = useState(false)
    const menuRef = useRef(null)

    const [displayCreateFolder, setDisplayCreateFolder] = useState(false)
    const createFolderRef = useRef(null)
    const [newFolderName, setNewFolderName] = useState("")
    const [newFolderColor, setNewFolderColor] = useState("#000000")

    const [displayCreateText, setDisplayCreateText] = useState(false)
    const createTextRef = useRef(null)
    const [newTextFileName, setNewTextFileName] = useState("")

    const [uploadStats, setUploadStats] = useState({ loaded: 0, total: 0})
    const [isUploading, setIsUploading] = useState(false)
    
    let types = ""

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
            if (createFolderRef.current && !createFolderRef.current.contains(event.target)) 
                setDisplayCreateFolder(false)
        }

        const handleClickOutsideText = (event) => {
            if (createTextRef.current && !createTextRef.current.contains(event.target)) 
                setDisplayCreateText(false)
        }

        const handleKeyDownModal = (event) => {
            if (event.key === "Escape") {
                setDisplayCreateFolder(false)
                setDisplayCreateText(false)
            }
        }

        if (displayCreateFolder) {
            document.addEventListener("mousedown", handleClickOutsideFolder)
            document.addEventListener("touchstart", handleClickOutsideFolder)
        }

        if (displayCreateText) {
            document.addEventListener("mousedown", handleClickOutsideText)
            document.addEventListener("touchstart", handleClickOutsideText)
        }

        if (displayCreateFolder || displayCreateText) {
            window.addEventListener("keydown", handleKeyDownModal)
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutsideFolder)
            document.removeEventListener("touchstart", handleClickOutsideFolder)
            document.removeEventListener("mousedown", handleClickOutsideText)
            document.removeEventListener("touchstart", handleClickOutsideText)
            window.removeEventListener("keydown", handleKeyDownModal)
        }
    }, [displayCreateFolder, displayCreateText])

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target))
                setShow(false)
        }

        const handleKeyDown = (event) => {
            if (event.key === "Escape") setShow(false)
        }

        if (show) {
            document.addEventListener("mousedown", handleClickOutside)
            document.addEventListener("touchstart", handleClickOutside)
            window.addEventListener("keydown", handleKeyDown)
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
            document.removeEventListener("touchstart", handleClickOutside)
            window.removeEventListener("keydown", handleKeyDown)
        }
    }, [show])

    const handleFileUpload = async (e) => {
        const files = e.target.files
        if (!files || files.length === 0) return

        if (!user || !user.public_key) {
            alert("E2EE error: Missing user key.")
            return
        }

        if (files.length > 100) {
            alert("You cannot upload more than 100 files at once.")
            e.target.value = ""
            setShow(false)
            return
        }

        let size = 0
        for (let i = 0; i < files.length; i++) {
            size += files[i].size
            if (size / (1024 * 1024 * 1024) > 50) {
                alert("Total upload size exceeds 50GB.")
                e.target.value = ""
                setShow(false)
                return
            }
        }

        let totalBytes = 0
        for (let i = 0; i < files.length; i++) totalBytes += files[i].size
        const totalMB = (totalBytes / (1024 * 1024)).toFixed(1)
        
        const uploadId = generateUUID()
        activeUploads.set(uploadId, { xhr: null, transaction_id: null })

        let hasUploaded = false
        let uploadedBytes = 0

        for (let i = 0; i < files.length; i++) {
            let file = files[i]
            const finalPath = props.currentPath ? `${props.currentPath}/${file.name}` : file.name            
            
            try {
                const arrayBuffer = await file.arrayBuffer()
                const fileBytes = new Uint8Array(arrayBuffer)
                
                const fek = await generateFEK()
                const encryptedBytes = await encryptFile(fileBytes, fek)
                const encryptedFek = await encryptFekForUser(fek, user.public_key)

                const encryptedBlob = new Blob([encryptedBytes], { type: file.type })
                
                const formData = new FormData()
                formData.append("file", encryptedBlob, finalPath)

                const fileData = await new Promise((resolve, reject) => {
                    const xhr = new XMLHttpRequest()
                    
                    const currentTask = activeUploads.get(uploadId)
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
                            try {
                                const responseJson = JSON.parse(xhr.responseText)
                                resolve(responseJson)
                            } catch (e) {
                                resolve({})
                            }
                        } else {
                            reject(new Error(`Server responded with status: ${xhr.status}`))
                        }
                    })

                    xhr.addEventListener("error", () => reject(new Error("Network error")))
                    xhr.addEventListener("abort", () => reject(new Error("Aborted")))

                    xhr.open("POST", `http://${key}:18080/upload_file`)
                    xhr.withCredentials = true
                    xhr.send(formData)
                })
                
                const file_id = fileData?.file_id || fileData?.id
                if (file_id) {
                    try {
                        await customFetch(`http://${key}:18080/encrypted_fek`, {
                            method: "POST",
                            credentials: "include",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                file_id: file_id,
                                fek: encryptedFek
                            })
                        })
                    } catch (err) {
                        console.warn(`Could not set FEK for file ${file_id}:`, err)
                    }
                }

                hasUploaded = true
            } catch (error) {
                if (error.message === "Aborted") break 
                console.error("Upload error:", error)
            } 
        }

        if (hasUploaded && props.onUploadSuccess) props.onUploadSuccess()
        
        activeUploads.delete(uploadId)
        window.dispatchEvent(new CustomEvent('upload-progress', { detail: { isUploading: false, uploadId } }))
        setShow(false)
    }

    const handleCreateFolder = () => {
        setShow(false)
        setDisplayCreateFolder(true)
    }

    const createFolder = async () => {
        if (!newFolderColor || !newFolderName) return

        const body = { 
            name: newFolderName, 
            color: newFolderColor,
            parent_folder_id: props.parentFolderID || null 
        }

        try {
            const response = await customFetch(`http://${key}:18080/create_folder`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            })
            
            if (response.ok) {
                setNewFolderColor("#000000")
                setNewFolderName("")
                setDisplayCreateFolder(false)
                if (props.onUploadSuccess) props.onUploadSuccess()
            }
        } catch (err) {
            console.error("Error creating folder:", err)
        }
    }

    const handleFolderUpload = async (e) => {
        const files = Array.from(e.target.files)
        if (files.length === 0) return

        if (!user || !user.public_key) {
            alert("E2EE error: Missing user key.")
            return
        }
        
        if (files.length > 100) {
            alert("Folders cannot contain more than 100 files.")
            e.target.value = "" 
            setShow(false)
            return
        }

        let size = 0
        for (let i = 0; i < files.length; i++) {
            size += files[i].size
            if (size / (1024 * 1024 * 1024) > 50) {
                alert("Total upload size exceeds 50GB.")
                e.target.value = ""
                setShow(false)
                return
            }
        }

        const uploadId = generateUUID()
        activeUploads.set(uploadId, { xhr: null, transaction_id: null })
        const fekPairs = []

        const paths = files.map(file => 
            props.currentPath ? `${props.currentPath}/${file.webkitRelativePath}` : file.webkitRelativePath
        )
        const totalBytes = files.reduce((acc, file) => acc + file.size, 0)
        const totalMB = (totalBytes / (1024 * 1024)).toFixed(1)

        try {
            const response = await customFetch(`http://${key}:18080/upload_folder`, {
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

                const arrayBuffer = await file.arrayBuffer()
                const fileBytes = new Uint8Array(arrayBuffer)
                
                const fek = await generateFEK()
                const encryptedBytes = await encryptFile(fileBytes, fek)
                const encryptedFek = await encryptFekForUser(fek, user.public_key)

                const encryptedBlob = new Blob([encryptedBytes], { type: file.type })

                let formData = new FormData()
                formData.append('file', encryptedBlob, currentPathForFile) 

                const fileData = await new Promise((resolve, reject) => {
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
                            try {
                                const responseJson = JSON.parse(xhr.responseText)
                                resolve(responseJson)
                            } catch (e) {
                                resolve({})
                            }
                        } else reject(new Error(`Server responded with status: ${xhr.status}`))
                    })

                    xhr.addEventListener("error", () => reject(new Error("Network error")))
                    xhr.addEventListener("abort", () => reject(new Error("Aborted")))

                    xhr.open("POST", `http://${key}:18080/upload_file?transaction_id=${data.transaction_id}`)
                    xhr.withCredentials = true 
                    xhr.send(formData)
                })

                const file_id = fileData.file_id || fileData.id
                if (file_id) fekPairs.push({ file_id, fek: encryptedFek })   // just remember it
            }

            for (const pair of fekPairs) {
                await customFetch(`http://${key}:18080/encrypted_fek`, {
                    method: "POST",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ file_id: pair.file_id, fek: pair.fek })
                })
            }

            if (props.onUploadSuccess) props.onUploadSuccess()
        } catch (error) {
            console.error("Eroare la upload folder:", error)
        } finally {
            activeUploads.delete(uploadId)
            window.dispatchEvent(new CustomEvent('upload-progress', { detail: { isUploading: false, uploadId } }))
        }
    }

    const handleCreateText = () => {
        setDisplayCreateText(true)
        setShow(false)
    }

    const createTextFile = async () => {
        if (!newTextFileName) return
        if (!user || !user.public_key) {
            alert("E2EE error: User public key missing.")
            return
        }

        const fileNameWithExt = newTextFileName.toLowerCase().endsWith(".txt") 
            ? newTextFileName 
            : `${newTextFileName}.txt`

        try {
            const fek = await generateFEK()
            const encryptedFek = await encryptFekForUser(fek, user.public_key)

            const body = {
                name: fileNameWithExt,
                extension: "txt",
                content_type: "text/plain",
                folder_id: props.parentFolderID || null,
                owner_fek: encryptedFek
            }

            const response = await customFetch(`http://${key}:18080/create_file`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            })
            
            if (response.ok) {
                setNewTextFileName("") 
                setDisplayCreateText(false) 
                if (props.onUploadSuccess) props.onUploadSuccess()
            }
        } catch (err) {
            console.error("Error creating text file:", err)
        }
    }

    const renderCreateFolder = () => {
        if (!displayCreateFolder) return null

        return (
            <div id="createFolder" ref={createFolderRef}>
                <h2>Create folder</h2>
                
                <input 
                    type="text" 
                    name="newFolderName" 
                    placeholder="Name" 
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault()
                            createFolder()
                        }
                    }}
                    onBeforeInput={(e) => {
                        if (/[\/:<>*?"|]/.test(e.data)) e.preventDefault()     
                    }} 
                />

                <div id="newFolderColor">
                    <h3>Color:  {newFolderColor}</h3>
                    <input type="color" name="newFolderColor" value={newFolderColor}
                        minLength="1" onChange={(e) => setNewFolderColor(e.target.value.trim())}
                    />
                </div>
                
                <div className="createFolderActions">
                    <button onClick={() => {
                        setDisplayCreateFolder(false)
                        setNewFolderColor("#000000")
                    }}>Cancel</button>
                    <button onClick={createFolder}>Create</button>
                </div>
            </div>
        )
    }

    const renderCreateText = () => {
        if (!displayCreateText) return null

        return (
            <div id="createFolder" ref={createTextRef}>
                <h2>Create text file</h2>

                <input 
                    type="text" 
                    name="newTextFileName" 
                    placeholder="Name" 
                    value={newTextFileName}
                    onChange={(e) => setNewTextFileName(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault()
                            createTextFile()
                        }
                    }}
                    onBeforeInput={(e) => {
                        if (/[\/:<>*?"|]/.test(e.data)) e.preventDefault()     
                    }} 
                />

                <div className="createFolderActions">
                    <button onClick={() => {
                        setDisplayCreateText(false)
                        setNewTextFileName("")
                    }}>Cancel</button>
                    <button onClick={createTextFile}>Create</button>
                </div>
            </div>
        )
    }

    return (
        <div id="addContainer" ref={menuRef}>
            <Add 
                id="addFileBtn" 
                className={show ? "active" : ""} 
                onClick={() => setShow(prev => !prev)}
            />

            {show && <div id="fileUploadMenu">
                <div className="uploadOption">
                    <UploadFile />
                    <input 
                        type="file" name="fileUpload"
                        accept={types} 
                        multiple="1"
                        onChange={handleFileUpload}
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
            {renderCreateText()}
        </div>
    )
}