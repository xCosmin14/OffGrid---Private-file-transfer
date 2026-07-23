import { createContext, useState, useEffect } from "react"
import MockUserImg from "./assets/MockUserImg.jpg"

export const UserContext = createContext()

export const customFetch = async (url, options = {}) => {
    const fetchOptions = {
        ...options,
        credentials: 'include' 
    }

    try {
        const response = await fetch(url, fetchOptions)

        if (response.status === 401) {
            localStorage.setItem("isLogged", "false")
            window.location.href = "/login" 
            return Promise.reject("Unauthorized - Session expired")
        }

        return response
    } catch (error) {
        console.error("Network error:", error)
        throw error
    }
}

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [avatar, setAvatar] = useState(MockUserImg)
    const [isLogged, setIsLogged] = useState(localStorage.getItem("isLogged") === "true")

    const loadData = async () => {
        try {
            const res = await customFetch("http://localhost:18080/user_data", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fields: ["username", "email", "preferences"] })
            })
            
            const data = await res.json()
            setUser({ username: data.data[0].username, email: data.data[0].email, preferences: data.data[0].preferences })

            const photoRes = await customFetch("http://localhost:18080/get_profile_photo", { method: 'GET' })
            if (photoRes.ok) {
                const blob = await photoRes.blob()
                setAvatar(URL.createObjectURL(blob))
            }
        } catch (error) {
            console.error("Failed to fetch user data:", error)
        }
    }

    useEffect(() => {
        if (isLogged) loadData()
    }, [isLogged])

    useEffect(() => {
        if (!user?.preferences) return
        let prefs = user.preferences
        
        if (typeof prefs === "string") prefs = JSON.parse(prefs)
        if (!prefs.light || !prefs.dark) return

        const root = document.documentElement

        Object.keys(prefs.light).forEach((key) => {
            const lightValue = prefs.light[key], darkValue = prefs.dark[key]

            if (lightValue && darkValue) 
                root.style.setProperty(`--${key}`, `light-dark(${lightValue}, ${darkValue})`)
        })
    }, [user?.preferences])

    return (
        <UserContext.Provider value={{ user, avatar, refreshData: loadData, isLogged, setIsLogged }}>
            {children}
        </UserContext.Provider>
    )
}