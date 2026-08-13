import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from './lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useAuthStore, useAppStore } from './store/useStore';
import { User } from './types';

import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import VideoPlayer from './pages/VideoPlayer';
import AdminPanel from './pages/AdminPanel';
import { ProtectedRoute } from './components/ProtectedRoute';

export default function App() {
  const { setUser, setLoading } = useAuthStore();
  const { setAppSettings, darkMode } = useAppStore();

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => setAppSettings(data))
      .catch(console.error);
      
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
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
            role: 'user',
            subscriptionStatus: 'active'
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [setUser, setLoading, setAppSettings]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);


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
    </BrowserRouter>
  );
}
