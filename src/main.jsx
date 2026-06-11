import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global/index.css'
import './services/api'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)