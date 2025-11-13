import React, { useState, useEffect, useRef } from 'react'
import {
  Settings,
  X,
  User,
  Lock,
  Bell,
  Moon,
  Sun,
  LogOut,
  ChevronRight,
  AlertCircle
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const SettingsDropdown = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const dropdownRef = useRef(null)
  const [activeSection, setActiveSection] = useState(null)
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [passwordErrors, setPasswordErrors] = useState({})
  const [changingPassword, setChangingPassword] = useState(false)

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  const validatePassword = () => {
    const errors = {}

    if (!passwordForm.currentPassword) {
      errors.currentPassword = 'La contraseña actual es obligatoria'
    }

    if (!passwordForm.newPassword) {
      errors.newPassword = 'La nueva contraseña es obligatoria'
    } else if (passwordForm.newPassword.length < 6) {
      errors.newPassword = 'La contraseña debe tener al menos 6 caracteres'
    }

    if (!passwordForm.confirmPassword) {
      errors.confirmPassword = 'Debe confirmar la nueva contraseña'
    } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirmPassword = 'Las contraseñas no coinciden'
    }

    if (passwordForm.currentPassword === passwordForm.newPassword) {
      errors.newPassword = 'La nueva contraseña debe ser diferente a la actual'
    }

    setPasswordErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    
    if (!validatePassword()) {
      toast.error('Por favor corrija los errores en el formulario')
      return
    }

    setChangingPassword(true)
    try {
      // Aquí iría la llamada al API para cambiar la contraseña
      // Por ahora simulamos un éxito después de 1 segundo
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast.success('✅ Contraseña actualizada correctamente')
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      setPasswordErrors({})
      setActiveSection(null)
      
      // Opcional: cerrar sesión después de cambiar contraseña
      // setTimeout(() => {
      //   toast.info('Por seguridad, debe iniciar sesión nuevamente')
      //   logout()
      // }, 2000)
    } catch (error) {
      toast.error('Error al cambiar la contraseña. Verifique su contraseña actual')
    } finally {
      setChangingPassword(false)
    }
  }

  const menuItems = [
    {
      id: 'profile',
      icon: User,
      title: 'Mi Perfil',
      description: `${user?.nombre} ${user?.apellido} - ${user?.cargo}`,
      action: () => {
        onClose()
        navigate('/perfil')
      }
    },
    {
      id: 'password',
      icon: Lock,
      title: 'Cambiar Contraseña',
      description: 'Actualiza tu contraseña de acceso',
      action: () => setActiveSection('password')
    },
    {
      id: 'theme',
      icon: theme === 'dark' ? Moon : Sun,
      title: 'Tema de Interfaz',
      description: `Modo ${theme === 'dark' ? 'Oscuro 🌙' : 'Claro ☀️'} activo`,
      action: () => {
        toggleTheme()
        toast.success(`✨ Tema ${theme === 'dark' ? 'Claro' : 'Oscuro'} activado`, {
          icon: theme === 'dark' ? '☀️' : '🌙',
          duration: 2000,
          style: {
            background: theme === 'dark' ? '#f9fafb' : '#1f2937',
            color: theme === 'dark' ? '#111827' : '#f9fafb',
          }
        })
      }
    },
    {
      id: 'notifications',
      icon: Bell,
      title: 'Notificaciones',
      description: 'Todas las notificaciones activas',
      action: () => {
        toast.success('Notificaciones activadas', { 
          icon: '🔔',
          duration: 2000 
        })
      }
    }
  ]

  const handleLogout = () => {
    onClose()
    logout()
    toast.success('Sesión cerrada correctamente')
  }

  if (!isOpen) return null

  // Vista de cambio de contraseña
  if (activeSection === 'password') {
    return (
      <div
        ref={dropdownRef}
        className="absolute right-0 mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-50 animate-slideDown"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Lock className="w-5 h-5 text-white" />
              <h3 className="text-white font-semibold text-lg">Cambiar Contraseña</h3>
            </div>
            <button
              onClick={() => setActiveSection(null)}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form className="p-5 space-y-4" onSubmit={handlePasswordChange}>
          {/* Contraseña Actual */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contraseña Actual *
            </label>
            <input
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) => {
                setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                if (passwordErrors.currentPassword) {
                  setPasswordErrors({ ...passwordErrors, currentPassword: '' })
                }
              }}
              className={`w-full px-4 py-2 border-2 rounded-lg transition-all ${
                passwordErrors.currentPassword
                  ? 'border-red-500 bg-red-50 focus:border-red-600'
                  : 'border-gray-300 focus:border-blue-500'
              } focus:ring-2 focus:ring-blue-100`}
              placeholder="••••••••"
              disabled={changingPassword}
            />
            {passwordErrors.currentPassword && (
              <p className="text-red-600 text-sm mt-1 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {passwordErrors.currentPassword}
              </p>
            )}
          </div>

          {/* Nueva Contraseña */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nueva Contraseña *
            </label>
            <input
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) => {
                setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                if (passwordErrors.newPassword) {
                  setPasswordErrors({ ...passwordErrors, newPassword: '' })
                }
              }}
              className={`w-full px-4 py-2 border-2 rounded-lg transition-all ${
                passwordErrors.newPassword
                  ? 'border-red-500 bg-red-50 focus:border-red-600'
                  : 'border-gray-300 focus:border-blue-500'
              } focus:ring-2 focus:ring-blue-100`}
              placeholder="••••••••"
              disabled={changingPassword}
            />
            {passwordErrors.newPassword && (
              <p className="text-red-600 text-sm mt-1 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {passwordErrors.newPassword}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Mínimo 6 caracteres
            </p>
          </div>

          {/* Confirmar Nueva Contraseña */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirmar Nueva Contraseña *
            </label>
            <input
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) => {
                setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                if (passwordErrors.confirmPassword) {
                  setPasswordErrors({ ...passwordErrors, confirmPassword: '' })
                }
              }}
              className={`w-full px-4 py-2 border-2 rounded-lg transition-all ${
                passwordErrors.confirmPassword
                  ? 'border-red-500 bg-red-50 focus:border-red-600'
                  : 'border-gray-300 focus:border-blue-500'
              } focus:ring-2 focus:ring-blue-100`}
              placeholder="••••••••"
              disabled={changingPassword}
            />
            {passwordErrors.confirmPassword && (
              <p className="text-red-600 text-sm mt-1 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {passwordErrors.confirmPassword}
              </p>
            )}
          </div>

          {/* Botones */}
          <div className="flex space-x-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setActiveSection(null)
                setPasswordForm({
                  currentPassword: '',
                  newPassword: '',
                  confirmPassword: ''
                })
                setPasswordErrors({})
              }}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              disabled={changingPassword}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={changingPassword}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {changingPassword ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Actualizando...
                </>
              ) : (
                'Actualizar'
              )}
            </button>
          </div>
        </form>
      </div>
    )
  }

  // Vista principal
  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50 animate-slideDown"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-700 dark:to-cyan-700 px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-white" />
            <h3 className="text-white font-semibold text-lg">Configuración</h3>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* User Info */}
      <div className="px-5 py-4 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-gray-700 dark:to-gray-750 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
            {user?.nombre?.charAt(0)}{user?.apellido?.charAt(0)}
          </div>
          <div className="flex-1">
            <p className="text-base font-semibold text-gray-800 dark:text-white">
              {user?.nombre} {user?.apellido}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300">{user?.email}</p>
            <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-1">{user?.cargo}</p>
          </div>
        </div>
      </div>

      {/* Settings Menu */}
      <div className="max-h-96 overflow-y-auto bg-white dark:bg-gray-800">
        {menuItems.map((item) => {
          const IconComponent = item.icon
          const isThemeItem = item.id === 'theme'
          return (
            <button
              key={item.id}
              onClick={item.action}
              className={`w-full px-5 py-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left group ${
                isThemeItem ? 'bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-750' : ''
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`p-2 ${isThemeItem ? 'bg-gradient-to-br from-blue-500 to-purple-600' : 'bg-blue-50 dark:bg-gray-700'} ${isThemeItem ? 'text-white' : 'text-blue-600 dark:text-blue-400'} rounded-xl group-hover:bg-blue-100 dark:group-hover:bg-gray-600 transition-colors ${isThemeItem ? 'shadow-lg' : ''}`}>
                  <IconComponent className={`w-5 h-5 ${isThemeItem ? 'animate-pulse' : ''}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${isThemeItem ? 'text-blue-700 dark:text-blue-300' : 'text-gray-800 dark:text-white'} group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors`}>
                    {item.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {item.description}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
              </div>
            </button>
          )
        })}
      </div>

      {/* Footer - Logout */}
      <div className="px-5 py-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 rounded-xl transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
        >
          <LogOut className="w-4 h-4" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </div>
  )
}

export default SettingsDropdown
