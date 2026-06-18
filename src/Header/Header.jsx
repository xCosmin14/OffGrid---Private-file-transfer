import { useState, useEffect } from "react"

import { Link } from 'react-router-dom';

import Notifications from "../Notifications/Notifications.jsx"

import Logo from "../assets/Logo.png"

import Sun from "../assets/SVG/Sun.svg?react"
import Moon from "../assets/SVG/Moon.svg?react"
import Notification from "../assets/SVG/Notification.svg?react"
import Search from "../assets/SVG/Search.svg?react"

import MockUserImg from "../assets/MockUserImg.jpg"

import "./Header.css"

export default function Header() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "light"
  })

  const [notificationsOpen, setNotificationsOpen] = useState(0)

  const handleToggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "dark" ? "light" : "dark"))
  };

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme)
    localStorage.setItem("theme", theme)
  }, [theme])

  return (
    <div className="header">
      <Link id="headerLogo" to="/">
        <img src={Logo} id="logoImg"/>
        <h1>OffGrid</h1>
      </Link>

      <div id="headerFileSearch">
        <input type="text" placeholder="Search files and folders..." />
        <Search id="filtersIcon"/>
      </div>

      <div className="headerOptions">
        <Link>
          <Notification 
            onClick={() => setNotificationsOpen(1 - notificationsOpen)} 
            id="notifButton" 
            style={notificationsOpen ? {color: "var(--hoverCol)"} : {color: "var(--text)"}} 
          />
        </Link>

        <button id="theme-toggle" onClick={handleToggleTheme}>
          {theme === "light" ? <Sun /> : <Moon />}
        </button>
      </div>

      <span id="headerVerticalLine"></span>

      <Link to={getUID() === null ? "/login" : "/settings"} id="accountSettingsToggle">
        <img src={MockUserImg}/>
        <h3>{getUID() === null ? "Anonim" : "Nume Prenume" /*afisarea numelui utilizatorului mai incolo*/}</h3> 
      </Link>

      {notificationsOpen ? <Notifications /> : null}
    </div>
  );
}