import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';
import App from './App.jsx';
import { FridgeProvider } from './context/FridgeContext.jsx';

// HashRouter so deep links work on GitHub Pages (no server-side rewrites).
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HashRouter>
      <FridgeProvider>
        <App />
      </FridgeProvider>
    </HashRouter>
  </StrictMode>,
);
