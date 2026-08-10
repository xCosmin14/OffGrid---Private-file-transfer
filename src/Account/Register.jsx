import { useState } from "react"
import { Link } from "react-router-dom"
import { useTitle } from "../UseTitle.js"

import Email from "../assets/SVG/UserIcons/Email.svg?react"
import Password from "../assets/SVG/UserIcons/Password.svg?react"
import User from "../assets/SVG/UserIcons/UserIcon.svg?react"
import Group from "../assets/SVG/UserIcons/Group.svg?react"
import EyeShow from "../assets/SVG/EyeShow.svg?react"
import EyeHide from "../assets/SVG/EyeHide.svg?react"

import "./Account.css"

export default function Register() {
    const [showPass, setShowPass] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    
    const [showError, setShowError] = useState("")

    const handleSubmit = async (e) => {
        e.preventDefault();

        const formData = new FormData(e.currentTarget)

        formData.set("username", formData.get("username").replace(/['`"/{};?,#$%^&*()]+/g, ''))
        formData.set("email", formData.get("email").replace(/['`"/{};?,#$%^&*()]+/g, ''))
        formData.set("password", formData.get("password").replace(/['`"<>]+/g, ''))
        formData.set("confirmPassword", formData.get("confirmPassword").replace(/['`"<>]+/g, ''))
        
        if (formData.get("password") !== formData.get("confirmPassword")) {
            setShowError("password mismatch")
            return
        }
        
        setShowError("")
        formData.delete("confirmPassword")

        const dataObject = Object.fromEntries(formData.entries())

        try {
            let response = await fetch("http://localhost:18080/register", {
                method: "POST",
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(dataObject)
            })

            let data = await response.json()
            
            if (!response.ok || data.status === "error") {
                 setShowError(data.message) 
                 return
            }
            setShowError(null)
        } catch (error) {
            setShowError(error.message)
        }
    }

    useTitle("OffGrid - Register")

    return (
        <div className="page centered">
            <form method="post" className="accountForm" onSubmit={handleSubmit}>
                <h1>Create an account</h1>

                <div id="accountFormField">
                    <input type="text" name="username" placeholder="Username" 
                        pattern="[a-zA-Z0-9]+" required
                        onChange={() => setShowError("")}
                        onBeforeInput={(e) => {
                            if (!/[a-zA-Z0-9]/.test(e.data)) {
                                e.preventDefault()
                            }
                        }}
                    />
                    <User />
                </div>

                <div id="accountFormField">
                    <input type="email" name="email" placeholder="Email" 
                        pattern="[a-zA-Z0-9@.]+" required
                        onChange={() => setShowError("")} 
                        onBeforeInput={(e) => {
                            if (!/[a-zA-Z0-9@.]/.test(e.data)) {
                                e.preventDefault()
                            }
                        }} 
                    />
                    <Email />
                </div>

                <div id="accountFormField">
                    <input type={showPass ? "text" : "password"} name="password" 
                        placeholder="Password (8-20 characters)" 
                        required minLength="8" maxLength="20"
                        onChange={() => setShowError("")}
                    />
                    
                    <button type="button" id="toggleViewPassword" 
                        onClick={() => setShowPass(p => !p)}
                    >
                        {showPass ? <EyeHide /> : <EyeShow />}
                    </button>
                    
                    <Password />
                </div>

                <div id="accountFormField">
                    <input type={showConfirm ? "text" : "password"} name="confirmPassword" placeholder="Confirm password" 
                        required minLength="8" maxLength="20"
                        onChange={() => setShowError("")} 
                        />
                    
                    <button type="button" id="toggleViewPassword" onClick={() => setShowConfirm(p => !p)}>
                        {showConfirm ? <EyeHide /> : <EyeShow />}
                    </button>

                    <Password />
                </div>

                <button type="submit">Register</button>

                {showError == "duplicate username" && <h3 style={{color: "red"}}>Username is already taken</h3>}
                {showError == "duplicate email" && <h3 style={{color: "red"}}>Email is already taken</h3>}
                {showError == "password mismatch" && <h3 style={{color: "red"}}>Passwords don't match</h3>}
                {showError == "invalid invite code" && <h3 style={{color: "red"}}>Invalid invite code</h3>}

                <Link to="/passwordreset">Forgot your password?</Link>
                <Link to="/login">Log into your account</Link>
            </form>
        </div>
    )
}