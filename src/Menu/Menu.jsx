import { useLocation, Link } from 'react-router-dom'

import Documents from "../assets/SVG/FileIcons/Documents.svg?react"
import Folder from "../assets/SVG/FileIcons/Folder.svg?react"
import MusicLibrary from "../assets/SVG/FileIcons/MusicLibrary.svg?react"
import MyFiles from "../assets/SVG/FileIcons/MyFiles.svg?react"
import PhotoAlbum from "../assets/SVG/FileIcons/PhotoAlbum.svg?react"
import UserFiles from "../assets/SVG/FileIcons/UserFiles.svg?react"
import StarFull from "../assets/SVG/StarFull.svg?react"
import Trash from "../assets/SVG/FileIcons/Trash.svg?react"

import "./Menu.css"

export default function Menu() {
    const { pathname } = useLocation()

    return (
        <div className="menu">
            <span></span>

            <div className={`menu-item ${pathname === "/" ? "active" : ""}`}>
                <MyFiles />
                <Link to="/">My Files</Link>
            </div>

            <div className={`menu-item ${pathname === "/myfiles/shared" ? "active" : ""}`} id="transparentSVG">
                <UserFiles />
                <Link to="/myfiles/shared">Shared files</Link>
            </div>

            <div className={`menu-item ${pathname === "/myfiles/favorites" ? "active" : ""}`} id="transparentSVG">
                <StarFull />
                <Link to="/myfiles/favorites">Favorites</Link>
            </div>

            <span></span>

            <div className={`menu-item ${pathname === "/myfiles/documents" ? "active" : ""}`} id="transparentSVG">
                <Documents />
                <Link to="/myfiles/documents">Documents</Link>
            </div>

            <div className={`menu-item ${pathname === "/myfiles/music" ? "active" : ""}`} id="transparentSVG">
                <MusicLibrary />
                <Link to="/myfiles/music">Music</Link>
            </div>

            <div className={`menu-item ${pathname === "/myfiles/photos" ? "active" : ""}`} id="transparentSVG">
                <PhotoAlbum />
                <Link to="/myfiles/photos">Photos</Link>
            </div>

            <span></span>

            <div className={`menu-item ${pathname === "/myfiles/trash" ? "active" : ""}`} id="bigSVG">
                <Trash />
                <Link to="/myfiles/trash">Trash</Link>
            </div>
        </div>
    )
}