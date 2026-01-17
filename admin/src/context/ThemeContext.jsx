import { createContext, useState, useEffect } from 'react'

// Export the context
export const ThemeContext = createContext()

// Export the provider
export const ThemeProvider = ({ children, url }) => {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, url }}>
      {children}
    </ThemeContext.Provider>
  )
}