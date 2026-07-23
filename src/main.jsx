import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useContext } from 'react'

import { UserProvider, UserContext } from './UserContext.jsx' 
import { FileProvider } from './GetFiles.jsx' 
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
import Documents from "./Documents/Documents.jsx"
import MusicLibrary from "./MusicLibrary/MusicLibrary.jsx"
import PhotoAlbum from "./PhotoAlbum/PhotoAlbum.jsx"

import GlobalUploadProgress from "./MyFiles/GlobalUploadProgress.jsx"

function AppContent() {
  const { isLogged } = useContext(UserContext)

  return (
    <BrowserRouter>
      <Header />
      {isMobile() == 0 && isLogged && <Menu />}
      <GlobalUploadProgress />

      <Routes>
        <Route path="/" element={!isLogged ? <Login /> : <MyFiles />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={!isLogged ? <Login /> : <Navigate to="/" replace />} />
        <Route path="/passwordreset" element={<ForgotPassword />} />
        
        <Route path="/settings" element={!isLogged ? <Login /> : <Settings />} />
        <Route path="/myfiles/shared" element={!isLogged ? <Login /> : <SharedFiles />} />
        <Route path="/myfiles/favorites" element={!isLogged ? <Login /> : <Favorites />} />
        <Route path="/myfiles/documents" element={!isLogged ? <Login /> : <Documents />} />
        <Route path="/myfiles/music" element={!isLogged ? <Login /> : <MusicLibrary />} />
        <Route path="/myfiles/photos" element={!isLogged ? <Login /> : <PhotoAlbum />} />
      </Routes>
    </BrowserRouter>
  )
}

createRoot(document.getElementById('root')).render(
  <UserProvider>
    <FileProvider> 
      <AppContent />
    </FileProvider>
  </UserProvider>,
)