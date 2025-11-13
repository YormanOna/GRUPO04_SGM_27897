import React, { createContext, useState, useContext, useEffect } from 'react'

const ThemeContext = createContext()

export const ThemeProvider = ({ children }) => {
  // Obtener tema guardado del localStorage o usar 'light' por defecto
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme')
    return savedTheme || 'light'
  })

  // Aplicar el tema al documento cuando cambie
  useEffect(() => {
    const root = document.documentElement
    
    if (theme === 'dark') {
      root.classList.add('dark')
      document.body.style.backgroundColor = '#1f2937' // gray-800
      document.body.style.color = '#f9fafb' // gray-50
    } else {
      root.classList.remove('dark')
      document.body.style.backgroundColor = '#f9fafb' // gray-50
      document.body.style.color = '#111827' // gray-900
    }
    
    // Guardar en localStorage
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light')
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      <div className={theme === 'dark' ? 'dark bg-gray-900 min-h-screen' : 'bg-gray-50 min-h-screen'}>
        {children}
      </div>
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme debe ser usado dentro de ThemeProvider')
  }
  return context
}
