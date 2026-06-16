import {useTitle} from "../UseTitle.js"

import AddFile from "../MyFiles/AddFile.jsx"
import Filters from "../MyFiles/Filters.jsx"

import "./PhotoAlbum.css"

export default function PhotoAlbum() {
    useTitle("Photo album")

    return (
        <div className="page">
            <AddFile supports="visual"/>
            <Filters />
        </div>
    );
}