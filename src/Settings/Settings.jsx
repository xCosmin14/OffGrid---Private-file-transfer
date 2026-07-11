import { useState, useRef, useEffect } from "react"

import { useProfilePhoto } from "../GetPFP.js"
import { useTitle } from "../UseTitle.js"

import "./Settings.css"

export default function Settings() {
    useTitle("Settings - OffGrid")

    const [colors, setColors] = useState({
        light: {
            bgCol: "#f2effb",
            menuBgCol: "#ffffff",
            text: "#231e3d",
            hoverCol: "#3cbff3",
            boxShadowCol: "#2e2d2d",
            boxBgCol: "#ffffff"
        },
        dark: {
            bgCol: "#352f44",
            menuBgCol: "#655d7a",
            text: "#ffffff",
            hoverCol: "#3cf38f",
            boxShadowCol: "#f0f0f0",
            boxBgCol: "#dbdbdb"
        }
    })

    const [username, setUsername] = useState("User123")
    const [confirmPasswordForUser, setConfirmPasswordForUser] = useState("")
    
    const [currentPassword, setCurrentPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")

    const [uError, setuError] = useState(null)
    const [pError, setpError] = useState(null)
    
    const initialAvatar = useProfilePhoto()
    const [avatar, setAvatar] = useState(initialAvatar)

    useEffect(() => {
        if (initialAvatar) {
            setAvatar(initialAvatar)
        }
    }, [initialAvatar])

    useEffect(() => {
        if (uError) {
            const timer = setTimeout(() => {
                setuError(null)
            }, 5000)

            return () => clearTimeout(timer) 
        }
    }, [uError])

    useEffect(() => {
        if (pError) {
            const timer = setTimeout(() => {
                setpError(null)
            }, 5000)

            return () => clearTimeout(timer) 
        }
    }, [pError])

    const fileInputRef = useRef(null)

    const handleColorChange = (mode, key, value) => {
        setColors(prev => ({
            ...prev,
            [mode]: {
                ...prev[mode],
                [key]: value
            }
        }))
    }

    const handleAvatarChange = async (e) => {
        const file = e.target.files[0]
        if (!file) return

        let formData = new FormData()
        formData.append('photo', file, file.name)

        try {
            let response = await fetch("http://localhost:18080/upload_photo", {
                method: 'POST',
                credentials: 'include',
                body: formData
            })

            if (response.ok) {
                let data = await response.json()    
                window.dispatchEvent(new Event('avatar-updated'))
            } else console.error("Server denied upload.")
            
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
            let response = await fetch("http://localhost:18080/change_username", {
                method: 'PATCH',
                credentials: 'include',
                headers: {
                    'Content-Type': "application/json"
                },
                body: JSON.stringify(payload)
            })

            let data = await response.json()
            setuError(data.message)
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
            let response = await fetch("http://localhost:18080/change_password", {
                method: 'PATCH',
                credentials: 'include',
                headers: {
                    'Content-Type': "application/json"
                },
                body: JSON.stringify(payload)
            })

            let data = await response.json()
            setpError(data.message)
        } catch (error) {

        }
    }
    const logOut = () => {
        let response = fetch("http://localhost:18080/log_out", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        })
        localStorage.setItem("isLogged", "false")
        location.reload()
        return
    }

    const colorOptions = [
        { key: "bgCol", label: "Page background", cssVar: "--bgCol" },
        { key: "menuBgCol", label: "Menu background", cssVar: "--menuBgCol" },
        { key: "text", label: "Text", cssVar: "--text" },
        { key: "hoverCol", label: "Accent color", cssVar: "--hoverCol" },
        { key: "boxShadowCol", label: "Box shadow", cssVar: "--boxShadowCol" },
        { key: "boxBgCol", label: "Transparency effect", cssVar: "--boxBgCol" }
    ]

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
                                            value={colors.light[option.key]} 
                                            onChange={(e) => handleColorChange("light", option.key, e.target.value)} 
                                            title="Light Mode"
                                        />

                                        <input 
                                            type="color" 
                                            value={colors.dark[option.key]} 
                                            onChange={(e) => handleColorChange("dark", option.key, e.target.value)} 
                                            title="Dark Mode"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="settingsActionButtons">
                        <button className="settingsBtn primary">Save theme</button>
                        <button className="settingsBtn danger" onClick = {() => logOut()}>Log out</button>
                    </div>
                </div>

                <div className="settingsCard flex-column">
                    <div>
                        <h3>Profile</h3>
                        
                        <div className="avatarSection">
                            <div className="avatarWrapper" onClick={() => fileInputRef.current.click()}>
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

                            {(pError != null) && <h3 id="settingsError">{pError}</h3>}
                            <button className="settingsBtn" onClick={handleChangePassword}>Change password</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}