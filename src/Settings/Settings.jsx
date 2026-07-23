import { useState, useRef, useEffect, useContext } from "react"
import { UserContext } from '../UserContext.jsx' 
import { useTitle } from "../UseTitle.js" 
import { customFetch } from '../UserContext.jsx'

import "./Settings.css" 

const parseColor = (colorStr) => {
    if (!colorStr) return { hex: "#ffffff", alpha: 1 }
    
    if (colorStr.startsWith("rgba")) {
        const match = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/)
        if (match) {
            const r = parseInt(match[1]).toString(16).padStart(2, '0')
            const g = parseInt(match[2]).toString(16).padStart(2, '0')
            const b = parseInt(match[3]).toString(16).padStart(2, '0')
            const alpha = match[4] !== undefined ? parseFloat(match[4]) : 1
            return { hex: `#${r}${g}${b}`, alpha }
        }
    }
    return { hex: colorStr, alpha: 1 }
}

const formatColor = (hex, alpha) => {
    if (alpha >= 1) return hex
    let c = hex.replace('#', '')
    if (c.length === 3) c = c.split('').map(x => x + x).join('')
    const r = parseInt(c.substring(0, 2), 16)
    const g = parseInt(c.substring(2, 4), 16)
    const b = parseInt(c.substring(4, 6), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export default function Settings() {
    const { user, avatar, refreshData } = useContext(UserContext)
    useTitle("Settings - OffGrid") 

    const [colors, setColors] = useState(null) 

    const [username, setUsername] = useState("")
    const [confirmPasswordForUser, setConfirmPasswordForUser] = useState("") 
    
    const [currentPassword, setCurrentPassword] = useState("") 
    const [newPassword, setNewPassword] = useState("") 

    const [uError, setuError] = useState(null) 
    const [pError, setpError] = useState(null) 

    useEffect(() => {
        if (user?.username) setUsername(user.username)
        
        if (user?.preferences) {
            const parsedPrefs = typeof user.preferences === 'string' 
                ? JSON.parse(user.preferences) : user.preferences

            if (parsedPrefs?.light && parsedPrefs?.dark) 
                setColors({
                    light: { ...parsedPrefs.light },
                    dark: { ...parsedPrefs.dark }
                })
        }
    }, [user])

    useEffect(() => {
        if (uError) {
            const timer = setTimeout(() => setuError(null), 5000)
            return () => clearTimeout(timer) 
        }
    }, [uError]) 

    useEffect(() => {
        if (pError) {
            const timer = setTimeout(() => setpError(null), 5000)
            return () => clearTimeout(timer) 
        }
    }, [pError]) 

    const fileInputRef = useRef(null) 

    const handleColorChange = (mode, key, newHex) => {
        const currentAlpha = parseColor(colors[mode][key]).alpha;
        const colorWithAlpha = formatColor(newHex, currentAlpha);

        setColors(prev => ({
            ...prev,
            [mode]: {
                ...prev[mode],
                [key]: colorWithAlpha
            }
        }))
    }

    const saveColors = async () => {
        const response = await customFetch(`http://localhost:18080/change_data`, {
            method: "PATCH",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ preferences: colors })
        })
        if (response.ok) refreshData()
    }

    const handleAvatarChange = async (e) => {
        const file = e.target.files[0] 
        if (!file) return 

        let formData = new FormData() 
        formData.append('photo', file, file.name) 

        try {
            const response = await customFetch("http://localhost:18080/upload_photo", {
                method: 'POST',
                credentials: 'include',
                body: formData
            }) 

            if (response.ok) refreshData() 
        } catch (error) {}
    }

    const handleUpdateUsername = async () => {
        if (!username || !confirmPasswordForUser) {
            setuError("Please fill in all fields.")
            return
        } 
        
        const payload = {
            username: username,
            password: confirmPasswordForUser 
        } 

        try {
            const response = await customFetch("http://localhost:18080/change_username", {
                method: 'PATCH',
                headers: { 'Content-Type': "application/json" },
                body: JSON.stringify(payload)
            })

            let data = await response.json() 
            setuError(data.message) 
            if (response.ok) refreshData() 
        } catch (error) {}
    } 

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword) {
            setpError("Please fill in the fields.")
            return
        } 

        const payload = {
            current_password: currentPassword,
            new_password: newPassword
        } 

        try {
            const response = await customFetch("http://localhost:18080/change_password", {
                method: 'PATCH',
                headers: { 'Content-Type': "application/json" },
                body: JSON.stringify(payload)
            })

            let data = await response.json() 
            setpError(data.message)
            if (response.ok) {
                setCurrentPassword("") 
                NewPassword("") 
            }
        } catch (error) {}
    } 
    
    const logOut = async () => {
        await customFetch("http://localhost:18080/log_out", {
            method: 'POST',
            headers: { 'Content-Type': "application/json" },
            keepalive: true,
            credentials: 'include'
        })
        localStorage.setItem("isLogged", "false") 
        location.reload() 
    } 

    const colorOptions = [
        { key: "bgCol", label: "Page background", cssVar: "--bgCol" },
        { key: "menuBgCol", label: "Menu background", cssVar: "--menuBgCol" },
        { key: "text", label: "Text", cssVar: "--text" },
        { key: "hoverCol", label: "Accent color", cssVar: "--hoverCol" },
        { key: "boxShadowCol", label: "Box shadow", cssVar: "--boxShadowCol" },
        { key: "boxBgCol", label: "Transparency effect", cssVar: "--boxBgCol" }
    ] 

    if (!user || !colors) 
        return <div className="page" id="settingsPage">Loading settings...</div>

    return (
        <div className="page" id="settingsPage">
            <h2>Settings</h2>

            <div className="settingsGrid">
                <div className="settingsCard flex-column">
                    <div>
                        <h3>Aspect and colors</h3>

                        <div className="colorPickersHeader">
                            <span className="emptySpace"></span>
                            <div className="modeLabels">
                                <span>Light</span>
                                <span>Dark</span>
                            </div>
                        </div>

                        <div className="colorPickersList">
                            {colorOptions.map(option => (
                                <div className="colorRow" key={option.key}>
                                    <div className="colorInfo">
                                        <label>{option.label}</label>
                                        <span>{option.cssVar}</span>
                                    </div>

                                    <div className="colorPickers">
                                        <input 
                                            type="color" 
                                            value={parseColor(colors.light[option.key]).hex} 
                                            onChange={(e) => handleColorChange("light", option.key, e.target.value)} 
                                            title="Light Mode"
                                        />
                                        <input 
                                            type="color" 
                                            value={parseColor(colors.dark[option.key]).hex} 
                                            onChange={(e) => handleColorChange("dark", option.key, e.target.value)} 
                                            title="Dark Mode"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="settingsActionButtons">
                        <button className="settingsBtn primary" onClick={saveColors}>Save theme</button>
                        <button className="settingsBtn danger" onClick={logOut}>Log out</button>
                    </div>
                </div>

                <div className="settingsCard flex-column">
                    <div>
                        <h3>Profile - {username}</h3>
                        
                        <div className="avatarSection">
                            <div className="avatarWrapper" onClick={() => fileInputRef.current?.click()}>
                                {avatar ? <img src={avatar} alt="Avatar" /> : <div className="avatarPlaceholder">+</div>}
                            </div>

                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                style={{ display: "none" }} 
                                accept="image/*" 
                                onChange={handleAvatarChange} 
                            />

                            <span className="avatarLabel">Change profile picture</span>
                        </div>

                        <div className="settingsForm">
                            <div className="inputGroup">
                                <label>New username</label>
                                <input 
                                    type="text" 
                                    value={username} 
                                    onChange={(e) => setUsername(e.target.value)} 
                                />
                            </div>

                            <div className="inputGroup">
                                <label>Type the password to confirm</label>
                                <input 
                                    type="password" 
                                    placeholder="Current password" 
                                    value={confirmPasswordForUser}
                                    onChange={(e) => setConfirmPasswordForUser(e.target.value)}
                                />
                            </div>

                            <button className="settingsBtn" onClick={handleUpdateUsername}>Update username</button>
                            {(uError != null) && <h3 id="settingsError">{uError}</h3>}
                        </div>

                        <hr className="settingsDivider" />

                        <div className="settingsForm">
                            <div className="inputGroup">
                                <label>Current password</label>
                                <input 
                                    type="password" 
                                    placeholder="••••••••" 
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                />
                            </div>

                            <div className="inputGroup">
                                <label>New password</label>
                                <input 
                                    type="password" 
                                    placeholder="••••••••" 
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                />
                            </div>

                            <button className="settingsBtn" onClick={handleChangePassword}>Change password</button>
                            {(pError != null) && <h3 id="settingsError">{pError}</h3>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}