import React, { useState, useEffect, useMemo } from 'react'
import { Calendar, dateFnsLocalizer } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { es } from 'date-fns/locale'
import { getCitas, deleteCita, updateCita } from '../../services/citaService'
import { getMedicos } from '../../services/medicoService'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import useWebSocket from '../../hooks/useWebSocket'
import { 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  MapPin, 
  Phone,
  AlertCircle,
  CheckCircle,
  XCircle,
  Filter,
  Download,
  Edit,
  Trash2,
  Eye
} from 'lucide-react'
import toast from 'react-hot-toast'
import Swal from 'sweetalert2'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import './CitaCalendar.css'

// Configurar localizador con date-fns en español
const locales = {
  es: es,
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
})

// Mensajes en español para el calendario
const messages = {
  allDay: 'Todo el día',
  previous: 'Anterior',
  next: 'Siguiente',
  today: 'Hoy',
  month: 'Mes',
  week: 'Semana',
  day: 'Día',
  agenda: 'Agenda',
  date: 'Fecha',
  time: 'Hora',
  event: 'Cita',
  noEventsInRange: 'No hay citas en este rango de fechas',
  showMore: total => `+ Ver más (${total})`,
}

const CitaCalendar = () => {
  const [citas, setCitas] = useState([])
  const [medicos, setMedicos] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [filtroEstado, setFiltroEstado] = useState('todas')
  const [filtroMedico, setFiltroMedico] = useState('todos')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [currentView, setCurrentView] = useState('month')
  const [selectedDate, setSelectedDate] = useState(null) // Día seleccionado para ver citas
  const [citasDelDia, setCitasDelDia] = useState([])
  const { user } = useAuth()
  const navigate = useNavigate()
  const { lastUpdate } = useWebSocket()

  const isMedico = user?.cargo === 'Medico' || user?.cargo === 'Médico'

  useEffect(() => {
    cargarDatos()
  }, [])

  // Recargar automáticamente cuando hay cambios en citas vía WebSocket
  useEffect(() => {
    if (lastUpdate && (lastUpdate.type === 'cita_creada' || lastUpdate.type === 'cita_actualizada')) {
      console.log('🔄 Recargando citas por WebSocket:', lastUpdate.type)
      cargarDatos()
    }
  }, [lastUpdate])

  const cargarDatos = async () => {
    try {
      setLoading(true)
      const [citasData, medicosData] = await Promise.all([
        getCitas(),
        isMedico ? [] : getMedicos()
      ])
      
      console.log('📅 Citas cargadas desde API:', citasData)
      console.log('📅 Total de citas:', citasData.length)
      console.log('📅 Primera cita (ejemplo):', citasData[0])
      
      setCitas(citasData)
      if (!isMedico) {
        setMedicos(medicosData)
      }
    } catch (error) {
      console.error('Error al cargar datos:', error)
      toast.error('Error al cargar las citas')
    } finally {
      setLoading(false)
    }
  }

  // Convertir citas a eventos del calendario
  const events = useMemo(() => {
    let citasFiltradas = citas

    console.log('📅 Total de citas cargadas desde API:', citas.length)
    if (citas.length > 0) {
      console.log('📅 Primera cita (ejemplo):', citas[0])
      console.log('📅 Detalles: medico_id:', citas[0].medico_id, 'estado:', citas[0].estado, 'fecha:', citas[0].fecha)
    }

    // IMPORTANTE: Si es médico, el backend YA filtró las citas en la API
    // No necesitamos filtrar nuevamente aquí
    if (isMedico) {
      console.log('�‍⚕️ Usuario médico - El backend ya filtró las citas')
      console.log('📅 Citas del médico:', citasFiltradas.length)
    } else if (filtroMedico !== 'todos') {
      // Solo aplicar filtro de médico si NO es médico (admin/enfermera viendo citas)
      citasFiltradas = citasFiltradas.filter(cita => cita.medico_id === parseInt(filtroMedico))
      console.log('📅 Filtrado por médico ID:', filtroMedico, '- Citas encontradas:', citasFiltradas.length)
    }

    // Filtrar por estado
    if (filtroEstado !== 'todas') {
      citasFiltradas = citasFiltradas.filter(cita => {
        const citaEstado = (cita.estado || '').toLowerCase()
        return citaEstado === filtroEstado
      })
      console.log('📅 Filtrado por estado:', filtroEstado, '- Citas encontradas:', citasFiltradas.length)
    }

    console.log('📅 Citas después de todos los filtros:', citasFiltradas.length)

    return citasFiltradas.map(cita => {
      try {
        // La fecha viene del backend como string ISO: "2025-11-01T09:00:00"
        let fechaInicio
        
        if (cita.fecha) {
          // Convertir la fecha ISO a Date - IMPORTANTE: manejar zona horaria local
          const fechaStr = cita.fecha.replace('Z', '') // Eliminar Z si existe para usar hora local
          fechaInicio = new Date(fechaStr)
          
          // Validar que la fecha sea válida
          if (isNaN(fechaInicio.getTime())) {
            console.warn('Fecha inválida para cita:', cita.id, cita.fecha)
            fechaInicio = new Date()
          }
        } else {
          console.warn('Cita sin fecha:', cita.id)
          fechaInicio = new Date()
        }

        // Calcular fecha de fin (usar hora_fin si existe, sino agregar 30 minutos)
        let fechaFin
        if (cita.hora_fin && cita.hora_inicio) {
          // Si tiene hora_fin, calcular la duración real
          const [horaInicio, minInicio] = cita.hora_inicio.split(':').map(Number)
          const [horaFin, minFin] = cita.hora_fin.split(':').map(Number)
          
          fechaFin = new Date(fechaInicio)
          fechaFin.setHours(horaFin, minFin, 0)
        } else {
          // Por defecto, 30 minutos de duración
          fechaFin = new Date(fechaInicio.getTime() + 30 * 60000)
        }

        return {
          id: cita.id,
          title: `${cita.paciente_nombre || 'Paciente'} ${cita.paciente_apellido || ''}`,
          start: fechaInicio,
          end: fechaFin,
          resource: cita,
        }
      } catch (error) {
        console.error('❌ Error procesando cita:', cita, error)
        return null
      }
    }).filter(Boolean) // Eliminar eventos nulos
  }, [citas, filtroEstado, filtroMedico, isMedico, user])

  // Estilos para los eventos según su estado
  const eventStyleGetter = (event) => {
    const cita = event.resource
    let backgroundColor = '#3b82f6' // azul por defecto
    
    const estadoLower = (cita.estado || '').toLowerCase()
    
    switch(estadoLower) {
      case 'pendiente':
      case 'programada':
        backgroundColor = '#f59e0b' // amarillo
        break
      case 'confirmada':
        backgroundColor = '#10b981' // verde
        break
      case 'cancelada':
        backgroundColor = '#ef4444' // rojo
        break
      case 'completada':
        backgroundColor = '#6366f1' // índigo
        break
      default:
        backgroundColor = '#3b82f6'
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '6px',
        opacity: 0.9,
        color: 'white',
        border: '0px',
        display: 'block',
        fontSize: '0.85rem',
        fontWeight: '500',
      }
    }
  }

  const handleSelectEvent = (event) => {
    setSelectedEvent(event.resource)
  }

  const handleSelectSlot = (slotInfo) => {
    // Al hacer clic en un día, mostrar las citas de ese día
    const fecha = slotInfo.start
    setSelectedDate(fecha)
    
    // Filtrar citas del día seleccionado - Comparar solo la parte de la fecha
    const citasDelDiaSeleccionado = events.filter(event => {
      const eventDate = new Date(event.start)
      // Normalizar ambas fechas a medianoche en hora local para comparar solo el día
      const eventDateNormalized = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate())
      const fechaNormalized = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate())
      return eventDateNormalized.getTime() === fechaNormalized.getTime()
    }).map(event => event.resource)
    
    setCitasDelDia(citasDelDiaSeleccionado)
  }

  const handleCloseModal = () => {
    setSelectedEvent(null)
  }

  const handleCloseDayView = () => {
    setSelectedDate(null)
    setCitasDelDia([])
  }

  const handleVerDetalle = (id) => {
    navigate(`/citas/${id}`)
  }

  const handleEditar = (id) => {
    navigate(`/citas/editar/${id}`)
  }

  const handleEliminar = async (id) => {
    const result = await Swal.fire({
      title: '¿Eliminar cita?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: '🗑️ Sí, eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    })

    if (!result.isConfirmed) return

    try {
      await deleteCita(id)
      Swal.fire({
        icon: 'success',
        title: '¡Eliminada!',
        text: 'Cita eliminada exitosamente',
        timer: 2000,
        showConfirmButton: false
      })
      setSelectedEvent(null)
      cargarDatos() // Recargar citas
    } catch (error) {
      console.error('Error al eliminar cita:', error)
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo eliminar la cita',
        confirmButtonColor: '#ef4444'
      })
    }
  }

  const handleCambiarEstado = async (id, nuevoEstado) => {
    try {
      await updateCita(id, { estado: nuevoEstado })
      toast.success(`Estado actualizado a: ${nuevoEstado}`)
      setSelectedEvent(null)
      cargarDatos() // Recargar citas
    } catch (error) {
      console.error('Error al actualizar estado:', error)
      toast.error('Error al actualizar el estado')
    }
  }

  const getEstadoBadgeColor = (estado) => {
    const estadoLower = (estado || '').toLowerCase()
    switch(estadoLower) {
      case 'pendiente':
      case 'programada': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'confirmada': return 'bg-green-100 text-green-800 border-green-300'
      case 'cancelada': return 'bg-red-100 text-red-800 border-red-300'
      case 'completada': return 'bg-indigo-100 text-indigo-800 border-indigo-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getEstadoIcon = (estado) => {
    const estadoLower = (estado || '').toLowerCase()
    switch(estadoLower) {
      case 'pendiente':
      case 'programada': return <Clock className="w-4 h-4" />
      case 'confirmada': return <CheckCircle className="w-4 h-4" />
      case 'cancelada': return <XCircle className="w-4 h-4" />
      case 'completada': return <CheckCircle className="w-4 h-4" />
      default: return <AlertCircle className="w-4 h-4" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Cargando calendario...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg">
              <CalendarIcon className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Calendario de Citas</h2>
              <p className="text-gray-600 mt-1">
                {isMedico ? 'Mis citas programadas' : 'Vista general de todas las citas'}
              </p>
            </div>
          </div>
        </div>

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-5 shadow-lg border border-yellow-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Programadas</p>
                <p className="text-2xl font-bold text-yellow-700">
                  {citas.filter(c => (c.estado || '').toLowerCase() === 'programada').length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 shadow-lg border border-green-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Confirmadas</p>
                <p className="text-2xl font-bold text-green-700">
                  {citas.filter(c => (c.estado || '').toLowerCase() === 'confirmada').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-5 shadow-lg border border-indigo-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Completadas</p>
                <p className="text-2xl font-bold text-indigo-700">
                  {citas.filter(c => (c.estado || '').toLowerCase() === 'completada').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-indigo-600" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-xl p-5 shadow-lg border border-red-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Canceladas</p>
                <p className="text-2xl font-bold text-red-700">
                  {citas.filter(c => (c.estado || '').toLowerCase() === 'cancelada').length}
                </p>
              </div>
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200/50">
          <div className="flex items-center space-x-4 mb-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-800">Filtros</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Filtro por estado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado de la cita
              </label>
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              >
                <option value="todas">Todas las citas</option>
                <option value="programada">Programadas</option>
                <option value="confirmada">Confirmadas</option>
                <option value="completada">Completadas</option>
                <option value="cancelada">Canceladas</option>
              </select>
            </div>

            {/* Filtro por médico (solo para admin y enfermeras) */}
            {!isMedico && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Médico
                </label>
                <select
                  value={filtroMedico}
                  onChange={(e) => setFiltroMedico(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                >
                  <option value="todos">Todos los médicos</option>
                  {medicos.map(medico => (
                    <option key={medico.id} value={medico.id}>
                      Dr. {medico.empleado_nombre} {medico.empleado_apellido} - {medico.especialidad}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Calendario */}
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-200/50" style={{ height: '700px' }}>
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            messages={messages}
            culture="es"
            date={currentDate}
            view={currentView}
            onNavigate={date => setCurrentDate(date)}
            onView={view => setCurrentView(view)}
            style={{ height: '100%' }}
            eventPropGetter={eventStyleGetter}
            onSelectEvent={handleSelectEvent}
            onSelectSlot={handleSelectSlot}
            views={['month', 'week', 'day', 'agenda']}
            popup
            selectable
            step={30}
            timeslots={2}
            showMultiDayTimes
            scrollToTime={new Date(1970, 1, 1, 8, 0, 0)}
            defaultDate={new Date()}
            className="custom-calendar"
          />
        </div>

      </div>

      {/* Panel lateral de citas del día - DISEÑO MEJORADO */}
      {selectedDate && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-40 p-4 backdrop-blur-md animate-fadeIn">
          <div className="bg-gradient-to-br from-white via-gray-50 to-blue-50 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-gray-200/50 animate-slideUp">
            {/* Header Mejorado */}
            <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 p-8 overflow-hidden">
              {/* Patrón de fondo decorativo */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 left-0 w-40 h-40 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute bottom-0 right-0 w-60 h-60 bg-white rounded-full translate-x-1/3 translate-y-1/3"></div>
              </div>
              
              <div className="relative flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-xl border border-white/30">
                    <CalendarIcon className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold text-white drop-shadow-lg">
                      {selectedDate.toLocaleDateString('es-ES', { 
                        weekday: 'long', 
                        day: 'numeric', 
                        month: 'long'
                      })}
                    </h3>
                    <div className="flex items-center space-x-2 mt-2">
                      <div className="px-4 py-1.5 bg-white/30 backdrop-blur-md rounded-full border border-white/40">
                        <p className="text-white font-semibold text-sm">
                          {citasDelDia.length} {citasDelDia.length === 1 ? 'cita' : 'citas'}
                        </p>
                      </div>
                      <div className="px-4 py-1.5 bg-white/30 backdrop-blur-md rounded-full border border-white/40">
                        <p className="text-white font-semibold text-sm">
                          {selectedDate.getFullYear()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleCloseDayView}
                  className="text-white hover:bg-white/20 rounded-xl p-3 transition-all duration-200 backdrop-blur-sm border border-white/30 hover:scale-110"
                >
                  <XCircle className="w-7 h-7" />
                </button>
              </div>
            </div>

            {/* Lista de citas - DISEÑO MEJORADO */}
            <div className="p-8 overflow-y-auto max-h-[70vh] custom-scrollbar">
              {citasDelDia.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                    <CalendarIcon className="w-12 h-12 text-gray-400" />
                  </div>
                  <p className="text-gray-600 text-xl font-semibold mb-2">No hay citas programadas</p>
                  <p className="text-gray-400">Seleccione otro día o agregue una nueva cita</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {citasDelDia
                    .sort((a, b) => {
                      // Ordenar por hora de inicio
                      const horaA = a.hora_inicio || '00:00'
                      const horaB = b.hora_inicio || '00:00'
                      return horaA.localeCompare(horaB)
                    })
                    .map((cita, index) => (
                    <div 
                      key={cita.id} 
                      className="group relative bg-white rounded-2xl p-6 hover:shadow-2xl transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-indigo-300 transform hover:-translate-y-1"
                      onClick={() => {
                        setSelectedEvent(cita)
                        handleCloseDayView()
                      }}
                      style={{
                        animation: `slideInRight 0.4s ease-out ${index * 0.1}s both`
                      }}
                    >
                      {/* Línea decorativa de hora a la izquierda */}
                      <div className="absolute left-0 top-6 bottom-6 w-1 bg-gradient-to-b from-indigo-400 via-purple-400 to-pink-400 rounded-full group-hover:w-2 transition-all duration-300"></div>
                      
                      <div className="flex items-start justify-between">
                        <div className="flex-1 pl-4">
                          {/* Hora destacada */}
                          <div className="flex items-center space-x-4 mb-4">
                            <div className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200">
                              <Clock className="w-5 h-5 text-indigo-600" />
                              <span className="text-lg font-bold text-indigo-700">
                                {cita.hora_inicio && cita.hora_fin 
                                  ? `${cita.hora_inicio.slice(0,5)} - ${cita.hora_fin.slice(0,5)}`
                                  : cita.fecha 
                                  ? new Date(cita.fecha).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
                                  : 'Sin hora'
                                }
                              </span>
                            </div>
                            <span className={`inline-flex items-center space-x-2 px-4 py-2 rounded-xl border-2 font-bold text-sm shadow-sm ${getEstadoBadgeColor(cita.estado)}`}>
                              {getEstadoIcon(cita.estado)}
                              <span>{cita.estado}</span>
                            </span>
                          </div>

                          {/* Paciente - Destacado */}
                          <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-200">
                            <div className="flex items-center space-x-3 mb-2">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center shadow-lg">
                                <User className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <p className="text-xs text-gray-600 font-medium">Paciente</p>
                                <p className="text-lg font-bold text-gray-800">
                                  {cita.paciente_nombre} {cita.paciente_apellido}
                                </p>
                              </div>
                            </div>
                            {cita.paciente_cedula && (
                              <p className="text-sm text-gray-600 ml-13 flex items-center space-x-2">
                                <span className="font-medium">CI:</span>
                                <span className="font-mono">{cita.paciente_cedula}</span>
                              </p>
                            )}
                          </div>

                          {/* Médico */}
                          {cita.medico_nombre && (
                            <div className="mb-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                              <div className="flex items-center space-x-3 mb-2">
                                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
                                  <User className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                  <p className="text-xs text-gray-600 font-medium">Médico</p>
                                  <p className="font-bold text-gray-800">
                                    Dr. {cita.medico_nombre} {cita.medico_apellido}
                                  </p>
                                </div>
                              </div>
                              {cita.medico_especialidad && (
                                <p className="text-sm text-purple-700 ml-13 font-semibold">
                                  {cita.medico_especialidad}
                                </p>
                              )}
                            </div>
                          )}

                          {/* Motivo */}
                          {cita.motivo && (
                            <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                              <p className="text-xs text-gray-500 font-medium mb-1">Motivo de consulta</p>
                              <p className="text-sm text-gray-700">{cita.motivo}</p>
                            </div>
                          )}
                        </div>

                        {/* Acciones rápidas - Verticales a la derecha */}
                        <div className="flex flex-col space-y-3 ml-6">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditar(cita.id)
                            }}
                            className="group/btn p-3 bg-gradient-to-br from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-110"
                            title="Editar"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedEvent(cita)
                              handleCloseDayView()
                            }}
                            className="group/btn p-3 bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-110"
                            title="Ver detalle"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer Mejorado */}
            <div className="p-6 bg-gradient-to-r from-gray-50 to-blue-50 border-t-2 border-gray-200 flex justify-between items-center">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <CalendarIcon className="w-4 h-4" />
                <span>Haga clic en una cita para ver más detalles</span>
              </div>
              <button
                onClick={handleCloseDayView}
                className="px-8 py-3 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de detalle de cita */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header del modal */}
            <div className="bg-gradient-to-r from-purple-500 via-purple-600 to-indigo-600 p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <CalendarIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">Detalle de la Cita</h3>
                    <p className="text-purple-100 text-sm mt-1">Información completa</p>
                  </div>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Contenido del modal */}
            <div className="p-6 space-y-6">
              
              {/* Estado */}
              <div className="flex items-center justify-center">
                <span className={`inline-flex items-center space-x-2 px-6 py-3 rounded-xl border-2 font-semibold text-sm ${getEstadoBadgeColor(selectedEvent.estado)}`}>
                  {getEstadoIcon(selectedEvent.estado)}
                  <span>{selectedEvent.estado}</span>
                </span>
              </div>

              {/* Información del paciente */}
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center space-x-2">
                  <User className="w-5 h-5 text-blue-600" />
                  <span>Paciente</span>
                </h4>
                <div className="space-y-2">
                  <p className="text-gray-700">
                    <span className="font-medium">Nombre:</span> {selectedEvent.paciente_nombre} {selectedEvent.paciente_apellido}
                  </p>
                  <p className="text-gray-700">
                    <span className="font-medium">Cédula:</span> {selectedEvent.paciente_cedula}
                  </p>
                  {selectedEvent.paciente_telefono && (
                    <p className="text-gray-700 flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-blue-600" />
                      <span>{selectedEvent.paciente_telefono}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Información del médico */}
              <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center space-x-2">
                  <User className="w-5 h-5 text-purple-600" />
                  <span>Médico</span>
                </h4>
                <div className="space-y-2">
                  <p className="text-gray-700">
                    <span className="font-medium">Dr./Dra.:</span> {selectedEvent.medico_nombre} {selectedEvent.medico_apellido}
                  </p>
                  <p className="text-gray-700">
                    <span className="font-medium">Especialidad:</span> {selectedEvent.medico_especialidad}
                  </p>
                </div>
              </div>

              {/* Fecha y hora */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                  <h4 className="font-semibold text-gray-800 mb-2 flex items-center space-x-2">
                    <CalendarIcon className="w-4 h-4 text-green-600" />
                    <span>Fecha</span>
                  </h4>
                  <p className="text-gray-700 font-medium">
                    {selectedEvent.fecha ? new Date(selectedEvent.fecha).toLocaleDateString('es-ES', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }) : 'No disponible'}
                  </p>
                </div>
                <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
                  <h4 className="font-semibold text-gray-800 mb-2 flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-orange-600" />
                    <span>Horario</span>
                  </h4>
                  <p className="text-gray-700 font-medium">
                    {selectedEvent.hora_inicio && selectedEvent.hora_fin 
                      ? `${selectedEvent.hora_inicio.slice(0,5)} - ${selectedEvent.hora_fin.slice(0,5)}`
                      : selectedEvent.fecha 
                      ? new Date(selectedEvent.fecha).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
                      : 'No disponible'
                    }
                  </p>
                </div>
              </div>

              {/* Motivo */}
              {selectedEvent.motivo && (
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <h4 className="font-semibold text-gray-800 mb-2">Motivo de la consulta</h4>
                  <p className="text-gray-700">{selectedEvent.motivo}</p>
                </div>
              )}

              {/* Observaciones */}
              {selectedEvent.observaciones && (
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <h4 className="font-semibold text-gray-800 mb-2">Observaciones</h4>
                  <p className="text-gray-700">{selectedEvent.observaciones}</p>
                </div>
              )}

              {/* Acciones rápidas - Cambiar estado */}
              {((selectedEvent.estado || '').toLowerCase() !== 'cancelada') && ((selectedEvent.estado || '').toLowerCase() !== 'completada') && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                  <h4 className="font-semibold text-gray-800 mb-3">Acciones Rápidas</h4>
                  <div className="flex flex-wrap gap-2">
                    {((selectedEvent.estado || '').toLowerCase() === 'pendiente' || (selectedEvent.estado || '').toLowerCase() === 'programada') && (
                      <button
                        onClick={() => handleCambiarEstado(selectedEvent.id, 'confirmada')}
                        className="flex items-center space-x-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-all"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Confirmar Cita</span>
                      </button>
                    )}
                    {(selectedEvent.estado || '').toLowerCase() === 'confirmada' && (
                      <button
                        onClick={() => handleCambiarEstado(selectedEvent.id, 'completada')}
                        className="flex items-center space-x-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium transition-all"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Marcar como Completada</span>
                      </button>
                    )}
                    <button
                      onClick={() => handleCambiarEstado(selectedEvent.id, 'cancelada')}
                      className="flex items-center space-x-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-all"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Cancelar Cita</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Botones de acción principales - SIN ELIMINAR */}
              <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => handleVerDetalle(selectedEvent.id)}
                  className="flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-4 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
                >
                  <Eye className="w-5 h-5" />
                  <span>Ver Detalle</span>
                </button>
                
                <button
                  onClick={() => handleEditar(selectedEvent.id)}
                  className="flex items-center justify-center space-x-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-4 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
                >
                  <Edit className="w-5 h-5" />
                  <span>Editar</span>
                </button>
                
                <button
                  onClick={handleCloseModal}
                  className="px-4 py-3 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CitaCalendar
