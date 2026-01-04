import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { BrowserRouter } from 'react-router-dom';
import 'react-toastify/ReactToastify.css'

//  renders the app inside the root element from HTML
const root = ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* BrowserRouter is needed for routing to work */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
