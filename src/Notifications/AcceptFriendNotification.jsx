import {Link} from 'react-router-dom'

import MockUserImg from "../assets/MockUserImg.jpg"

import "./Notifications.css"

export default function AcceptFriendNotification(props) {
    //de inlocuit cu props
    return (
        <div className="notification">
            <img src={MockUserImg} onClick={() => window.location.href = '/'}/>

            <div id="notifBody">
                <div id="plainText">
                    <h4>
                        <span id="highlight" onClick={() => window.location.href = '/'}>Nume Prenume</span> sent a friend request
                    </h4>
                    <h6>6.6.2026</h6>
                </div>

                <div id="buttons">
                    <button>Accept</button>
                    <button>Delete</button>
                </div>
            </div>
        </div>
    )
}