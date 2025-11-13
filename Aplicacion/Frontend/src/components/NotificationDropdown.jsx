import React, { useState, useEffect, useRef } from 'react'
import { Bell, X, Check, Clock, AlertCircle, UserPlus, Calendar, FileText, Pill } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import citaService from '../services/citaService'
import recetaService from '../services/recetaService'
import { getMedicamentos } from '../services/medicamentoService'
import toast from 'react-hot-toast'

const NotificationDropdown = ({ isOpen, onClose }) => {
  const { user } = useAuth()
  const dropdownRef = useRef(null)
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(false)
  const [dismissedNotifications, setDismissedNotifications] = useState(() => {
    // Cargar notificaciones eliminadas del localStorage
    const stored = localStorage.getItem('dismissedNotifications')
    return stored ? JSON.parse(stored) : []
  })

  // Cargar notificaciones reales según el rol
  useEffect(() => {
    if (isOpen && user) {
      loadRealNotifications()
    }
  }, [isOpen, user])

  // Guardar notificaciones eliminadas en localStorage
  useEffect(() => {
    localStorage.setItem('dismissedNotifications', JSON.stringify(dismissedNotifications))
  }, [dismissedNotifications])

  const loadRealNotifications = async () => {
    setLoading(true)
    try {
      const hoy = new Date().toISOString().split('T')[0]
      const notifs = []

      if (user?.cargo === 'Enfermero' || user?.cargo === 'Enfermera') {
        // Cargar citas confirmadas del día (pacientes en espera)
        try {
          const citasResponse = await citaService.listar({ fecha: hoy, estado: 'confirmada' })
          const citasConfirmadas = citasResponse.data || []
          
          if (citasConfirmadas.length > 0) {
            notifs.push({
              id: `enfermera-citas-${Date.now()}`,
              type: 'alert',
              icon: UserPlus,
              title: 'Pacientes en espera',
              message: `${citasConfirmadas.length} paciente${citasConfirmadas.length > 1 ? 's' : ''} esperando registro de signos vitales`,
              time: 'Ahora',
              unread: true
            })

            // Agregar notificación por cada paciente (máximo 3)
            citasConfirmadas.slice(0, 3).forEach((cita, index) => {
              notifs.push({
                id: `cita-${cita.id}`,
                type: 'info',
                icon: Calendar,
                title: 'Cita confirmada',
                message: `${cita.paciente?.nombre} ${cita.paciente?.apellido} - ${new Date(cita.fecha).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`,
                time: `Hace ${index + 1} minuto${index > 0 ? 's' : ''}`,
                unread: true,
                data: cita
              })
            })
          }
        } catch (error) {
          console.error('Error cargando citas:', error)
        }
      }

      if (user?.cargo === 'Medico' || user?.cargo === 'Médico') {
        // Cargar pacientes listos para consulta (estado en_consulta)
        try {
          const citasResponse = await citaService.listar({ 
            fecha: hoy, 
            estado: 'en_consulta',
            medico_id: user.id 
          })
          const pacientesListos = citasResponse.data || []
          
          if (pacientesListos.length > 0) {
            notifs.push({
              id: `medico-cola-${Date.now()}`,
              type: 'alert',
              icon: Clock,
              title: 'Pacientes listos para consulta',
              message: `${pacientesListos.length} paciente${pacientesListos.length > 1 ? 's' : ''} con signos vitales registrados`,
              time: 'Ahora',
              unread: true
            })

            // Agregar notificación por cada paciente
            pacientesListos.slice(0, 3).forEach((cita, index) => {
              notifs.push({
                id: `paciente-listo-${cita.id}`,
                type: 'info',
                icon: FileText,
                title: 'Paciente listo',
                message: `${cita.paciente?.nombre} ${cita.paciente?.apellido} - ${cita.sala_asignada || 'Sin sala'}`,
                time: `Hace ${index + 2} minuto${index > 0 ? 's' : ''}`,
                unread: true,
                data: cita
              })
            })
          }
        } catch (error) {
          console.error('Error cargando pacientes listos:', error)
        }
      }

      if (user?.cargo === 'Farmaceutico' || user?.cargo === 'Farmacéutico') {
        // Cargar recetas pendientes
        try {
          const recetasResponse = await recetaService.listarRecetas({ estado: 'pendiente' })
          const recetasPendientes = recetasResponse.data || []
          
          if (recetasPendientes.length > 0) {
            notifs.push({
              id: `farmacia-recetas-${Date.now()}`,
              type: 'alert',
              icon: Pill,
              title: 'Recetas pendientes',
              message: `${recetasPendientes.length} receta${recetasPendientes.length > 1 ? 's' : ''} pendiente${recetasPendientes.length > 1 ? 's' : ''} de despacho`,
              time: 'Ahora',
              unread: true
            })

            // Mostrar recetas individuales
            recetasPendientes.slice(0, 2).forEach((receta, index) => {
              notifs.push({
                id: `receta-${receta.id}`,
                type: 'info',
                icon: Pill,
                title: `Receta #${receta.id}`,
                message: `Paciente: ${receta.paciente?.nombre || 'N/A'} - Dr. ${receta.medico?.nombre || 'N/A'}`,
                time: `Hace ${index + 1} minuto${index > 0 ? 's' : ''}`,
                unread: true,
                data: receta
              })
            })
          }
        } catch (error) {
          console.error('Error cargando recetas:', error)
        }

        // Cargar medicamentos con stock bajo
        try {
          const medicamentos = await getMedicamentos()
          const stockBajo = medicamentos.filter(m => m.stock > 0 && m.stock < 10)
          const stockAgotado = medicamentos.filter(m => m.stock === 0)
          
          if (stockAgotado.length > 0) {
            notifs.push({
              id: `stock-agotado-${Date.now()}`,
              type: 'alert',
              icon: AlertCircle,
              title: 'Stock agotado',
              message: `${stockAgotado.length} medicamento${stockAgotado.length > 1 ? 's' : ''} sin stock`,
              time: 'Hace 5 minutos',
              unread: true
            })
          }

          if (stockBajo.length > 0) {
            stockBajo.slice(0, 2).forEach((med, index) => {
              notifs.push({
                id: `stock-bajo-${med.id}`,
                type: 'warning',
                icon: AlertCircle,
                title: 'Stock bajo',
                message: `${med.nombre}${med.contenido ? ` ${med.contenido}` : ''} - ${med.stock} unidades`,
                time: `Hace ${10 + index * 5} minutos`,
                unread: false
              })
            })
          }
        } catch (error) {
          console.error('Error cargando medicamentos:', error)
        }
      }

      // Filtrar notificaciones eliminadas
      const filteredNotifs = notifs.filter(n => !dismissedNotifications.includes(n.id))

      // Si no hay notificaciones después de filtrar, mostrar mensaje general
      if (filteredNotifs.length === 0) {
        filteredNotifs.push({
          id: 'no-notifications',
          type: 'info',
          icon: Bell,
          title: 'Todo al día',
          message: 'No hay notificaciones pendientes en este momento',
          time: 'Ahora',
          unread: false
        })
      }

      setNotifications(filteredNotifs)
    } catch (error) {
      console.error('Error cargando notificaciones:', error)
      toast.error('Error al cargar notificaciones')
    } finally {
      setLoading(false)
    }
  }

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

  const markAsRead = (id) => {
    setNotifications(notifications.map(notif => 
      notif.id === id ? { ...notif, unread: false } : notif
    ))
  }

  const markAllAsRead = () => {
    setNotifications(notifications.map(notif => ({ ...notif, unread: false })))
  }

  const deleteNotification = (id) => {
    // Agregar a la lista de notificaciones eliminadas
    if (!dismissedNotifications.includes(id)) {
      setDismissedNotifications([...dismissedNotifications, id])
    }
    // Quitar de la lista actual
    setNotifications(notifications.filter(notif => notif.id !== id))
    toast.success('Notificación eliminada', { duration: 2000 })
  }

  const clearDismissedNotifications = () => {
    // Limpiar notificaciones eliminadas (útil para testing o reset)
    setDismissedNotifications([])
    localStorage.removeItem('dismissedNotifications')
    loadRealNotifications()
    toast.success('Historial de notificaciones limpiado')
  }

  const unreadCount = notifications.filter(n => n.unread).length

  const getIconColor = (type) => {
    switch (type) {
      case 'alert': return 'text-red-500 bg-red-50'
      case 'warning': return 'text-yellow-500 bg-yellow-50'
      case 'success': return 'text-green-500 bg-green-50'
      default: return 'text-blue-500 bg-blue-50'
    }
  }

  if (!isOpen) return null

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-50 animate-slideDown"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bell className="w-5 h-5 text-white" />
            <h3 className="text-white font-semibold text-lg">Notificaciones</h3>
            {unreadCount > 0 && (
              <span className="bg-white text-blue-600 text-xs font-bold px-2 py-1 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Actions */}
      {unreadCount > 0 && (
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
          <button
            onClick={markAllAsRead}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1"
          >
            <Check className="w-4 h-4" />
            <span>Marcar todas como leídas</span>
          </button>
        </div>
      )}

      {/* Notifications List */}
      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="px-5 py-12 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3"></div>
            <p className="text-gray-600 text-sm">Cargando notificaciones...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No tienes notificaciones</p>
          </div>
        ) : (
          notifications.map((notification) => {
            const IconComponent = notification.icon
            return (
              <div
                key={notification.id}
                className={`px-5 py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer group ${
                  notification.unread ? 'bg-blue-50/30' : ''
                }`}
                onClick={() => markAsRead(notification.id)}
              >
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-xl ${getIconColor(notification.type)} flex-shrink-0`}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-800 mb-1">
                          {notification.title}
                          {notification.unread && (
                            <span className="ml-2 inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
                          )}
                        </p>
                        <p className="text-sm text-gray-600 mb-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400">
                          {notification.time}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteNotification(notification.id)
                        }}
                        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all ml-2"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="px-5 py-3 bg-gray-50 border-t border-gray-200">
          <button className="text-sm text-blue-600 hover:text-blue-700 font-medium w-full text-center">
            Ver todas las notificaciones
          </button>
        </div>
      )}
    </div>
  )
}

export default NotificationDropdown
