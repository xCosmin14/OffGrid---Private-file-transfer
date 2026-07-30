import { useState, useEffect } from "react"
import { cancelUpload } from "./AddFile.jsx"

export default function GlobalUploadProgress() {
    const [uploads, setUploads] = useState({})

    useEffect(() => {
        const timeouts = {}

        const handleProgressUpdate = (e) => {
            const data = e.detail, { uploadId, isUploading } = data

            if (!uploadId) return 
            if (!isUploading) {
                setUploads(prev => {
                    if (!prev[uploadId]) return prev
                    return { 
                        ...prev, 
                        [uploadId]: { ...prev[uploadId], isUploading: false, progress: 100 } 
                    }
                })

                timeouts[uploadId] = setTimeout(() => {
                    setUploads(prev => {
                        const newUploads = { ...prev }
                        delete newUploads[uploadId]
                        return newUploads
                    })
                    delete timeouts[uploadId]
                }, 3000)
            } else {
                if (timeouts[uploadId]) {
                    clearTimeout(timeouts[uploadId])
                    delete timeouts[uploadId]
                }
                
                setUploads(prev => ({
                    ...prev,
                    [uploadId]: data
                }))
            }
        }

        window.addEventListener('upload-progress', handleProgressUpdate)
        
        return () => {
            window.removeEventListener('upload-progress', handleProgressUpdate)
            Object.values(timeouts).forEach(clearTimeout)
        }
    }, [])

    const activeUploads = Object.entries(uploads)
    if (activeUploads.length === 0) return null

    return (
        <div id="globalUploadsWrapper" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {activeUploads.map(([id, data]) => {
                const isFinished = data.progress === 100 && !data.isUploading

                return (
                    <div className="uploadProgressContainer" key={id}>
                        <h4>{isFinished ? "Upload complete!" : `Uploading: ${data.progress}%`}</h4>
                        
                        <div className="currentFile">
                            {isFinished 
                                ? "All files were successfully saved."
                                : <>Processing ({data.fileIndex}/{data.totalFiles}): <strong>{data.currentFile}</strong></>
                            }
                        </div>
                        
                        <progress value={data.progress} min="0" max="100" />
                        
                        {!isFinished && (
                            <p id="cancelUpload" onClick={() => cancelUpload(id)} style={{ cursor: "pointer" }}>
                                Cancel
                            </p>
                        )}
                        
                        <p>{data.loaded} of {data.total} MB</p>
                    </div>
                )
            })}
        </div>
    )
}