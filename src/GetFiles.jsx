import { createContext, useState, useEffect } from "react"
import { customFetch } from "./UserContext.jsx"

export const FileContext = createContext()

export const FileProvider = ({ children }) => {
    const [files, setFiles] = useState([])
    const [folders, setFolders] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [sentBy, setSentBy] = useState("")

    const fetchFiles = async () => {
        try {
            const response = await customFetch("http://localhost:18080/user_files", {
                method: "POST",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    'file_fields': ["path", "content_type", "size", "name", "extension", "favourite", "created", "modified"], 
                    'folder_fields': ["path", "type", "size", "name", "color", "favourite", "created", "modified"]
                })
            })
            const data = await response.json()
            
            if (data.status === "success" && data.message !== "not found") {
                setFiles(data.files || [])
                setFolders(data.folders || [])
            }
        } catch (error) {
            console.error("Error fetching files:", error)
        } finally {
            setIsLoading(false)
        }
    };

    useEffect(() => {
        if (localStorage.getItem("isLogged") === "true") fetchFiles()
        else setIsLoading(false)
    }, [])

    return (
        <FileContext.Provider value={
            { files, folders, isLoading, searchQuery, sentBy,
                setSearchQuery, setSentBy, refreshFiles: fetchFiles 
            }}>
            {children}
        </FileContext.Provider>
    );
};