import {useTitle} from "../UseTitle.js"

import Filters from "../MyFiles/Filters.jsx"

import "./MusicLibrary.css";

export default function MusicLibrary() {
    useTitle("Music library")

    return (
        <div className="page">
            <Filters />
        </div>
    );
}