import { useState, useRef } from "react"

import PauseButton from "../assets/SVG/PauseButton.svg?react"
import PlayButton from "../assets/SVG/PlayButton.svg?react"
import SkipBackward from "../assets/SVG/SkipBackward.svg?react"
import SkipForward from "../assets/SVG/SkipForward.svg?react"

export default function VideoPlayer(props) {
    const videoRef = useRef(null)

    const [isPlaying, setIsPlaying] = useState(false)
    const [isDragging, setIsDragging] = useState(false)

    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(0)

    const togglePlay = () => {
        if (!videoRef.current) return

        if (isPlaying) videoRef.current.pause()
        else videoRef.current.play().catch(() => {})

        setIsPlaying(!isPlaying)
    }

    const skip = (seconds) => {
        if (videoRef.current) videoRef.current.currentTime += seconds
    }

    const handleSeekChange = (e) => {
        setCurrentTime(Number(e.target.value))
    }

    const handleSeekCommit = (e) => {
        if (videoRef.current)
            videoRef.current.currentTime = Number(e.target.value)
        setIsDragging(false)
    }

    const handleTimeUpdate = () => {
        if (videoRef.current && !isDragging)
            setCurrentTime(videoRef.current.currentTime)
    }

    const handleLoadedMetadata = () => {
        if (videoRef.current) {
            const dur = videoRef.current.duration
            if (!isNaN(dur) && dur !== Infinity) setDuration(dur)
        }
    }

    const formatTime = (timeInSeconds) => {
        if (!timeInSeconds || isNaN(timeInSeconds)) return "0:00"
        const minutes = Math.floor(timeInSeconds / 60)
        const seconds = Math.floor(timeInSeconds % 60)
        return `${minutes}:${String(seconds).padStart(2, '0')}`
    }

    const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0

    return (
        <div className="audioPlayer">
            <div className="mainAudio">
                {props.fileContent && (
                    <video
                        ref={videoRef}
                        src={props.fileContent}
                        onTimeUpdate={handleTimeUpdate}
                        onLoadedMetadata={handleLoadedMetadata}
                        onEnded={() => setIsPlaying(false)}
                        onClick={togglePlay}
                    />
                )}

                <div id="audioControls">
                    <SkipBackward onClick={() => skip(-10)} />
                    {isPlaying ? (
                        <PauseButton onClick={togglePlay} id="audioPlayBtn" />
                    ) : (
                        <PlayButton onClick={togglePlay} id="audioPlayBtn" />
                    )}
                    <SkipForward onClick={() => skip(10)} />
                </div>

                <div className="progressContainer">
                    <span className="timeDisplay">{formatTime(currentTime)}</span>
                    <input 
                        id="audioProgress"
                        type="range" 
                        step="any"
                        min="0" 
                        max={duration > 0 ? duration : 100}
                        value={currentTime}
                        style={{ "--progress": `${progressPercent}%` }}
                        onMouseUp={handleSeekCommit} 
                        onMouseDown={() => setIsDragging(true)}
                        onTouchStart={() => setIsDragging(true)} 
                        onTouchEnd={handleSeekCommit}
                        onChange={handleSeekChange}
                    />
                    <span className="timeDisplay">{formatTime(duration)}</span>
                </div>
            </div>
        </div>
    )
}