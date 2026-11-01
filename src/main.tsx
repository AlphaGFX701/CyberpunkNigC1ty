import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './style.css'
import './ui/pixel.css'
import './ui/gallery.css'
createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
