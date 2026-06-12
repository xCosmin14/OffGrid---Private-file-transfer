import { useState } from "react"
import {Link} from "react-router-dom"

import {useTitle} from "../UseTitle.js"

import Email from "../assets/SVG/UserIcons/Email.svg?react"
import Password from "../assets/SVG/UserIcons/Password.svg?react"
import EyeShow from "../assets/SVG/EyeShow.svg?react"
import EyeHide from "../assets/SVG/EyeHide.svg?react"

import "./Account.css"

export default function Login() {
    const [showPass, setShowPass] = useState(false)
    
    useTitle("OffGrid - Login")

    return (
        <div className="page centered">
            <form method="post" className="accountForm">
                <h1>Welcome back!</h1>

                <div id="accountFormField">
                    <input type="email" name="loginEmail" placeholder="Email" 
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

                <button type="submit">Login</button>

                <Link to="/passwordreset">Forgot your password?</Link>
                <Link to="/register">Create an account</Link>
            </form>
        </div>
    );
}