import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'

import isMobile from "./IsMobile.js"

import Header from './Header/Header.jsx'
import Menu from './Menu/Menu.jsx'

import Register from "./Account/Register.jsx"
import Login from "./Account/Login.jsx"
import ForgotPassword from "./Account/ForgotPassword.jsx"
import Settings from "./Settings/Settings.jsx"

import MyFiles from "./MyFiles/MyFiles.jsx"
import SharedFiles from "./MyFiles/SharedFiles.jsx"
import Favorites from "./MyFiles/Favorites.jsx"
import Trash from "./MyFiles/Trash.jsx"
import Documents from "./Documents/Documents.jsx"
import MusicLibrary from "./MusicLibrary/MusicLibrary.jsx"
import PhotoAlbum from "./PhotoAlbum/PhotoAlbum.jsx"

import GlobalUploadProgress from "./MyFiles/GlobalUploadProgress.jsx"

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Header />
      {isMobile() == 0 && <Menu />}
      <GlobalUploadProgress />

      <Routes>
        <Route path="/" element = {getUID() === null ? <Login /> : <MyFiles />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/passwordreset" element = {<ForgotPassword />}></Route>
        <Route path="/settings" element={getUID() === null ? <Login /> : <Settings />} />

        <Route path="/myfiles/shared" element={getUID() === null ? <Login /> : <SharedFiles />} />
        <Route path="/myfiles/favorites" element={getUID() === null ? <Login /> : <Favorites />} />
        <Route path="/myfiles/trash" element={getUID() === null ? <Login /> : <Trash />} />
        <Route path="/myfiles/documents" element={getUID() === null ? <Login /> : <Documents />} />
        <Route path="/myfiles/music" element={getUID() === null ? <Login /> : <MusicLibrary />} />
        <Route path="/myfiles/photos" element={getUID() === null ? <Login /> : <PhotoAlbum />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
