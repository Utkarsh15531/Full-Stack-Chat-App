import {React, useEffect} from 'react'
import './App.css'
import Navbar from './components/Navbar'
import LoginPage from './pages/LoginPage.jsx'
import HomePage from './pages/HomePage.jsx'
import SignUpPage from './pages/SignUpPage.jsx'
import SettingsPage from './pages/SettingsPage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'

import {Routes, Route, Navigate} from "react-router-dom"
import { useAuthStore } from './store/useAuthStore.js'
import { Loader} from 'lucide-react'  //lucide-react is a package which give icons, here we r using loader icon
import { Toaster } from 'react-hot-toast'
import { useThemeStore } from './store/useThemeStore.js'

export default function App() {
  const {authUser, checkAuth, isCheckingAuth} = useAuthStore() //useAuthStore: a huser defined hook

  const {theme} = useThemeStore() //imported & using selected theme to apply it 

  //whenever user visit our application this check if user is authenticated or not, if authenticated then user is logged in 
  useEffect(()=>{
    checkAuth();
  }, [checkAuth]);

  console.log({authUser});

  if(isCheckingAuth && !authUser) return (

    <div className="flex items-center justify-center h-screen">
        <Loader className="size-10 animate-spin" />
    </div>
  )

  return (
    // applied the selected theme, "data-theme" functionality is comming from daisyui configired in App.css
    <div data-theme={theme}>  
      <Navbar/>
      <Routes>
        <Route path="/" element={authUser ? <HomePage /> : <Navigate to="/login"/> }   />
        <Route path="/signup" element={!authUser ? <SignUpPage /> :<Navigate to="/" />}   />
        <Route path="/login" element={!authUser ? <LoginPage /> : <Navigate to="/" />}   />
        <Route path="/settings" element={<SettingsPage />}   />
        <Route path="/profile" element={authUser ? <ProfilePage />:<Navigate to="/login"/>}   />
      </Routes>

      <Toaster />
    </div>
  )
}
//daisyUI is a website from where we can use inbuilt Tailwind CSS component