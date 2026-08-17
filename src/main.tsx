import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { useAppStore } from './store/useStore.ts';

// Register Service Worker for PWA / Web-APK installability
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.log('SW registration note:', err);
    });
  });
}

// Capture native PWA installation event
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  useAppStore.getState().setPwaDeferredPrompt(e);
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

