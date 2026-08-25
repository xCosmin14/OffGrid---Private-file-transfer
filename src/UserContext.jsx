import { createContext, useState, useEffect, useRef } from "react"
import MockUserImg from "./assets/MockUserImg.jpg"

export const UserContext = createContext()

const key = import.meta.env.VITE_HOST_ADDRESS

export const customFetch = async (url, options = {}) => {
    const fetchOptions = {
        ...options,
        credentials: 'include' 
    }

    const doFetch = () => fetch(url, fetchOptions)

    try {
        let response = await doFetch()

        if (response.status === 401 && !url.includes('/log_in') && !url.includes('/register')) {
            await new Promise(resolve => setTimeout(resolve, 1000))
            response = await doFetch()

            if (response.status === 401) {
                localStorage.setItem("isLogged", "false")
                window.location.href = "/login" 
                return Promise.reject("Unauthorized - Session expired")
            }
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
    const [notifications, setNotifications] = useState([])
    const [public_key, setPublic_key] = useState("")

    const setPublicKey = (keyParam) => {setPublic_key(keyParam)}

    const wsRef = useRef(null)

    useEffect(() => {
        return () => {
            if (avatar && avatar.startsWith("blob:")) URL.revokeObjectURL(avatar) 
        }
    }, [avatar])

    const loadData = async () => {
        try {
            const res = await customFetch(`http://${key}:18080/user_data`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fields: ["username", "email", "preferences"] })
            })
            
            const data = await res.json()
            const userData = data.data ? data.data[0] : data
            
            setUser({ 
                username: userData.username, 
                email: userData.email, 
                preferences: userData.preferences, 
                public_key: localStorage.getItem("publicKey")
            })

            const photoRes = await customFetch(`http://${key}:18080/get_profile_photo`, { method: 'GET' })
            if (photoRes.ok) {
                const blob = await photoRes.blob()
                const imageUrl = URL.createObjectURL(blob)

                setAvatar(prevAvatar => {
                    if (prevAvatar && prevAvatar.startsWith("blob:")) URL.revokeObjectURL(prevAvatar)
                    return imageUrl
                })
            }
        } catch (error) {
            console.error("Failed to fetch user data:", error)
        }
    }

    useEffect(() => {
        if (!isLogged) return

        loadData()

        const socket = new WebSocket(`ws://${key}:18080`)
        wsRef.current = socket
        
        socket.onopen = () => {}

        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data)
                if (data.type === "notification") 
                    setNotifications(prev => [...prev, data])
            } catch (err) {
                console.error("Error parsing WS message:", err)
            }
        }

        socket.onerror = (error) => {
            console.error("WebSocket error:", error)
        }

        return () => {
            socket.close()
            wsRef.current = null
        }
    }, [isLogged])

    const sendMessage = (data) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(data))
        } else {
            console.warn("WebSocket is not open. Message not sent:", data)
        }
    }

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
        <UserContext.Provider value={{ 
            user, 
            avatar, 
            refreshData: loadData, 
            isLogged, 
            setIsLogged,
            notifications,
            sendMessage,
            public_key, setPublicKey: setPublicKey
        }}>
            {children}
        </UserContext.Provider>
    )
}