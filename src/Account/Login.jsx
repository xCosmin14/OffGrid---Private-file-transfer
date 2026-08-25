import { useState, useContext } from "react"
import { Link, useNavigate } from "react-router-dom"

import { useTitle } from "../UseTitle.js"
import { customFetch, UserContext } from "../UserContext.jsx"
import { initCrypto, deriveKeyFromPassword, decryptDataWithKey } from "../CryptoUtils.js"
import { cachePrivateKey } from "../CryptoCache.js"

import Email from "../assets/SVG/UserIcons/Email.svg?react"
import Password from "../assets/SVG/UserIcons/Password.svg?react"
import EyeShow from "../assets/SVG/EyeShow.svg?react"
import EyeHide from "../assets/SVG/EyeHide.svg?react"

import "./Account.css"

export default function Login() {
    const { setIsLogged, setPublicKey } = useContext(UserContext)
    const navigate = useNavigate()

    const [showPass, setShowPass] = useState(false)
    const [showError, setShowError] = useState("")

    const key = import.meta.env.VITE_HOST_ADDRESS

    const handleSubmit = async (e) => {
        e.preventDefault()
        setShowError("")

        const formData = new FormData(e.currentTarget)
        formData.set("email", formData.get("email").replace(/['`"/{};?,#$%^&*()]+/g, ''))
        formData.set("password", formData.get("password").replace(/['`"<>]+/g, ''))

        let DataObject = Object.fromEntries(formData.entries())
        const password = DataObject.password 

        try {
            let response = await customFetch(`http://${key}:18080/log_in`, {
                method: "POST",
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(DataObject)
            })

            let data = await response.json()

            if (data.message == "user logged in") {
                try {
                    await initCrypto()
                    const derivedKey = await deriveKeyFromPassword(password, data.key_salt)
                    const privateKeyUint8 = await decryptDataWithKey(data.encrypted_private_key, derivedKey)
                    
                    setPublicKey(data.public_key)
                    localStorage.setItem("publicKey", data.public_key) 

                    try {
                        await cachePrivateKey(privateKeyUint8) 
                    } catch (cacheErr) {}

                    localStorage.setItem("isLogged", "true")
                    setIsLogged(true) 
                    navigate("/")  

                } catch (cryptoErr) {
                    console.error("Crypto error:", cryptoErr)
                    setShowError("Failed to decrypt account keys")
                }
            } else setShowError(data.message)
        } catch (err) {
            setShowError("An error occurred during login")
        }
    }
    
    useTitle("OffGrid - Login")

    return (
        <div className="page centered">
            <form method="post" className="accountForm" onSubmit={handleSubmit}>
                <h1>Welcome back!</h1>

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
                    <Email/>
                </div>

                <div id="accountFormField">
                    <input type={showPass ? "text" : "password"} name="password" placeholder="Password" required onChange={() => setShowError("")}/>
                    
                    <button type="button" id="toggleViewPassword" onClick={() => setShowPass(p => !p)}>
                        {showPass ? <EyeHide /> : <EyeShow />} 
                    </button>
                    
                    <Password />
                </div>

                {showError === "user not found" && <h3 style={{color: "red"}}>Email does not exist</h3>}
                {showError === "incorrect password" && <h3 style={{color: "red"}}>Wrong password</h3>}
                
                {showError && showError !== "user not found" && showError !== "incorrect password" && (
                    <h3 style={{color: "red"}}>{showError}</h3>
                )}

                <button type="submit">Login</button>

                <Link to="/register">Create an account</Link>
            </form>
        </div>
    )
}