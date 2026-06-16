import {useTitle} from "../UseTitle.js"

import AddFile from "./AddFile.jsx";
import Filters from "./Filters.jsx"

import "./MyFiles.css";

export default function Trash() {
    useTitle("Trash")

    return (
        <div className="page">
            <AddFile />
            <Filters />
        </div>
    );
}