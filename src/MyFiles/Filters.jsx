import { useState, useEffect, useContext } from "react"
import { useLocation } from "react-router-dom"

import { FileContext } from "../GetFiles.jsx"
import isMobile from "../IsMobile.js"

import "../Header/Header.css"

export default function Filters( {onFilterChange} ) {
    const { pathname } = useLocation()

    const { files, folders, isLoading, refreshFiles } = useContext(FileContext)
    let extensions = []

    if (folders) extensions.push("Folder")
    !isLoading && files.forEach(file => {
        if (file.extension && !extensions.includes(file.extension)) extensions.push(file.extension)
    })

    const [localFilters, setLocalFilters] = useState({
        dateFilterLowerBound: "",
        dateFilterUpperBound: "",
        sizeFilterLowerBound: "",
        sizeFilterUpperBound: "",
        extensionFilter: "",
        sentBy: ""
    })

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setLocalFilters(prev => ({
            ...prev,
            [name]: value
        }))
    }

    useEffect(() => {
        if (!onFilterChange) return

        const delayDebounceFn = setTimeout(() => {
            onFilterChange(localFilters)
        }, 400)

        return () => clearTimeout(delayDebounceFn)
    }, [localFilters, onFilterChange])

    return (
        <div id="fileSearchFilters">
            <div className="parameterSearch">
                <h2>Date</h2>
                
                <div id="boundedInputs">
                    <h3>from:</h3>
                    <input type="date" name="dateFilterLowerBound"
                        value={localFilters.dateFilterLowerBound}
                        onChange={handleInputChange}
                    />

                    <h3>to:</h3>
                    <input type="date" name="dateFilterUpperBound"
                        value={localFilters.dateFilterUpperBound}
                        onChange={handleInputChange}
                    />
                </div>
            </div>

            {isMobile() == 0 && <div id="filterBar"></div>}

            <div className="parameterSearch">
                <h2>Size (MB)</h2>
                
                <div id="boundedInputs">
                    <h3>from:</h3>
                    <input type="number" name="sizeFilterLowerBound"
                        value={localFilters.sizeFilterLowerBound}
                        pattern="[0-9]+"
                        onChange={handleInputChange}
                        onBeforeInput={(e) => {
                            if (!/[0-9]/.test(e.data)) {
                                e.preventDefault()
                            }
                        }} 
                    />

                    <h3>to:</h3>
                    <input type="number" name="sizeFilterUpperBound"
                        value={localFilters.sizeFilterUpperBound}
                        pattern="[0-9]+"
                        onChange={handleInputChange}
                        onBeforeInput={(e) => {
                            if (!/[0-9]/.test(e.data)) {
                                e.preventDefault()
                            }
                        }} 
                    />
                </div>
            </div>

            {isMobile() == 0 && <div id="filterBar"></div>}

            <div className="parameterSearch">
                <h2>Extension:</h2>

                <select name="extensionFilter"
                    value={localFilters.extensionFilter}
                    onChange={handleInputChange}
                >
                    <option value="">All</option>
                    {extensions.map((ext) => (
                        <option key={ext} value={ext}>{ext}</option>
                    ))}
                </select>
            </div>

            {
                (pathname.includes("shared") || pathname.includes("favorites") || pathname.includes("trash")) &&
                <div className="parameterSearch">
                    <h2>Sent by:</h2>

                    <input type="text" name="sentBy" placeholder="User name"
                        value={localFilters.sentBy}
                        onChange={handleInputChange}
                    />
                </div>
            }
        </div>
    )
}