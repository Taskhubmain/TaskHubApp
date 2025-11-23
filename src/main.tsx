import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import './styles/weglot-ugc.css';
import { AuthProvider } from './contexts/AuthContext';
import { RegionProvider } from './contexts/RegionContext';
import { BrowserRouter, HashRouter } from 'react-router-dom';

// Определяем, что это Capacitor
const isCapacitor = !!(window as any).Capacitor;

// Выбираем роутер: HashRouter для APK, BrowserRouter для веб
const Router = isCapacitor ? HashRouter : BrowserRouter;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <RegionProvider>
        <Router>
          <App />
        </Router>
      </RegionProvider>
    </AuthProvider>
  </React.StrictMode>
);
