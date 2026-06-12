import { useState } from "react"
import {Link} from "react-router-dom"

import {useTitle} from "../UseTitle.js"

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
    const [showError, setShowError] = useState(0) //2 - username luat   3 - email luat   4 - invite code invalid

    const handleSubmit = async (e) => {
        e.preventDefault();

        const formData = new FormData(e.currentTarget); 
        formData.set("username", formData.get("username").replace(/['`"/{};?,#$%^&*()]+/g, ''))
        formData.set("firstName", formData.get("firstName").replace(/['`"/{};?,#$%^&*()]+/g, ''))
        formData.set("lastName", formData.get("lastName").replace(/['`"/{};?,#$%^&*()]+/g, ''))
        formData.set("registerEmail", formData.get("registerEmail").replace(/['`"/{};?,#$%^&*()]+/g, ''))
        formData.set("registerPassword", formData.get("registerPassword").replace(/['`"<>]+/g, ''))
        formData.set("confirmPassword", formData.get("confirmPassword").replace(/['`"<>]+/g, ''))
        formData.set("inviteCode", formData.get("inviteCode").replace(/['`"<>]+/g, ''))
        
        var formularFinal = {}
        formData.forEach((valoare, cheie) => formularFinal[cheie] = valoare)
        
        if (formData.get("registerPassword") !== formData.get("confirmPassword")) {
            setShowError(1)
            return
        }
        setShowError(0)

        formularFinal = JSON.stringify(formularFinal)
        //verificare dacă username-ul / mailul e luat și invite code-ul e bun
        return
    }

    useTitle("OffGrid - Register")

    return (
        <div className="page centered">
            <form method="post" className="accountForm" onSubmit={handleSubmit}>
                <h1>Create an account</h1>

                <div id="accountFormField">
                    <input type="text" name="username" placeholder="Username" 
                        pattern="[a-zA-Z0-9]+" required
                        onBeforeInput={(e) => {
                            if (!/[a-zA-Z0-9]/.test(e.data)) {
                                e.preventDefault()
                            }
                        }}
                    />
                    <User />
                </div>

                <div id="accountFormField">
                    <input type="text" name="firstName" placeholder="First name" className="half" 
                        pattern="[a-zA-Z]+" required
                        onBeforeInput={(e) => {
                            if (!/[a-zA-Z]/.test(e.data)) {
                                e.preventDefault()
                            }
                        }}   
                    />
                    <input type="text" name="lastName" placeholder="Last name" className="half" 
                        pattern="[a-zA-Zz]+" required
                        onBeforeInput={(e) => {
                            if (!/[a-zA-Z]/.test(e.data)) {
                                e.preventDefault()
                            }
                        }} 
                    />
                    <User />
                </div>

                <div id="accountFormField">
                    <input type="email" name="registerEmail" placeholder="Email" 
                        pattern="[a-zA-Z0-9@.]+" required
                        onBeforeInput={(e) => {
                            if (!/[a-zA-Z0-9@.]/.test(e.data)) {
                                e.preventDefault()
                            }
                        }} 
                    />
                    <Email />
                </div>

                <div id="accountFormField">
                    <input type={showPass ? "text" : "password"} name="registerPassword" 
                        placeholder="Password (8-20 characters)" 
                        required minLength="8" maxLength="20"
                    />
                    
                    <button type="button" id="toggleViewPassword" minLength="8" maxLength="20"
                        onClick={() => setShowPass(p => !p)}
                    >
                        {showPass ? <EyeHide /> : <EyeShow />}
                    </button>
                    
                    <Password />
                </div>

                <div id="accountFormField">
                    <input type={showConfirm ? "text" : "password"} name="confirmPassword" placeholder="Confirm password" 
                        required onChange={() => setShowError(0)}
                        />
                    
                    <button type="button" id="toggleViewPassword" onClick={() => setShowConfirm(p => !p)}>
                        {showConfirm ? <EyeHide /> : <EyeShow />}
                    </button>

                    <Password />
                </div>

                <div id="accountFormField">
                    <input type="text" name="inviteCode" placeholder="Invite code"
                        pattern="[a-zA-Z0-9!#$%^?]+" required
                        onBeforeInput={(e) => {
                            if (!/[a-zA-Z0-9!#$%^?]/.test(e.data)) {
                                e.preventDefault()
                            }
                        }} 
                    />
                    <Group />
                </div>

                <button type="submit">Register</button>

                {showError === 1 && <h3 style={{color: "red"}}>Passwords do not match</h3>}
                {showError === 2 && <h3 style={{color: "red"}}>Username already exists</h3>}
                {showError === 3 && <h3 style={{color: "red"}}>This email address is taken</h3>}
                {showError === 4 && <h3 style={{color: "red"}}>Invalid invite code</h3>}

                <Link to="/passwordreset">Forgot your password?</Link>
                <Link to="/login">Log into your account</Link>
            </form>
        </div>
    )
}
