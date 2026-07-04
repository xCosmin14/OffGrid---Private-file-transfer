import { useState, useEffect } from "react"

export default function GlobalUploadProgress() {
    const [uploadData, setUploadData] = useState({ 
        isUploading: false, 
        progress: 0, 
        loaded: 0, 
        total: 0,
        currentFile: "",
        fileIndex: 0,
        totalFiles: 0
    })

    useEffect(() => {
        let timeoutId

        const handleProgressUpdate = (e) => {
            const data = e.detail

            if (!data.isUploading) 
                timeoutId = setTimeout(() => {
                    setUploadData(data)
                }, 3000)
            else {
                clearTimeout(timeoutId)
                setUploadData(data)
            }
        };

        window.addEventListener('upload-progress', handleProgressUpdate)
        
        return () => {
            window.removeEventListener('upload-progress', handleProgressUpdate)
            clearTimeout(timeoutId)
        };
    }, []);

    if (!uploadData.isUploading) return null

    const isFinished = uploadData.progress === 100

    return (
        <div className="uploadProgressContainer">
            <h4>{isFinished ? "Upload complete!" : `Uploading: ${uploadData.progress}%`}</h4>
            
            <div className="currentFile">{isFinished 
                    ? "All files were successfully saved."
                    : <>Processing ({uploadData.fileIndex}/{uploadData.totalFiles}): <strong>{uploadData.currentFile}</strong></>
                }</div>
            
            <progress value={uploadData.progress} min="0" max="100" />
            
            <p>{uploadData.loaded} of {uploadData.total} MB</p>
        </div>
    )
}