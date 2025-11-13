import React, { createContext, useState, useContext } from 'react'
import { loginService } from '../services/authService'
import toast from 'react-hot-toast'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null)

  const login = async (email, password, navigate) => {
    try {
      const res = await loginService(email, password)
      
      // Solo actualizar el estado si el login fue exitoso
      setUser(res.user)
      localStorage.setItem('token', res.access_token)
      localStorage.setItem('user', JSON.stringify(res.user))
      toast.success('¡Inicio de sesión exitoso!', {
        duration: 5000, // 5 segundos
      })
      
      // Navegar programáticamente después del login exitoso
      if (navigate) {
        setTimeout(() => navigate('/'), 100)
      }
      
      return true
    } catch (error) {
      console.error('Error en login:', error)
      
      // NO tocar el estado del usuario aquí, mantenerlo como null
      // NO actualizar localStorage
      
      // NO mostrar toasts aquí, solo en el componente Login.jsx
      // El mensaje de error se mostrará en el formulario
      
      throw error
    }
  }

  const logout = () => {
    localStorage.clear()
    setUser(null)
    toast('Sesión cerrada')
  }

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)

export default AuthContext
