import {Link} from 'react-router-dom'

import NotifFilePreview from './NotifFilePreview'

import MockUserImg from "../assets/MockUserImg.jpg"

import "./Notifications.css"

export default function FilePreviewNotification(props) {
    //de inlocuit cu props
    return (
        <div className="notification">
            <img src={MockUserImg} onClick={() => window.location.href = '/'}/>

            <div id="notifBody">
                <div id="plainText">
                    <h4>
                        <span id="highlight" onClick={() => window.location.href = '/'}>Nume Prenume</span> 
                        {props.actionType == 0 ? " uploaded a file in FOLDER" : "Sent a file/folder"}
                    </h4>
                    <h6>6.6.2026</h6>
                </div>

                <NotifFilePreview fileType={props.fileType} />
            </div>
        </div>
    )
}