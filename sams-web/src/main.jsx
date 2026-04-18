import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
<<<<<<< HEAD
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
=======
    <BrowserRouter>
>>>>>>> b1b479845e53524359717104ab47c7124a6cfd6d
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
