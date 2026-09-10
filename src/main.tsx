import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import { AppControlProvider } from './AppControlContext.tsx';
import { LanguageProvider } from './LanguageContext.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <LanguageProvider>
        <AppControlProvider>
          <App />
        </AppControlProvider>
      </LanguageProvider>
    </BrowserRouter>
  </StrictMode>,
);

if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => {
        console.log('[ServiceWorker] Registration successful with scope: ', reg.scope);
      })
      .catch(err => {
        console.warn('[ServiceWorker] Registration failed: ', err);
      });
  });
}

