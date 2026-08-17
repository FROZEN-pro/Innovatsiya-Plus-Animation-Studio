import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from './lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useAuthStore, useAppStore } from './store/useStore';
import { User } from './types';
import { logUserLogin } from './lib/userActivity';

import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import VideoPlayer from './pages/VideoPlayer';
import AdminPanel from './pages/AdminPanel';
import { ProtectedRoute } from './components/ProtectedRoute';
import MiniPlayer from './components/MiniPlayer';
import UserSettingsModal from './components/UserSettingsModal';
import NetworkStatusToast from './components/NetworkStatusToast';

export default function App() {
  const { setUser, setLoading } = useAuthStore();

  const { appSettings, setAppSettings, darkMode, setDarkMode } = useAppStore();

  // Load app settings on startup
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const data = await res.json();
          setAppSettings(data);
        }
      } catch (err) {
        console.warn("Could not fetch initial app settings:", err);
      }
    };
    fetchSettings();
  }, [setAppSettings]);

  // Keep document element in sync with dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Dynamically listen to system OS theme changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      const saved = localStorage.getItem('innovation_plus_darkmode');
      // If user hasn't explicitly set a preference or if system is default, adapt immediately
      if (saved === null || saved === 'system') {
        setDarkMode(e.matches);
      }
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, [setDarkMode]);
  
  useEffect(() => {
    if (appSettings?.seoTitle) {
      document.title = appSettings.seoTitle;
    }
    if (appSettings?.seoDescription) {
      let metaDesc = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
      if (!metaDesc) {
        metaDesc = document.createElement('meta') as HTMLMetaElement;
        metaDesc.name = "description";
        document.head.appendChild(metaDesc);
      }
      metaDesc.content = appSettings.seoDescription;
    }
    if (appSettings?.seoKeywords) {
      let metaKey = document.querySelector('meta[name="keywords"]') as HTMLMetaElement | null;
      if (!metaKey) {
        metaKey = document.createElement('meta') as HTMLMetaElement;
        metaKey.name = "keywords";
        document.head.appendChild(metaKey);
      }
      metaKey.content = appSettings.seoKeywords;
    }
  }, [appSettings]);


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Securely log login timestamp & device info to Firestore
        logUserLogin(firebaseUser.uid, {
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          role: firebaseUser.email === 'sherzodmamatov10@gmail.com' ? 'admin' : undefined
        }, 'google_auth').catch(console.warn);

        try {
          const token = await firebaseUser.getIdToken();
          const res = await fetch('/api/auth/sync', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setUser(data.user);
          } else {
            throw new Error('Failed to sync via API');
          }
        } catch (error) {
          // Fallback if offline
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            role: firebaseUser.email === 'sherzodmamatov10@gmail.com' ? 'admin' : 'user',
            subscriptionStatus: 'active'
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [setUser, setLoading]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<AuthPage />} />
        
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/play/:id" element={
          <ProtectedRoute>
            <VideoPlayer />
          </ProtectedRoute>
        } />
        
        <Route path="/admin" element={
          <ProtectedRoute requireAdmin={true}>
            <AdminPanel />
          </ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      <MiniPlayer />
      <UserSettingsModal />
      <NetworkStatusToast />
    </BrowserRouter>
  );
}
