import React, { useEffect, useState } from 'react'
import { getPacientes, deletePaciente, buscarPacientes } from '../../services/pacienteService'
import { Link, useNavigate } from 'react-router-dom'
import { Users, Plus, Search, Edit, Trash2, Eye, Phone, Mail, FileText, AlertCircle, CheckCircle, Clock, UserPlus } from 'lucide-react'
import toast from 'react-hot-toast'
import Swal from 'sweetalert2'
import { useAuth } from '../../context/AuthContext'

const PacienteList = () => {
  const [pacientes, setPacientes] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const isAdmin = user?.cargo === 'Administrador' || user?.cargo === 'Admin General'
  const isNurse = user?.cargo === 'Enfermera'
  const isMedico = user?.cargo === 'Medico'
  const canEdit = isAdmin // Solo administradores pueden crear/editar/eliminar pacientes

  // Función para obtener el color del badge según el estado de póliza (RF-001)
  const getEstadoPolizaColor = (estado) => {
    switch (estado) {
      case 'vigente':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'proxima_a_vencer':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'vencida':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getEstadoPolizaIcon = (estado) => {
    switch (estado) {
      case 'vigente':
        return <CheckCircle className="w-3 h-3" />
      case 'proxima_a_vencer':
        return <Clock className="w-3 h-3" />
      case 'vencida':
        return <AlertCircle className="w-3 h-3" />
      default:
        return <AlertCircle className="w-3 h-3" />
    }
  }

  const getEstadoPolizaTexto = (estado) => {
    switch (estado) {
      case 'vigente':
        return 'Póliza vigente'
      case 'proxima_a_vencer':
        return 'Por vencer'
      case 'vencida':
        return 'Póliza vencida'
      default:
        return 'Sin información'
    }
  }

  useEffect(() => {
    loadPacientes()
  }, [])

  const loadPacientes = async () => {
    try {
      const data = await getPacientes()
      setPacientes(data)
    } catch (error) {
      console.error('Error loading patients:', error)
      toast.error('Error al cargar pacientes')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id, nombre) => {
    const result = await Swal.fire({
      title: '¿Eliminar paciente?',
      html: `
        <p class="text-gray-600 mb-3">Esta acción eliminará permanentemente al paciente:</p>
        <p class="text-lg font-bold text-gray-800 mb-3">${nombre}</p>
        <p class="text-sm text-red-600">⚠️ Esta acción no se puede deshacer</p>
      `,
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
      await deletePaciente(id)
      Swal.fire({
        icon: 'success',
        title: '¡Eliminado!',
        text: 'Paciente eliminado exitosamente',
        timer: 2000,
        showConfirmButton: false
      })
      loadPacientes()
    } catch (error) {
      console.error('Error deleting patient:', error)
      if (error.response?.status === 403) {
        Swal.fire({
          icon: 'error',
          title: 'Sin permisos',
          text: 'No tienes permisos para eliminar pacientes',
          confirmButtonColor: '#ef4444'
        })
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo eliminar el paciente',
          confirmButtonColor: '#ef4444'
        })
      }
    }
  }

  const handleEdit = (id) => {
    navigate(`/pacientes/editar/${id}`)
  }

  const handleView = (id) => {
    navigate(`/pacientes/${id}`)
  }

  // Búsqueda en tiempo real (RF-001)
  const handleSearch = async (value) => {
    setSearchTerm(value)
    
    if (value.length >= 2) {
      setSearching(true)
      try {
        const resultados = await buscarPacientes(value)
        setPacientes(resultados)
      } catch (error) {
        console.error('Error searching patients:', error)
        toast.error('Error al buscar pacientes')
      } finally {
        setSearching(false)
      }
    } else if (value.length === 0) {
      // Si se borra la búsqueda, recargar todos
      loadPacientes()
    }
  }

  // Mostrar los pacientes (ya filtrados por la búsqueda del backend)
  const filteredPacientes = pacientes

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg">
            <Users className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Pacientes</h2>
            <p className="text-gray-600 mt-1">Gestión integral de pacientes y registros médicos</p>
          </div>
        </div>
        {canEdit && (
          <Link
            to="/pacientes/nuevo"
            className="flex items-center space-x-2 bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 text-white px-6 py-3 rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 shadow-lg hover:shadow-xl font-semibold hover:scale-105 active:scale-95"
          >
            <Plus className="w-5 h-5" />
            <span>Nuevo Paciente</span>
          </Link>
        )}
        {(isNurse || isMedico) && (
          <div className="bg-blue-50 border-2 border-blue-200 text-blue-700 px-6 py-3 rounded-xl font-semibold flex items-center space-x-2">
            <Eye className="w-5 h-5" />
            <span>Modo Solo Lectura</span>
          </div>
        )}
      </div>

      {/* Barra de búsqueda y filtros */}
      <div className="bg-white rounded-xl shadow-card p-6">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${searching ? 'text-blue-500 animate-pulse' : 'text-gray-400'}`} />
            <input
              type="text"
              placeholder="Buscar por nombre, apellido o cédula (mín. 2 caracteres)..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            {searchTerm.length > 0 && searchTerm.length < 2 && (
              <p className="absolute top-full left-0 mt-1 text-xs text-gray-500">
                Ingrese al menos 2 caracteres para buscar
              </p>
            )}
          </div>
          <button className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg border border-gray-300">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <span>Filtros</span>
          </button>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 shadow-lg border border-blue-100 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Pacientes</p>
              <p className="text-3xl font-bold text-blue-700">{pacientes.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6 shadow-lg border border-emerald-100 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Con Póliza Vigente</p>
              <p className="text-3xl font-bold text-emerald-700">
                {pacientes.filter(p => p.estado_poliza === 'vigente').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 shadow-lg border border-purple-100 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Con Historia Clínica</p>
              <p className="text-3xl font-bold text-purple-700">{pacientes.filter(p => p.historia_id).length}</p>
            </div>
            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de pacientes */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200/50">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 border-b-2 border-blue-300">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Paciente
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Historia Clínica
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Contacto
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Estado de Póliza
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredPacientes.length > 0 ? (
                filteredPacientes.map((paciente) => (
                  <tr key={paciente.id} className="hover:bg-blue-50/30 transition-colors border-b border-gray-100">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold shadow-md">
                          {paciente.nombre?.charAt(0)}{paciente.apellido?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-base">
                            {paciente.nombre} {paciente.apellido}
                          </p>
                          <p className="text-sm text-gray-500">
                            CI: <span className="font-mono">{paciente.cedula}</span>
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {paciente.numero_historia_clinica ? (
                        <div className="flex items-center space-x-2">
                          <FileText className="w-4 h-4 text-blue-600" />
                          <span className="font-mono text-sm font-semibold text-blue-700">
                            {paciente.numero_historia_clinica}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">Sin HC</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {paciente.email && (
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Mail className="w-3.5 h-3.5 text-gray-400" />
                            <span className="truncate max-w-[200px]">{paciente.email}</span>
                          </div>
                        )}
                        {paciente.telefono && (
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Phone className="w-3.5 h-3.5 text-gray-400" />
                            <span>{paciente.telefono}</span>
                          </div>
                        )}
                        {!paciente.email && !paciente.telefono && (
                          <span className="text-gray-400 text-sm">Sin contacto</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {paciente.estado_poliza ? (
                        <span className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${getEstadoPolizaColor(paciente.estado_poliza)}`}>
                          {getEstadoPolizaIcon(paciente.estado_poliza)}
                          <span>{getEstadoPolizaTexto(paciente.estado_poliza)}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                          <AlertCircle className="w-3 h-3" />
                          <span>Sin información</span>
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center space-x-1">
                        <button 
                          onClick={() => navigate(`/expediente?query=${paciente.historia?.identificador || paciente.cedula}`)}
                          className="p-2 text-teal-600 hover:bg-teal-100 rounded-lg transition-all hover:scale-110 active:scale-95" 
                          title="Ver expediente clínico"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleView(paciente.id)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-all hover:scale-110 active:scale-95" 
                          title="Ver detalles"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {canEdit && (
                          <button 
                            onClick={() => handleEdit(paciente.id)}
                            className="p-2 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-all hover:scale-110 active:scale-95" 
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        {isAdmin && (
                          <button 
                            onClick={() => handleDelete(paciente.id, `${paciente.nombre} ${paciente.apellido}`)}
                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-all hover:scale-110 active:scale-95" 
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <Users className="w-12 h-12 text-gray-300" />
                      <p className="text-gray-500">No se encontraron pacientes</p>
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

export default PacienteList

