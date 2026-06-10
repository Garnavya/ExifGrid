import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

// Import the virtual PWA registration module
import 'virtual:pwa-register';

// Modular CSS — split from monolithic style.css
import './css/base.css';
import './css/header.css';
import './css/stats.css';
import './css/dropzone.css';
import './css/gallery.css';
import './css/lightbox.css';
import './css/polaroid.css';
import './css/footer.css';
import './css/mobile.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
