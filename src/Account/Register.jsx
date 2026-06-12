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

    useTitle("OffGrid - Register")

    return (
        <div className="page centered">
            <form method="post" className="accountForm">
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
                    <input type={showPass ? "text" : "password"} name="registerPassword" placeholder="Password" required/>
                    
                    <button type="button" id="toggleViewPassword" onClick={() => setShowPass(p => !p)}>
                        {showPass ? <EyeHide /> : <EyeShow />}
                    </button>
                    
                    <Password />
                </div>

                <div id="accountFormField">
                    <input type={showConfirm ? "text" : "password"} name="confirmPassword" placeholder="Confirm password" required/>
                    
                    <button type="button" id="toggleViewPassword" onClick={() => setShowConfirm(p => !p)}>
                        {showConfirm ? <EyeHide /> : <EyeShow />}
                    </button>

                    <Password />
                </div>

                <div id="accountFormField">
                    <input type="text" name="inviteCode" placeholder="Invite code"
                        pattern="[a-zA-Z0-9!#$%^?]" required
                        onBeforeInput={(e) => {
                            if (!/[a-zA-Z0-9!#$%^?]/.test(e.data)) {
                                e.preventDefault()
                            }
                        }} 
                    />
                    <Group />
                </div>

                <button type="submit">Register</button>

                <Link to="/passwordreset">Forgot your password?</Link>
                <Link to="/login">Log into your account</Link>
            </form>
        </div>
    )
}
