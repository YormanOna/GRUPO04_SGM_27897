import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock, LogIn, Eye, EyeOff } from 'lucide-react'

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' })
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    // Limpiar error cuando el usuario empieza a escribir
    if (error) setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('') // Limpiar errores anteriores
    
    try {
      await login(form.email, form.password, navigate)
      // Si llega aquí, el login fue exitoso y la navegación se manejará en el contexto
    } catch (error) {
      // Capturar el mensaje de error para mostrarlo en el formulario también
      const errorMessage = error.response?.data?.detail || 'Error al iniciar sesión'
      setError(errorMessage)
      console.log('Error de login capturado en componente:', errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Fondo animado con gradiente */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-500">
        <div className="absolute inset-0 bg-black/10"></div>
      </div>
      
      {/* Formas decorativas */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>

      <div className="w-full max-w-5xl relative z-10">
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/50">
          <div className="grid md:grid-cols-2">
            {/* Lado izquierdo - Logo y bienvenida */}
            <div className="bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 p-12 flex flex-col items-center justify-center text-white">
              <div className="text-center space-y-6">
                <div className="inline-flex items-center justify-center bg-white rounded-3xl p-8 shadow-2xl">
                  <img 
                    src="/Images/logo.png" 
                    alt="Logo" 
                    className="w-40 h-40 object-contain"
                  />
                </div>
                <div>
                  <h2 className="text-4xl font-bold mb-3">¡Bienvenido!</h2>
                  <p className="text-blue-100 text-lg">Sistema de Gestión Hospitalaria</p>
                  <p className="text-blue-200 text-sm mt-4">Accede a tu cuenta para continuar</p>
                </div>
                <div className="pt-8">
                  <div className="w-20 h-1 bg-white/50 rounded-full mx-auto"></div>
                </div>
              </div>
            </div>

            {/* Lado derecho - Formulario */}
            <div className="p-8 md:p-12">
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Iniciar Sesión</h3>
                <p className="text-gray-600">Ingresa tus credenciales</p>
              </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Campo Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Correo Electrónico
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-800 font-medium"
                    placeholder="usuario@ejemplo.com"
                    required
                  />
                </div>
              </div>

              {/* Campo Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Contraseña
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    className="w-full pl-12 pr-12 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-800 font-medium"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center hover:text-blue-600 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5 text-gray-400" />
                    ) : (
                      <Eye className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* Mensaje de error persistente - MUY VISIBLE */}
              {error && (
                <div className="bg-gradient-to-r from-red-50 to-red-100 border-4 border-red-600 text-red-800 px-6 py-5 rounded-xl flex items-start space-x-4 shadow-2xl shadow-red-500/50 animate-pulse">
                  <svg className="w-8 h-8 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <div className="flex-1">
                    <p className="font-bold text-base leading-relaxed">⚠️ {error}</p>
                  </div>
                </div>
              )}

              {/* Botón de login */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 text-white py-4 rounded-xl font-bold text-lg hover:from-blue-700 hover:via-blue-600 hover:to-cyan-600 focus:outline-none focus:ring-4 focus:ring-blue-500/50 transition-all duration-300 shadow-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Iniciando sesión...
                  </span>
                ) : (
                  <span className="flex items-center justify-center space-x-2">
                    <LogIn className="w-6 h-6" />
                    <span>Iniciar Sesión</span>
                  </span>
                )}
              </button>
            </form>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-white/80 text-sm">© 2025 Sistema de Gestión Hospitalaria</p>
        </div>
      </div>
    </div>
  )
}

export default Login

