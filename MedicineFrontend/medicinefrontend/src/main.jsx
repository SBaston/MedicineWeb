import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { APP_VERSION } from './version.js';

// Log de versión en consola al arrancar
console.info(`%c NexusSalud v${APP_VERSION} `, 'background:#6d28d9;color:#fff;font-weight:bold;border-radius:4px;padding:2px 6px;');

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
);