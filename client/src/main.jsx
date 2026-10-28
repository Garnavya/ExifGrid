import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';

// Import the virtual PWA registration module
import 'virtual:pwa-register';

// Modular CSS — split from monolithic style.css
import './css/base.css';
import './css/theme.css';
import './css/header.css';
import './css/stats.css';
import './css/dropzone.css';
import './css/gallery.css';
import './css/pinterest.css';
import './css/lightbox.css';
import './css/polaroid.css';
import './css/footer.css';
import './css/mobile.css';
import './css/modal.css';
import './css/filters.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
