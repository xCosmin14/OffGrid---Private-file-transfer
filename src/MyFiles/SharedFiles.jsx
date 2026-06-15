import {useTitle} from "../UseTitle.js"

import Filters from "./Filters.jsx"

import "./MyFiles.css";

export default function SharedFiles() {
    useTitle("Shared files")

    return (
        <div className="page">
            <Filters />
        </div>
    );
}