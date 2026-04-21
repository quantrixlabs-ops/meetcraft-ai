import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import App from './App';
import { ThemeProvider } from './context/ThemeContext';

const DownloadPage = React.lazy(() => import('./pages/DownloadPage'));

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ThemeProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/download" element={<Suspense fallback={<div>Loading...</div>}><DownloadPage /></Suspense>} />
        <Route path="/*" element={<App />} />
      </Routes>
    </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
);
