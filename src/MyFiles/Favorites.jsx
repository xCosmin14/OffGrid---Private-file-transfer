import {useTitle} from "../UseTitle.js"

import Filters from "./Filters.jsx"

import "./MyFiles.css";

export default function Favorites() {
    useTitle("Favorites")

    return (
        <div className="page">
            <Filters />
        </div>
    );
}