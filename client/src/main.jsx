import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import 'lenis/dist/lenis.css';
import App from './App.jsx';
import SmoothScroll from './components/layout/SmoothScroll.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { PortalAuthProvider } from './context/PortalAuthContext.jsx';
import { ConsultationModalProvider } from './context/ConsultationModalContext.jsx';
import { ToastProvider } from './components/ui/toast.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <SmoothScroll>
        <ToastProvider>
          <AuthProvider>
            <PortalAuthProvider>
              <ConsultationModalProvider>
                <App />
              </ConsultationModalProvider>
            </PortalAuthProvider>
          </AuthProvider>
        </ToastProvider>
      </SmoothScroll>
    </BrowserRouter>
  </React.StrictMode>
);
