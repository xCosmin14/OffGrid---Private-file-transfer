import {useTitle} from "../UseTitle.js"

import Filters from "../MyFiles/Filters.jsx"

import "./PhotoAlbum.css";

export default function PhotoAlbum() {
    useTitle("Photo album")

    return (
        <div className="page">
            <Filters />
        </div>
    );
}