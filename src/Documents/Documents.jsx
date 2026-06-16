import AddFile from "../MyFiles/AddFile.jsx"
import Filters from "../MyFiles/Filters.jsx"

import "./Documents.css"

export default function Documents() {
  document.title = "Documents"

  return (
    <div className="page">
        <AddFile supports="documents" />
        <Filters />
    </div>
  )
}