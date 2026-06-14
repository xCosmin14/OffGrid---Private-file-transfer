import {Link} from 'react-router-dom'

import MockUserImg from "../assets/MockUserImg.jpg"

import "./Notifications.css"

export default function TextNotification(props) {
    //de inlocuit cu props
    return (
        <div className="notification">
            <img src={MockUserImg} onClick={() => window.location.href = '/'}/>

            <div id="notifBody">
                <div id="plainText">
                    <h4>
                        <span id="highlight" onClick={() => window.location.href = '/'}>Nume Prenume</span> 
                        {props.actionType == 0 && " deleted file ... from your common folder "}
                        {props.actionType == 0 && <span id="highlight">...</span>}
                        
                        {props.actionType == 1 && " accepted your friend request"}

                        {props.actionType == 2 && " created an account using your invite code"}
                    </h4>
                    <h6>6.6.2026</h6>
                </div>
            </div>
        </div>
    )
}