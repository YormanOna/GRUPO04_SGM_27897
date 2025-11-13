import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json'
  }
})

// Interceptor para agregar el token a todas las peticiones
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Interceptor para manejar errores de autenticación
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Solo redirigir si ya estamos autenticados y el token expiró
    // NO redirigir durante el intento de login
    if (error.response?.status === 401) {
      const token = localStorage.getItem('token')
      const isLoginRequest = error.config?.url?.includes('/auth/login')
      
      // Solo limpiar y redirigir si teníamos un token (sesión expirada)
      // NO hacer nada si es un error de login (credenciales incorrectas)
      if (token && !isLoginRequest) {
        localStorage.clear()
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
