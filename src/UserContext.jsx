import { createContext, useState, useEffect } from "react"
import MockUserImg from "./assets/MockUserImg.jpg"

export const UserContext = createContext()

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [avatar, setAvatar] = useState(MockUserImg)

    const loadData = async () => {
        const res = await fetch("http://localhost:18080/user_data", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fields: ["username", "email", "preferences"] })
        })
        const data = await res.json();
        setUser({ username: data.username, email: data.email, preferences: data.preferences })

        const photoRes = await fetch("http://localhost:18080/get_profile_photo", { method: 'GET', credentials: 'include' })
        if (photoRes.ok) {
            const blob = await photoRes.blob()
            setAvatar(URL.createObjectURL(blob))
        }
    }

    useEffect(() => {loadData()}, [])

    return (
        <UserContext.Provider value={{ user, avatar, refreshData: loadData }}>
            {children}
        </UserContext.Provider>
    );
};