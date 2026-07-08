import { useState, useEffect } from "react"
import { Link } from 'react-router-dom'

import isMobile from "../IsMobile.js"
import Menu from "../Menu/Menu.jsx"
import Notifications from "../Notifications/Notifications.jsx"
import Logo from "../assets/Logo.png"

import Sun from "../assets/SVG/Sun.svg?react"
import Moon from "../assets/SVG/Moon.svg?react"
import Notification from "../assets/SVG/Notification.svg?react"
import Search from "../assets/SVG/Search.svg?react"
import HamburgerToggle from "../assets/SVG/HamburgerToggle.svg?react"

import { useProfilePhoto } from "../GetPFP.js"

import "./Header.css"

export default function Header() {
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem("theme") || "light"
    })

    const avatar = useProfilePhoto()

    const [notificationsOpen, setNotificationsOpen] = useState(false)
    const [showMobileMenu, setShowMobileMenu] = useState(false)

    const handleToggleTheme = () => {
        setTheme((prevTheme) => (prevTheme === "dark" ? "light" : "dark"))
    }

    const toggleMobileMenu = () => {
        if (!showMobileMenu) {
            if (notificationsOpen) setNotificationsOpen(false)
        }
        setShowMobileMenu(!showMobileMenu)
    }

    const toggleMobileNotifications = () => {
        if (!notificationsOpen) {
            if (showMobileMenu) setShowMobileMenu(false)
        }
        setNotificationsOpen(!notificationsOpen)
    }

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme)
        localStorage.setItem("theme", theme)
    }, [theme])

    return (
        <div className="header">
            <div className="headerLeft">
                {isMobile() == 0 && (
                    <Link id="headerLogo" to="/">
                        <img src={Logo} id="logoImg" alt="Logo" />
                        <h1>OffGrid</h1>
                    </Link>
                )}

                {isMobile() == 1 && (
                    <HamburgerToggle
                        id="hamburger"  
                        onClick={toggleMobileMenu} 
                    />
                )}

                {(isMobile() == 1 && showMobileMenu) && <Menu />}

                <div id="headerFileSearch">
                    <input type="text" placeholder="Search files and folders..." />
                    <Search id="filtersIcon" />
                </div>
            </div>

            <div className="headerRight">
                <div className="headerOptions">
                    <Link>
                        <Notification 
                            onClick={() => toggleMobileNotifications()} 
                            id="notifButton" 
                            style={notificationsOpen ? { color: "var(--hoverCol)" } : { color: "var(--text)" }} 
                        />
                    </Link>

                    <button id="theme-toggle" onClick={handleToggleTheme}>
                        {theme === "light" ? <Sun /> : <Moon />}
                    </button>
                </div>

                {isMobile() == 0 && <span id="headerVerticalLine"></span>}

                {isMobile() == 0 && (
                    <Link to={getUID() === null ? "/login" : "/settings"} id="accountSettingsToggle">
                        <img src={avatar} alt="User Avatar" />
                    </Link>
                )}

                {notificationsOpen && <Notifications />}
            </div>
        </div>
    )
}