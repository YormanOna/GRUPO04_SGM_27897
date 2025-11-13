import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Bell, User, LogOut, Settings, Menu, Building2 } from 'lucide-react'
import NotificationDropdown from './NotificationDropdown'
import SettingsDropdown from './SettingsDropdown'
import { useNotifications } from '../hooks/useNotifications'

const Navbar = () => {
  const { user, logout } = useAuth()
  const { unreadCount } = useNotifications()
  const [showNotifications, setShowNotifications] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  return (
    <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40 backdrop-blur-lg bg-white/95 dark:bg-gray-800/95 transition-colors duration-200">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Lado izquierdo - Título del Sistema */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800 dark:text-white">Sistema Hospitalario</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Gestión Médica Integral</p>
            </div>
          </div>

          {/* Lado derecho - Usuario y acciones */}
          {user && (
            <div className="flex items-center space-x-3">
              {/* Notificaciones */}
              <div className="relative">
                <button 
                  onClick={() => {
                    setShowNotifications(!showNotifications)
                    setShowSettings(false)
                  }}
                  className="relative p-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all duration-200 group"
                >
                  <Bell className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                <NotificationDropdown 
                  isOpen={showNotifications} 
                  onClose={() => setShowNotifications(false)} 
                />
              </div>

              {/* Configuración */}
              <div className="relative">
                <button 
                  onClick={() => {
                    setShowSettings(!showSettings)
                    setShowNotifications(false)
                  }}
                  className="p-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all duration-200 group"
                >
                  <Settings className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                </button>
                <SettingsDropdown 
                  isOpen={showSettings} 
                  onClose={() => setShowSettings(false)} 
                />
              </div>

              {/* Divisor */}
              <div className="h-10 w-px bg-gray-300 dark:bg-gray-600"></div>

              {/* Perfil del usuario */}
              <div className="flex items-center space-x-3 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-all cursor-pointer group">
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {user.nombre} {user.apellido}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{user.cargo}</p>
                </div>
                <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center text-white font-bold shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all">
                  {user.nombre?.charAt(0)}{user.apellido?.charAt(0)}
                </div>
              </div>

              {/* Botón cerrar sesión */}
              <button
                onClick={logout}
                className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 rounded-xl transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden lg:inline">Salir</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar

