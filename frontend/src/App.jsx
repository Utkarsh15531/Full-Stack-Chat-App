import React, { useEffect } from 'react';
import './App.css';
import Navbar from './components/Navbar';
import SoundManager from './components/SoundManager';
import NotificationManager from './components/NotificationManager';
import LoginPage from './pages/LoginPage.jsx';
import HomePage from './pages/HomePage.jsx';
import SignUpPage from './pages/SignUpPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';

import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore.js';
import { useCallStore } from './store/useCallStore.js';
import { Loader } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import { useThemeStore } from './store/useThemeStore.js';

// **CRITICAL FIX 1: Import VideoCall component**
import VideoCall from './components/VideoCall';

export default function App() {
  const { authUser, checkAuth, isCheckingAuth } = useAuthStore();

  // **CRITICAL FIX 2: Destructure activeCall and incomingCall**
  const {
    subscribeToCallEvents,
    unsubscribeFromCallEvents,
    activeCall,
    incomingCall
  } = useCallStore();

  const { theme } = useThemeStore();

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Subscribe/Unsubscribe to call events based on authentication status
  useEffect(() => {
    if (authUser) {
      subscribeToCallEvents();
    } else {
      unsubscribeFromCallEvents();
    }

    return () => {
      unsubscribeFromCallEvents();
    };
  }, [authUser, subscribeToCallEvents, unsubscribeFromCallEvents]);

  console.log({ authUser });

  // Loading state UI
  if (isCheckingAuth && !authUser)
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="size-10 animate-spin" />
      </div>
    );

  return (
    // Apply selected theme
    <div data-theme={theme} className="min-h-screen bg-base-100">
      <Navbar />

      <Routes>
        <Route path="/" element={authUser ? <HomePage /> : <Navigate to="/login" />} />
        <Route path="/signup" element={!authUser ? <SignUpPage /> : <Navigate to="/" />} />
        <Route path="/login" element={!authUser ? <LoginPage /> : <Navigate to="/" />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/profile" element={authUser ? <ProfilePage /> : <Navigate to="/login" />} />
      </Routes>

      {/* Audio and Video Call UI (Overlay) */}
      {activeCall || incomingCall ? (
        <VideoCall
          isIncoming={!!incomingCall}
          {...(activeCall || incomingCall)}
          caller={(incomingCall || activeCall)?.caller}
          onEnd={() => {}} // Clean up is handled internally by VideoCall calling storeEndCall
        />
      ) : null}

      {/* Sound Manager for notification sounds */}
      {authUser && <SoundManager />}

      {/* Notification Manager for push notifications */}
      {authUser && <NotificationManager />}

      <Toaster />
    </div>
  );
}
