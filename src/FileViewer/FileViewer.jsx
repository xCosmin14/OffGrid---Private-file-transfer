import {useState} from "react"

import Add from "../assets/SVG/FileIcons/Add.svg?react"
import Enlarge from "../assets/SVG/Enlarge.svg?react"
import Shrink from "../assets/SVG/Shrink.svg?react"

import "./FileViewers.css"

export default function FileViewer(props) {
    const [size, setSize] = useState("small")

    return (
        <div className="fileViewer" id={size}>
            <div id="windowActions">
                {size != "full" ? 
                    <Enlarge onClick = {() => {setSize("full")}}/> : 
                    <Shrink onClick = {() => {setSize("small")}}/>}
                <Add id="closeFileViewer" onClick = {() => {
                    if (size != "closed") {
                        props.onExit()
                        setSize("closed")
                    } else setSize("small")
                }}/>
            </div>
            <h1 id="fileTitle">{props.file.name}</h1>
        </div>
    )
}