import { useState, useEffect } from "react"

import { Link } from 'react-router-dom';

import Filters from "./Filters.jsx"

import Logo from "../assets/Logo.png"

import Sun from "../assets/SVG/Sun.svg?react"
import Moon from "../assets/SVG/Moon.svg?react"
import Notification from "../assets/SVG/Notification.svg?react"
import Search from "../assets/SVG/Search.svg?react"
import Settings from "../assets/SVG/Settings.svg?react"

import MockUserImg from "../assets/MockUserImg.jpg"

import "./Header.css"

export default function Header() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "light"
  })

  const [filtersOpen, setFiltersOpen] = useState(0)

  const handleToggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "dark" ? "light" : "dark"))
  };

  const openFilters = () => {
    setFiltersOpen(1 - filtersOpen)
    if (filtersOpen === 0) {
      document.getElementById("filtersIcon").style.rotate = "-90deg"
    } else {
      document.getElementById("filtersIcon").style.rotate = "90deg"
    }
    console.log(filtersOpen)
  }

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
        <Search onClick={() => openFilters()} id="filtersIcon"/>
      </div>

      {filtersOpen ? <Filters /> : null}

      <div className="headerOptions">
        <Link to="/settings">
          <Settings />
        </Link>

        <Link to="/notifications">
          <Notification />
        </Link>

        <button id="theme-toggle" onClick={handleToggleTheme}>
          {theme === "light" ? <Sun /> : <Moon />}
        </button>
      </div>

      <span id="headerVerticalLine"></span>

      <Link to={getUID() === null ? "/login" : "/account"} id="accountSettingsToggle">
        <img src={MockUserImg}/>
        <h3>{getUID() === null ? "Anonim" : "Nume Prenume" /*afisarea numelui utilizatorului mai incolo*/}</h3> 
      </Link>
    </div>
  );
}