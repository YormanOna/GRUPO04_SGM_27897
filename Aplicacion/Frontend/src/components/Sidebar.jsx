import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  UserCheck, 
  Pill,
  Activity,
  ChevronLeft,
  ChevronRight,
  Stethoscope,
  Clock,
  FileText,
  Shield,
  UserCog
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const Sidebar = () => {
  const location = useLocation()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { user } = useAuth()

  // Definir roles
  const isSuperAdmin = user?.cargo === 'Admin General'
  const isAdmin = user?.cargo === 'Administrador'
  const isMedic = user?.cargo === 'Medico'
  const isNurse = user?.cargo === 'Enfermera'
  const isPharmacist = user?.cargo === 'Farmaceutico'

  // Todos los items del menú con roles permitidos
  const allMenuItems = [
    { 
      path: '/', 
      icon: LayoutDashboard, 
      label: 'Dashboard', 
      gradient: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      roles: ['Admin General', 'Administrador', 'Medico', 'Enfermera', 'Farmaceutico'] // Todos
    },
    { 
      path: '/asistencia', 
      icon: Clock, 
      label: 'Asistencia', 
      gradient: 'from-indigo-500 to-indigo-600',
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-600',
      roles: ['Admin General', 'Administrador', 'Medico', 'Enfermera', 'Farmaceutico'] // Todos
    },
    { 
      path: '/pacientes', 
      icon: Users, 
      label: 'Pacientes', 
      gradient: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
      roles: ['Admin General', 'Administrador', 'Medico', 'Enfermera'] // Enfermera solo lectura
    },
    { 
      path: '/citas', 
      icon: Calendar, 
      label: 'Citas del Día', 
      gradient: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
      roles: ['Admin General', 'Administrador', 'Medico', 'Enfermera'] // Enfermera ve citas para toma de signos vitales
    },
    { 
      path: '/citas/calendario', 
      icon: Calendar, 
      label: 'Calendario', 
      gradient: 'from-violet-500 to-purple-600',
      bgColor: 'bg-violet-50',
      textColor: 'text-violet-600',
      roles: ['Admin General', 'Administrador', 'Medico'] // Solo Admin, recepción y médicos (NO enfermera)
    },
    { 
      path: '/medicos', 
      icon: UserCheck, 
      label: 'Médicos', 
      gradient: 'from-cyan-500 to-cyan-600',
      bgColor: 'bg-cyan-50',
      textColor: 'text-cyan-600',
      roles: ['Admin General', 'Administrador'] // Solo Admin General y recepcionistas (gestión administrativa)
    },
    { 
      path: '/enfermeria/signos-vitales', 
      icon: Activity, 
      label: 'Signos Vitales', 
      gradient: 'from-emerald-500 to-emerald-600',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-600',
      roles: ['Admin General', 'Enfermera'] // Solo Admin General y enfermeras
    },
    { 
      path: '/consulta-medica', 
      icon: Stethoscope, 
      label: 'Consulta Médica', 
      gradient: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      roles: ['Admin General', 'Medico'] // Solo Admin General y médicos
    },
    { 
      path: '/expediente', 
      icon: FileText, 
      label: 'Expediente Clínico', 
      gradient: 'from-teal-500 to-teal-600',
      bgColor: 'bg-teal-50',
      textColor: 'text-teal-600',
      roles: ['Admin General', 'Administrador', 'Medico', 'Enfermera', 'Farmaceutico'] // Todos - filtrado por rol en backend
    },
    { 
      path: '/recetas', 
      icon: Pill, 
      label: 'Recetas', 
      gradient: 'from-pink-500 to-pink-600',
      bgColor: 'bg-pink-50',
      textColor: 'text-pink-600',
      roles: ['Admin General', 'Medico', 'Farmaceutico'] // Solo Admin General, médicos y farmacia
    },
    { 
      path: '/farmacia', 
      icon: Activity, 
      label: 'Farmacia', 
      gradient: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600',
      roles: ['Admin General', 'Farmaceutico'] // Solo Admin General y farmacéutico
    },
    { 
      path: '/admin/empleados', 
      icon: UserCog, 
      label: 'Gestión de Usuarios', 
      gradient: 'from-blue-600 to-indigo-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
      roles: ['Admin General'] // Solo Admin General (superadmin)
    },
    { 
      path: '/admin/auditoria', 
      icon: Shield, 
      label: 'Auditoría', 
      gradient: 'from-purple-600 to-pink-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
      roles: ['Admin General'] // Solo Admin General (superadmin)
    },
  ]

  // Filtrar items según el rol del usuario
  const menuItems = allMenuItems.filter(item => 
    item.roles.includes(user?.cargo)
  )

  const isActive = (path) => location.pathname === path

  return (
    <aside 
      className={`bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-300 shadow-xl relative ${
        isCollapsed ? 'w-24' : 'w-72'
      }`}
    >
      {/* Header del Sidebar */}
      <div className={`border-b border-gray-200 dark:border-gray-700 flex items-center bg-gradient-to-r from-blue-500 to-cyan-500 dark:from-blue-600 dark:to-cyan-600 ${
        isCollapsed ? 'justify-center p-4' : 'justify-between p-6'
      }`}>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`flex items-center transition-all duration-200 ${
            isCollapsed ? 'justify-center hover:scale-110 w-full' : 'space-x-3'
          }`}
          title={isCollapsed ? 'Abrir menú' : ''}
        >
          <div className={`bg-white rounded-xl flex items-center justify-center shadow-lg transition-all duration-200 ${
            isCollapsed ? 'w-10 h-10 p-1.5 hover:shadow-xl mx-auto' : 'w-14 h-14 p-2'
          }`}>
            <img 
              src="/Images/logo.png" 
              alt="Logo" 
              className="w-full h-full object-contain"
            />
          </div>
        </button>
        {!isCollapsed && (
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 hover:bg-white/20 rounded-lg transition-all duration-200 backdrop-blur-sm border border-white/30"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
        )}
      </div>

      {/* Menú de navegación */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.path)
            
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center ${isCollapsed ? 'justify-center px-2 py-4' : 'space-x-3 px-4 py-3.5'} rounded-xl transition-all duration-200 group relative overflow-hidden ${
                    active
                      ? `bg-gradient-to-r ${item.gradient} text-white shadow-lg ${isCollapsed ? 'scale-110' : 'scale-105'}`
                      : `${item.bgColor} ${item.textColor} hover:scale-110 hover:shadow-xl hover:brightness-95`
                  }`}
                  title={isCollapsed ? item.label : ''}
                >
                  {/* Efecto de brillo en hover - solo cuando NO está activo */}
                  {!active && (
                    <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r ${item.gradient}`}
                      style={{ mixBlendMode: 'soft-light' }}
                    ></div>
                  )}
                  
                  <Icon 
                    className={`${isCollapsed ? 'w-7 h-7' : 'w-5 h-5'} ${
                      active ? 'text-white' : ''
                    } group-hover:scale-125 transition-transform relative z-10 drop-shadow-sm`} 
                  />
                  {!isCollapsed && (
                    <span className={`font-semibold relative z-10 ${active ? 'text-white' : ''}`}>
                      {item.label}
                    </span>
                  )}
                  {!isCollapsed && active && (
                    <div className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse relative z-10"></div>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}

export default Sidebar

