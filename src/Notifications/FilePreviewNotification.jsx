import NotifFilePreview from './NotifFilePreview.jsx'
import "./Notifications.css"

export default function FilePreviewNotification(props) {
    const deleteNotification = async () => {
        const socket = new WebSocket(`ws://${key}:18080`)
        socket.send(JSON.stringify({type: "answer_notification", notification_id: props.key, response: "decline"}))
    }

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
                    <button onClick={() => deleteNotification()}>Delete</button>
                </div>
            </div>
        </div>
    )
}