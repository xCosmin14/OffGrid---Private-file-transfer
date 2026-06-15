import { useState } from "react"
import {Link} from "react-router-dom"

import {useTitle} from "../UseTitle.js"

import Email from "../assets/SVG/UserIcons/Email.svg?react"
import User from "../assets/SVG/UserIcons/UserIcon.svg?react"

import "./Account.css"

export default function Register() {
    const [showError, setShowError] = useState(-1) //0 - nu exista cont cu informatiile alea   1 - nu se potrivesc   null - e ok

    const handleSubmit = async (e) => {
        e.preventDefault();

        const formData = new FormData(e.currentTarget); 
        formData.set("username", formData.get("username").replace(/['`"/{};?,#$%^&*()]+/g, ''))
        formData.set("registerEmail", formData.get("registerEmail").replace(/['`"/{};?,#$%^&*()]+/g, ''))
        
        if (formData.get("inviteCode")) formData.set("inviteCode", code.replace(/['`"<>a-zA-Z]+/g, ''))
        
        var formularFinal = {}
        formData.forEach((valoare, cheie) => formularFinal[cheie] = valoare)

        formularFinal = JSON.stringify(formularFinal)
        //verificare dacă username-ul / mailul e luat și invite code-ul e bun
        return
    }

    useTitle("OffGrid - Register")

    return (
        <div className="page centered">
            <form method="post" className="accountForm" onSubmit={handleSubmit}>
                <h1>Password reset</h1>

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

                {showError === null && 
                <div id="accountFormField">
                    <input type="text" name="inviteCode" placeholder="The code is in your email" 
                        pattern="[0-9]+" required minLength="6" maxLength="6"
                        onBeforeInput={(e) => {
                            if (!/[0-9]/.test(e.data)) {
                                e.preventDefault()
                            }
                        }} 
                    />
                    <Email />
                </div>}

                <button type="submit">Get a code</button>

                {showError === 0 && <h3 style={{color: "red"}}>No account matches these credentials</h3>}
                {showError === 2 && <h3 style={{color: "red"}}>Email and username don't match</h3>}

                <Link to="/login">Log into your account</Link>
            </form>
        </div>
    )
}
