import React, { useEffect, useState } from 'react'
import { getCitas, deleteCita, updateCita } from '../../services/citaService'
import { Link, useNavigate } from 'react-router-dom'
import { Calendar, Plus, Search, Clock, User, Stethoscope, Edit, Trash2, CheckCircle, XCircle, Activity, AlertCircle, UserCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import Swal from 'sweetalert2'
import { useAuth } from '../../context/AuthContext'
import useWebSocket from '../../hooks/useWebSocket'

const CitaList = () => {
  const [citas, setCitas] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('todas')
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const { user } = useAuth()
  const { lastUpdate } = useWebSocket()
  
  const isAdmin = user?.cargo === 'Administrador' || user?.cargo === 'Admin General'
  const isNurse = user?.cargo === 'Enfermera'
  const canManageCitas = !isNurse // Enfermera solo puede VER citas, no gestionarlas

  useEffect(() => {
    loadCitas()
  }, [])

  // Recargar automáticamente cuando hay cambios en citas vía WebSocket
  useEffect(() => {
    if (lastUpdate && (lastUpdate.type === 'cita_creada' || lastUpdate.type === 'cita_actualizada')) {
      console.log('🔄 Recargando lista de citas por WebSocket:', lastUpdate.type)
      loadCitas()
    }
  }, [lastUpdate])

  const loadCitas = async () => {
    try {
      const data = await getCitas()
      setCitas(data)
    } catch (error) {
      console.error('Error loading appointments:', error)
      toast.error('Error al cargar citas')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
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
      loadCitas()
    } catch (error) {
      console.error('Error deleting appointment:', error)
      if (error.response?.status === 403) {
        Swal.fire({
          icon: 'error',
          title: 'Sin permisos',
          text: 'No tienes permisos para eliminar citas',
          confirmButtonColor: '#ef4444'
        })
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo eliminar la cita',
          confirmButtonColor: '#ef4444'
        })
      }
    }
  }

  const handleEdit = (id) => {
    navigate(`/citas/editar/${id}`)
  }

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateCita(id, { estado: newStatus })
      toast.success('Estado actualizado')
      loadCitas()
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Error al actualizar estado')
    }
  }

  const handleTipoCitaChange = async (id, newTipo, currentTipo) => {
    // Confirmación especial para emergencias
    if (newTipo === 'emergencia' && currentTipo !== 'emergencia') {
      const result = await Swal.fire({
        title: '⚠️ Cambiar a Emergencia',
        text: 'Esta cita será marcada como EMERGENCIA y recibirá atención prioritaria.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Sí, marcar como emergencia',
        cancelButtonText: 'Cancelar',
        reverseButtons: true
      })

      if (!result.isConfirmed) return
    }

    try {
      await updateCita(id, { tipo_cita: newTipo })
      
      // Mensaje personalizado según el tipo
      const mensajes = {
        'consulta': 'Cambiado a: Consulta regular',
        'seguimiento': 'Cambiado a: Seguimiento',
        'emergencia': '⚠️ Cambiado a: EMERGENCIA - Atención prioritaria'
      }
      
      toast.success(mensajes[newTipo] || 'Tipo de cita actualizado')
      loadCitas()
    } catch (error) {
      console.error('Error updating tipo cita:', error)
      toast.error('Error al actualizar tipo de cita')
    }
  }

  const getStatusBadge = (estado) => {
    const estadoLower = (estado || '').toLowerCase()
    
    const badges = {
      'programada': { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Programada' },
      'pendiente': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pendiente' },
      'confirmada': { bg: 'bg-green-100', text: 'text-green-800', label: 'Confirmada' },
      'en_espera': { bg: 'bg-indigo-100', text: 'text-indigo-800', label: 'En Espera' },
      'en_consulta': { bg: 'bg-purple-100', text: 'text-purple-800', label: 'En Consulta' },
      'completada': { bg: 'bg-emerald-100', text: 'text-emerald-800', label: 'Completada' },
      'cancelada': { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelada' },
      'no_asistio': { bg: 'bg-orange-100', text: 'text-orange-800', label: 'No Asistió' }
    }
    
    const badge = badges[estadoLower] || badges['programada']
    
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    )
  }

  const filteredCitas = citas.filter(c => {
    // Búsqueda por ID, nombre de paciente, médico o cédula
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch = !searchTerm || (
      c.id?.toString().includes(searchTerm) ||
      c.paciente_nombre?.toLowerCase().includes(searchLower) ||
      c.paciente_apellido?.toLowerCase().includes(searchLower) ||
      c.paciente_cedula?.includes(searchTerm) ||
      c.medico_nombre?.toLowerCase().includes(searchLower) ||
      c.medico_apellido?.toLowerCase().includes(searchLower) ||
      `${c.paciente_nombre} ${c.paciente_apellido}`.toLowerCase().includes(searchLower) ||
      `${c.medico_nombre} ${c.medico_apellido}`.toLowerCase().includes(searchLower)
    )
    
    // Filtro de estado (compatibilidad español/inglés)
    const estadoLower = (c.estado || '').toLowerCase()
    let matchesStatus = filterStatus === 'todas'
    
    if (!matchesStatus) {
      switch(filterStatus.toLowerCase()) {
        case 'pendiente':
        case 'programada':
          matchesStatus = estadoLower === 'pendiente' || estadoLower === 'programada'
          break
        case 'confirmada':
          matchesStatus = estadoLower === 'confirmada'
          break
        case 'en_espera':
          matchesStatus = estadoLower === 'en_espera'
          break
        case 'completada':
          matchesStatus = estadoLower === 'completada'
          break
        case 'cancelada':
          matchesStatus = estadoLower === 'cancelada'
          break
        case 'en_consulta':
          matchesStatus = estadoLower === 'en_consulta'
          break
        default:
          matchesStatus = estadoLower === filterStatus.toLowerCase()
      }
    }
    
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Alerta de Emergencias Activas */}
      {citas.filter(c => 
        (c.tipo_cita || '').toLowerCase() === 'emergencia' && 
        ['programada', 'confirmada', 'en_consulta'].includes((c.estado || '').toLowerCase())
      ).length > 0 && (
        <div className="mb-6 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl p-4 shadow-2xl border-2 border-red-800 animate-pulse">
          <div className="flex items-center space-x-4">
            <div className="bg-white/20 p-3 rounded-xl">
              <AlertCircle className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold flex items-center space-x-2">
                <span>CITAS DE EMERGENCIA ACTIVAS</span>
              </h3>
              <p className="text-red-100 text-sm mt-1">
                Hay {citas.filter(c => 
                  (c.tipo_cita || '').toLowerCase() === 'emergencia' && 
                  ['programada', 'confirmada', 'en_consulta'].includes((c.estado || '').toLowerCase())
                ).length} cita(s) de emergencia que requieren atención prioritaria
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg">
            <Calendar className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Citas Médicas</h2>
            <p className="text-gray-600 mt-1">Gestión completa de citas programadas</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {canManageCitas && (
            <Link
              to="/citas/calendario"
              className="flex items-center space-x-2 bg-gradient-to-r from-violet-500 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-violet-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
            >
              <Calendar className="w-5 h-5" />
              <span>Ver Calendario</span>
            </Link>
          )}
          {canManageCitas && (
            <Link
              to="/citas/nueva"
              className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-3 rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
            >
              <Plus className="w-5 h-5" />
              <span>Nueva Cita</span>
            </Link>
          )}
          {isNurse && (
            <div className="bg-blue-50 border-2 border-blue-200 text-blue-700 px-6 py-3 rounded-xl font-semibold flex items-center space-x-2">
              <Activity className="w-5 h-5" />
              <span>Citas para Signos Vitales</span>
            </div>
          )}
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className="bg-white rounded-xl shadow-card p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por ID, paciente, médico o cédula..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-white font-medium"
          >
            <option value="todas">Todas las citas</option>
            <option value="programada">Programadas</option>
            <option value="confirmada">Confirmadas</option>
            <option value="en_espera">En Espera (Llegaron)</option>
            <option value="en_consulta">En Consulta</option>
            <option value="completada">Completadas</option>
            <option value="cancelada">Canceladas</option>
            <option value="no_asistio">No Asistió</option>
          </select>
        </div>
        
        {/* Indicador de resultados */}
        {(searchTerm || filterStatus !== 'todas') && (
          <div className="mt-4 flex items-center justify-between bg-purple-50 border border-purple-200 rounded-lg px-4 py-2">
            <p className="text-sm text-purple-700 font-medium">
              Mostrando <span className="font-bold">{filteredCitas.length}</span> de <span className="font-bold">{citas.length}</span> citas
              {searchTerm && <span className="ml-1">· Búsqueda: "<span className="font-semibold">{searchTerm}</span>"</span>}
            </p>
            {(searchTerm || filterStatus !== 'todas') && (
              <button
                onClick={() => {
                  setSearchTerm('')
                  setFilterStatus('todas')
                }}
                className="text-xs text-purple-600 hover:text-purple-800 font-semibold hover:underline"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        )}
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 shadow-lg border border-blue-100 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Citas</p>
              <p className="text-3xl font-bold text-blue-700">{citas.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        {/* Emergencias - Nueva tarjeta destacada */}
        <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-xl p-6 shadow-lg border-2 border-red-300 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Emergencias</p>
              <p className="text-3xl font-bold text-red-700">
                {citas.filter(c => (c.tipo_cita || '').toLowerCase() === 'emergencia').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center animate-pulse">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 shadow-lg border border-green-100 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Completadas</p>
              <p className="text-3xl font-bold text-green-700">
                {citas.filter(c => (c.estado || '').toLowerCase() === 'completada').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 shadow-lg border border-purple-100 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Pendientes</p>
              <p className="text-3xl font-bold text-purple-700">
                {citas.filter(c => {
                  const estado = (c.estado || '').toLowerCase()
                  return estado === 'pendiente' || estado === 'programada' || estado === 'confirmada'
                }).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-6 shadow-lg border border-orange-100 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Canceladas</p>
              <p className="text-3xl font-bold text-orange-700">
                {citas.filter(c => (c.estado || '').toLowerCase() === 'cancelada').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
              <XCircle className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Lista de citas */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200/50">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 border-b-2 border-purple-300">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Fecha y Hora
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Paciente
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Médico
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Motivo
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Estado y Tipo
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredCitas.length > 0 ? (
                filteredCitas.map((cita) => {
                  const isEmergencia = (cita.tipo_cita || '').toLowerCase() === 'emergencia'
                  return (
                  <tr 
                    key={cita.id} 
                    className={`transition-colors ${
                      isEmergencia 
                        ? 'bg-red-50 hover:bg-red-100 border-l-4 border-red-500 font-medium' 
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-sm font-semibold text-gray-800">
                          #{cita.id}
                        </span>
                        {isEmergencia && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-red-600 text-white animate-pulse">
                            URGENTE
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-800">{cita.fecha}</p>
                          <p className="text-xs text-gray-500">{cita.hora}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            {cita.paciente_nombre} {cita.paciente_apellido}
                          </p>
                          {cita.paciente_cedula && (
                            <p className="text-xs text-gray-500">CI: {cita.paciente_cedula}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <Stethoscope className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            Dr. {cita.medico_nombre} {cita.medico_apellido}
                          </p>
                          {cita.medico_especialidad && (
                            <p className="text-xs text-gray-500">{cita.medico_especialidad}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600 max-w-xs truncate">
                        {cita.motivo || 'No especificado'}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col space-y-1">
                        {getStatusBadge(cita.estado)}
                        
                        {/* Tipo de Cita - Editable para médicos/admins */}
                        {canManageCitas && cita.tipo_cita ? (
                          <select
                            value={cita.tipo_cita.toLowerCase()}
                            onChange={(e) => handleTipoCitaChange(cita.id, e.target.value, cita.tipo_cita.toLowerCase())}
                            className={`px-2 py-0.5 rounded text-xs font-medium cursor-pointer transition-all border-2 focus:outline-none focus:ring-2 ${
                              isEmergencia 
                                ? 'bg-red-600 text-white font-bold hover:bg-red-700 border-red-700 focus:ring-red-500' 
                                : cita.tipo_cita.toLowerCase() === 'seguimiento'
                                ? 'bg-green-100 text-green-700 hover:bg-green-200 border-green-300 focus:ring-green-500'
                                : 'bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-300 focus:ring-blue-500'
                            }`}
                            title="Click para cambiar tipo de cita"
                          >
                            <option value="consulta">📋 Consulta</option>
                            <option value="seguimiento">🔄 Seguimiento</option>
                            <option value="emergencia">🚨 EMERGENCIA</option>
                          </select>
                        ) : cita.tipo_cita ? (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            isEmergencia 
                              ? 'bg-red-600 text-white font-bold' 
                              : cita.tipo_cita.toLowerCase() === 'seguimiento'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {cita.tipo_cita.toLowerCase() === 'consulta' && 'Consulta'}
                            {cita.tipo_cita.toLowerCase() === 'seguimiento' && 'Seguimiento'}
                            {cita.tipo_cita.toLowerCase() === 'emergencia' && 'EMERGENCIA'}
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center space-x-2">
                        {canManageCitas && (cita.estado === 'confirmada' || cita.estado === 'programada') && (
                          <button 
                            onClick={() => handleStatusChange(cita.id, 'en_espera')}
                            className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors" 
                            title="Marcar Llegada"
                          >
                            <UserCheck className="w-4 h-4" />
                          </button>
                        )}
                        {canManageCitas && cita.estado !== 'completada' && (
                          <button 
                            onClick={() => handleStatusChange(cita.id, 'completada')}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors" 
                            title="Completar"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        {canManageCitas && (
                          <button 
                            onClick={() => handleEdit(cita.id)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" 
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        {canManageCitas && cita.estado !== 'cancelada' && (
                          <button 
                            onClick={() => handleStatusChange(cita.id, 'cancelada')}
                            className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors" 
                            title="Cancelar"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                        {isNurse && (
                          <Link
                            to={`/enfermeria/signos-vitales?paciente=${cita.paciente_id}`}
                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Registrar Signos Vitales"
                          >
                            <Activity className="w-4 h-4" />
                          </Link>
                        )}
                        {isAdmin && (
                          <button 
                            onClick={() => handleDelete(cita.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" 
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <Calendar className="w-12 h-12 text-gray-300" />
                      <p className="text-gray-500">No se encontraron citas</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default CitaList

