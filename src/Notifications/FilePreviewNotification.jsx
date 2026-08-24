import NotifFilePreview from './NotifFilePreview.jsx'
import "./Notifications.css"

export default function FilePreviewNotification(props) {
    return (
        <div className="notification">
            <div id="notifBody">
                <h4>
                    <span id="highlight" onClick={() => window.location.href = '/'}>{props.senderId}</span> 
                    {props.actionType == 0 ? " uploaded a file in folder" : " sent a file/folder"}
                </h4>
                
                <NotifFilePreview fileType={props.fileType} fileName={props.fileName} />
                
                <h5>{props.sent}</h5>
                <div id="buttons">
                    <button onClick={() => props.onDelete(props.id)}>Delete</button>
                </div>
            </div>
        </div>
    )
}