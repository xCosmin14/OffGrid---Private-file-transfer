import MockUserImg from "../assets/MockUserImg.jpg"
import "./Notifications.css"

export default function TextNotification(props) {
    return (
        <div className="notification">
            <img src={MockUserImg} onClick={() => window.location.href = '/'} alt="User avatar" />

            <div id="notifBody">
                <h4>
                    <span id="highlight" onClick={() => window.location.href = '/'}>{props.sender}</span> 
                    {props.actionType == 0 && ` deleted file ${props.fileName || ''} from your common folder `}
                    {props.folderName && <span id="highlight">{props.folderName}</span>}
                </h4>
                
                <h5>{props.sent}</h5>
                <div id="buttons">
                    <button onClick={() => props.onDelete(props.id)}>Delete</button>
                </div>
            </div>
        </div>
    )
}