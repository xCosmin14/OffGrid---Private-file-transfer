import NotifFilePreview from './NotifFilePreview.jsx'
import "./Notifications.css"

export default function InviteNotification(props) {
    return (
        <div className="notification">
            <div id="notifBody">
                <h4>
                    <span id="highlight" onClick={() => window.location.href = '/'}>{props.sender}</span> invited you in their shared folder
                </h4>

                <NotifFilePreview fileType="folder" fileName={props.folderName} />
                
                <h5>{props.sent}</h5>

                <div id="buttons">
                    <button>Delete</button>
                </div>
            </div>
        </div>
    )
}