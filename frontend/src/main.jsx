
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import {BrowserRouter} from 'react-router-dom'
import StoreContextProvider from './context/StoreContext.jsx'

// Load favicon and site name from backend
const loadBranding = async () => {
  try {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000'
    const response = await fetch(`${apiUrl}/api/settings`)
    if (response.ok) {
      const data = await response.json()
      if (data.success && data.data) {
        // Update favicon
        if (data.data.favicon) {
          const link = document.querySelector('link[rel="icon"]')
          const href = data.data.favicon.startsWith('http')
            ? data.data.favicon
            : `${apiUrl}/uploads/branding/${data.data.favicon}`
          if (link && href) {
            link.href = href
          }
        }
        // Update page title
        if (data.data.siteName) {
          document.title = data.data.siteName
        }
      }
    }
  } catch (error) {
    console.log('Using default branding')
  }
}

loadBranding()

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <StoreContextProvider>
      <App />
    </StoreContextProvider>
  </BrowserRouter>

)
