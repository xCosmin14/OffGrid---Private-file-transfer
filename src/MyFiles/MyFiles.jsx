import {useTitle} from "../UseTitle.js"

import Filters from "./Filters.jsx"

import "./MyFiles.css";

export default function MyFiles() {
    useTitle("OffGrid - Private file transfer")

    return (
        <div className="page">
            <Filters />
        </div>
    );
}