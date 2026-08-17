import { useState, useEffect, useRef, lazy } from "react"
import { parseBlob } from "music-metadata"

import NoVolume from "../assets/SVG/NoVolume.svg?react"
import Volume from "../assets/SVG/Volume.svg?react"
import PauseButton from "../assets/SVG/PauseButton.svg?react"
import PlayButton from "../assets/SVG/PlayButton.svg?react"
import SkipBackward from "../assets/SVG/SkipBackward.svg?react"
import SkipForward from "../assets/SVG/SkipForward.svg?react"

import mockAudioImg from "../assets/MockAudioImg.jpg"

export default function AudioPlayer(props) {
    const audioRef = useRef(null)
    const [metadata, setMetadata] = useState(null)

    const [coverUrl, setCoverUrl] = useState(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [isDragging, setIsDragging] = useState(false)

    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(0)
    const [sampleRate, setSampleRate] = useState(0)
    const [channelNumber, setChannelNumber] = useState("Stereo")

    useEffect(() => {
        if (!props.fileBlob) return

        let cancelled = false, createdCoverUrl = null

        setMetadata(null)
        setCoverUrl(null)

        const extractMetadata = async () => {
            try {
                const parsedMetadata = await parseBlob(props.fileBlob, {
                    fileInfo: { path: props.file?.name } 
                })

                if (cancelled) return
                setMetadata(parsedMetadata)

                if (parsedMetadata.format?.duration) {
                    setDuration(parsedMetadata.format.duration)
                    
                    if (parsedMetadata.format.numberOfChannels === 6) setChannelNumber("5.1")
                    else if (parsedMetadata.format.numberOfChannels === 8) setChannelNumber("7.1")

                    setSampleRate(parsedMetadata.format.sampleRate / 1000)
                }
            

                const pictures = parsedMetadata.common.picture
                if (pictures && pictures.length > 0) {
                    const mainPicture = pictures[0]
                    const imgBlob = new Blob([mainPicture.data], { type: mainPicture.format })
                    createdCoverUrl = URL.createObjectURL(imgBlob)

                    if (cancelled) {
                        URL.revokeObjectURL(createdCoverUrl)
                        return
                    }

                    setCoverUrl(createdCoverUrl)
                }
            } catch (err) {}
        }

        extractMetadata()

        return () => {
            cancelled = true
            if (createdCoverUrl) URL.revokeObjectURL(createdCoverUrl)
        }
    }, [props.fileBlob, props.file?.name])

    const togglePlay = () => {
        if (!audioRef.current) return

        if (isPlaying) audioRef.current.pause()
        else audioRef.current.play().catch(() => {})

        setIsPlaying(!isPlaying)
    }

    const skip = (seconds) => {
        if (audioRef.current) audioRef.current.currentTime += seconds
    }

    const handleSeekChange = (e) => {
        setCurrentTime(Number(e.target.value))
    }

    const handleSeekCommit = (e) => {
        if (audioRef.current)
            audioRef.current.currentTime = Number(e.target.value)
        setIsDragging(false)
    }

    const handleTimeUpdate = () => {
        if (audioRef.current && !isDragging)
            setCurrentTime(audioRef.current.currentTime)
    }

    const handleLoadedMetadata = () => {
        if (audioRef.current) {
            const dur = audioRef.current.duration
            if (!isNaN(dur) && dur !== Infinity) setDuration(dur)
        }
    }

    const formatBitrate = (bitrate) => {
        if (!bitrate) return "N/A"

        const kbps = bitrate / 1000 

        if (kbps < 1000) return `${Math.round(kbps)} kb/s`
        else {
            const mbps = kbps / 1000
            return `${mbps.toFixed(2)} Mb/s`
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
                <audio
                    ref={audioRef}
                    src={props.fileContent}
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    onEnded={() => setIsPlaying(false)}
                />

                {<img src={coverUrl ? coverUrl : mockAudioImg}/>}

                <div>
                    <h2>{metadata?.common?.title || props?.file?.name || "Unknown name"}</h2>
                    <h3>{metadata?.common?.artist || "Unknown artist"}</h3>
                </div>

                <div id="audioControls">
                    <SkipBackward onClick={() => skip(-10)}/>
                    {isPlaying ? <PauseButton onClick={togglePlay} id="audioPlayBtn"/> : <PlayButton onClick={togglePlay} id="audioPlayBtn"/>}
                    <SkipForward onClick={() => skip(10)}/>
                </div>

                <div className="progressContainer">
                    <span className="timeDisplay">{formatTime(currentTime)}</span>
                    <input id="audioProgress"
                        type="range" step="any"
                        min="0" max={duration > 0 ? duration : 100}
                        value={currentTime}
                        style={{ "--progress": `${progressPercent}%` }}
                        onMouseUp={handleSeekCommit} onMouseDown={() => setIsDragging(true)}
                        onTouchStart={() => setIsDragging(true)} onTouchEnd={handleSeekCommit}
                        onChange={handleSeekChange}
                    />
                    <span className="timeDisplay">{formatTime(duration)}</span>
                </div>
            </div>
            
            {props.viewerSize === "full" && metadata && (
                <div className="audioMetadata">
                    <h1>Audio information</h1>

                    {metadata?.common?.title && <p>Title: <b>{metadata.common.title}</b></p>}
                    {metadata?.common?.artist && <p>Artists: <b>{metadata.common.artist}</b></p>}
                    {metadata?.common?.album && <p>Album: <b>{metadata.common.album}</b></p>}
                    {metadata?.common?.date && <p>Release date: <b>{metadata.common.date}</b></p>}
                    
                    <p>Format: <b>{metadata?.format?.codec || "Unknown"}</b></p>
                    <p>Sample rate: <b>{sampleRate} kHz</b></p>
                    <p>Bits per sample: <b>{metadata?.format?.bitsPerSample || "N/A"}</b></p>
                    <p>Bitrate: <b>{formatBitrate(metadata?.format?.bitrate)}</b></p>
                    <p>Duration: <b>{formatTime(metadata?.format?.duration)}</b></p>                
                    <p>Channels: <b>{channelNumber}</b></p>
                </div>
            )}
        </div>
    )
}