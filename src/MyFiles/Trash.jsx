import {useTitle} from "../UseTitle.js"

import Filters from "./Filters.jsx"

import "./MyFiles.css";

export default function Trash() {
    useTitle("Trash")

    return (
        <div className="page">
            <Filters />
        </div>
    );
}