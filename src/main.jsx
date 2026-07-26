import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useContext, lazy, Suspense } from 'react' 

import { UserProvider, UserContext } from './UserContext.jsx' 
import { FileProvider } from './GetFiles.jsx' 
import isMobile from "./IsMobile.js"

import Header from './Header/Header.jsx'
import Menu from './Menu/Menu.jsx'

import Login from "./Account/Login.jsx"

import GlobalUploadProgress from "./MyFiles/GlobalUploadProgress.jsx"

const Register = lazy(() => import("./Account/Register.jsx"))
const MyFiles = lazy(() => import("./MyFiles/MyFiles.jsx"))
const Settings = lazy(() => import("./Settings/Settings.jsx"))
const SharedFiles = lazy(() => import("./MyFiles/SharedFiles.jsx"))
const Favorites = lazy(() => import("./MyFiles/Favorites.jsx")) 
const Documents = lazy(() => import("./Documents/Documents.jsx"))
const MusicLibrary = lazy(() => import("./MusicLibrary/MusicLibrary.jsx"))
const PhotoAlbum = lazy(() => import("./PhotoAlbum/PhotoAlbum.jsx"))

function AppContent() {
  const { isLogged } = useContext(UserContext)

  return (
    <BrowserRouter>
      <Header />
      {isMobile() == 0 && isLogged && <Menu />}
      <GlobalUploadProgress />

      <Suspense fallback={<h2>Loading page...</h2>}>
        <Routes>
          <Route path="/" element={!isLogged ? <Login /> : <MyFiles />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={!isLogged ? <Login /> : <Navigate to="/" replace />} />
          
          <Route path="/settings" element={!isLogged ? <Login /> : <Settings />} />
          <Route path="/myfiles/shared" element={!isLogged ? <Login /> : <SharedFiles />} />
          <Route path="/myfiles/favorites" element={!isLogged ? <Login /> : <Favorites />} />
          <Route path="/myfiles/documents" element={!isLogged ? <Login /> : <Documents />} />
          <Route path="/myfiles/music" element={!isLogged ? <Login /> : <MusicLibrary />} />
          <Route path="/myfiles/photos" element={!isLogged ? <Login /> : <PhotoAlbum />} />
        </Routes>
      </Suspense>
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