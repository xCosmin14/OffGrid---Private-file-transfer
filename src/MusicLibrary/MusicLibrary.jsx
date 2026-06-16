import {useTitle} from "../UseTitle.js"

import AddFile from "../MyFiles/AddFile.jsx";
import Filters from "../MyFiles/Filters.jsx"

import "./MusicLibrary.css";

export default function MusicLibrary() {
    useTitle("Music library")

    return (
        <div className="page">
            <AddFile supports="music"/>
            <Filters />
        </div>
    );
}