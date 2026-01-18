
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import {BrowserRouter} from 'react-router-dom'
import StoreContextProvider from './context/StoreContext.jsx'

// Load favicon from backend
const loadFavicon = async () => {
  try {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000'
    const response = await fetch(`${apiUrl}/api/settings/branding`)
    if (response.ok) {
      const data = await response.json()
      if (data.success && data.data?.favicon) {
        const link = document.querySelector('link[rel="icon"]')
        if (link) {
          link.href = `${apiUrl}/uploads/branding/${data.data.favicon}`
        }
      }
    }
  } catch (error) {
    console.log('Using default favicon')
  }
}

loadFavicon()

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <StoreContextProvider>
      <App />
    </StoreContextProvider>
  </BrowserRouter>

)
