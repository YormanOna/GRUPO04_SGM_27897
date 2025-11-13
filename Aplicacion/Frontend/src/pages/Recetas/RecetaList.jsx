import React, { useState, useEffect } from 'react'
import { Pill, FileText, CheckCircle2, XCircle, Clock, User, Download, Search, Filter } from 'lucide-react'
import recetaService from '../../services/recetaService'
import { useAuth } from '../../context/AuthContext'
import useWebSocket from '../../hooks/useWebSocket'
import toast from 'react-hot-toast'
import Swal from 'sweetalert2'

const RecetaList = () => {
  const { user } = useAuth()
  const { lastUpdate } = useWebSocket()
  const [recetas, setRecetas] = useState([])
  const [filtroEstado, setFiltroEstado] = useState('pendiente')
  const [busqueda, setBusqueda] = useState('')
  const [loading, setLoading] = useState(false)

  const isFarmaceutico = user?.cargo === 'Farmaceutico'
  const isAdmin = user?.cargo === 'Administrador' || user?.cargo === 'Admin General'

  useEffect(() => {
    loadRecetas()
  }, [filtroEstado])

  // Recargar automáticamente cuando hay cambios en recetas vía WebSocket
  useEffect(() => {
    if (lastUpdate && (lastUpdate.type === 'receta_creada' || lastUpdate.type === 'receta_lista')) {
      console.log('🔄 Recargando recetas por WebSocket:', lastUpdate.type)
      loadRecetas()
    }
  }, [lastUpdate])

  const loadRecetas = async () => {
    setLoading(true)
    try {
      const estado = filtroEstado === 'todas' ? null : filtroEstado
      const data = await recetaService.getRecetas(null, estado)
      setRecetas(data)
    } catch (error) {
      console.error('Error cargando recetas:', error)
      toast.error('Error al cargar recetas')
    } finally {
      setLoading(false)
    }
  }

  const handleDescargarPDF = async (recetaId) => {
    try {
      toast.loading('Generando PDF...', { id: 'pdf' })
      await recetaService.descargarRecetaPDF(recetaId)
      toast.success('PDF descargado correctamente', { id: 'pdf' })
    } catch (error) {
      console.error('Error al descargar PDF:', error)
      toast.error('Error al generar el PDF', { id: 'pdf' })
    }
  }

  const handleDispensar = async (recetaId, pacienteNombre) => {
    const result = await Swal.fire({
      title: '¿Confirmar dispensación?',
      html: `
        <p class="text-gray-600 mb-4">Se dispensarán <strong>todos los medicamentos</strong> de esta receta</p>
        <div class="bg-blue-50 p-3 rounded-lg">
          <p class="text-sm text-gray-700"><strong>Paciente:</strong> ${pacienteNombre || 'No especificado'}</p>
          <p class="text-sm text-gray-700"><strong>Receta:</strong> #${recetaId}</p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#16a34a',
      cancelButtonColor: '#6b7280',
      confirmButtonText: '✅ Dispensar Completo',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    })

    if (!result.isConfirmed) return

    try {
      await recetaService.dispensarReceta(recetaId, { estado: 'dispensada' })
      Swal.fire({
        icon: 'success',
        title: '¡Dispensado!',
        text: 'Receta dispensada exitosamente',
        timer: 2000,
        showConfirmButton: false
      })
      loadRecetas()
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo dispensar la receta',
        confirmButtonColor: '#ef4444'
      })
      console.error(error)
    }
  }

  const handleDispensarParcial = async (recetaId, pacienteNombre) => {
    const result = await Swal.fire({
      title: 'Dispensación Parcial',
      html: `
        <p class="text-gray-600 mb-4">Especifique los medicamentos dispensados y las observaciones</p>
        <div class="bg-blue-50 p-3 rounded-lg mb-4">
          <p class="text-sm text-gray-700"><strong>Paciente:</strong> ${pacienteNombre || 'No especificado'}</p>
          <p class="text-sm text-gray-700"><strong>Receta:</strong> #${recetaId}</p>
        </div>
      `,
      input: 'textarea',
      inputLabel: 'Observaciones',
      inputPlaceholder: 'Ej: Solo se dispensó Omeprazol 20mg. Pendiente: Ibuprofeno por falta de stock',
      inputAttributes: {
        'aria-label': 'Ingrese observaciones sobre la dispensación parcial',
        rows: 4
      },
      icon: 'info',
      showCancelButton: true,
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#6b7280',
      confirmButtonText: '📋 Registrar Parcial',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
      inputValidator: (value) => {
        if (!value) {
          return 'Las observaciones son obligatorias para dispensación parcial'
        }
      }
    })

    if (!result.isConfirmed) return

    try {
      await recetaService.dispensarReceta(recetaId, { 
        estado: 'parcial',
        observaciones: result.value
      })
      Swal.fire({
        icon: 'success',
        title: '¡Registrado!',
        text: 'Dispensación parcial registrada',
        timer: 2000,
        showConfirmButton: false
      })
      loadRecetas()
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo registrar la dispensación',
        confirmButtonColor: '#ef4444'
      })
      console.error(error)
    }
  }

  const getEstadoBadge = (estado) => {
    const badges = {
      pendiente: {
        bg: 'bg-amber-100',
        text: 'text-amber-700',
        icon: Clock,
        label: 'Pendiente'
      },
      dispensada: {
        bg: 'bg-green-100',
        text: 'text-green-700',
        icon: CheckCircle2,
        label: 'Dispensada'
      },
      parcial: {
        bg: 'bg-blue-100',
        text: 'text-blue-700',
        icon: FileText,
        label: 'Parcial'
      },
      cancelada: {
        bg: 'bg-red-100',
        text: 'text-red-700',
        icon: XCircle,
        label: 'Cancelada'
      }
    }

    const badge = badges[estado] || badges.pendiente
    const Icon = badge.icon

    return (
      <span className={`inline-flex items-center space-x-1 px-3 py-1 ${badge.bg} ${badge.text} rounded-full text-xs font-semibold`}>
        <Icon className="w-3 h-3" />
        <span>{badge.label}</span>
      </span>
    )
  }

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleString('es-EC', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Guayaquil'
    })
  }

  // Filtrar recetas por búsqueda
  const recetasFiltradas = recetas.filter(receta => {
    if (!busqueda) return true
    
    const searchLower = busqueda.toLowerCase()
    return (
      receta.id.toString().includes(searchLower) ||
      receta.paciente_nombre?.toLowerCase().includes(searchLower) ||
      receta.paciente_cedula?.toString().includes(searchLower) ||
      receta.medico_nombre?.toLowerCase().includes(searchLower) ||
      receta.medicamentos?.toLowerCase().includes(searchLower)
    )
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Gestión de Recetas</h1>
          <p className="text-gray-600 mt-1">
            {isFarmaceutico || isAdmin 
              ? 'Dispensación de medicamentos prescritos'
              : 'Prescripciones médicas'
            }
          </p>
        </div>
        <div className="flex items-center space-x-3 bg-white px-5 py-3 rounded-xl shadow-md border border-gray-200">
          <Pill className="w-6 h-6 text-orange-600" />
          <div>
            <p className="text-xs text-gray-500">Total recetas</p>
            <p className="text-xl font-bold text-gray-700">{recetas.length}</p>
          </div>
        </div>
      </div>

      {/* Barra de búsqueda y filtros */}
      <div className="bg-white rounded-xl p-4 shadow-md border border-gray-200 space-y-4">
        {/* Barra de búsqueda */}
        {isFarmaceutico && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por # receta, paciente, cédula, médico o medicamento..."
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-orange-500 transition-all"
            />
            {busqueda && (
              <button
                onClick={() => setBusqueda('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-5 h-5" />
              </button>
            )}
          </div>
        )}
        
        {/* Filtros de estado */}
        <div className="flex items-center space-x-4">
          <Filter className="w-5 h-5 text-gray-500" />
          <span className="text-sm font-semibold text-gray-700">Estado:</span>
          {['todas', 'pendiente', 'dispensada', 'parcial', 'cancelada'].map((estado) => (
            <button
              key={estado}
              onClick={() => setFiltroEstado(estado)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filtroEstado === estado
                  ? 'bg-orange-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {estado.charAt(0).toUpperCase() + estado.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de recetas */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
        {loading ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando recetas...</p>
          </div>
        ) : recetasFiltradas.length > 0 ? (
          <div className="space-y-4">
            {recetasFiltradas.map((receta) => (
              <div
                key={receta.id}
                className="border-2 border-gray-200 rounded-xl p-5 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center text-white font-bold shadow-lg">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <h3 className="text-lg font-bold text-gray-800">
                          Receta #{receta.id}
                        </h3>
                        {getEstadoBadge(receta.estado)}
                      </div>
                      
                      {/* Información del Paciente - Destacada para farmacéuticos */}
                      {isFarmaceutico && (
                        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-3 mb-3 border border-blue-200">
                          <div className="flex items-center space-x-2 mb-2">
                            <User className="w-4 h-4 text-blue-600" />
                            <p className="text-xs font-semibold text-blue-700">PACIENTE</p>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <p className="text-xs text-gray-600">Nombre:</p>
                              <p className="text-sm font-bold text-gray-800">
                                {receta.paciente_nombre || 'No especificado'}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600">Cédula:</p>
                              <p className="text-sm font-bold text-gray-800">
                                {receta.paciente_cedula || 'N/A'}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Fecha emisión:</p>
                          <p className="font-semibold text-gray-800">
                            {formatearFecha(receta.fecha_emision)}
                          </p>
                        </div>
                        {receta.fecha_dispensacion && (
                          <div>
                            <p className="text-gray-500">Fecha dispensación:</p>
                            <p className="font-semibold text-gray-800">
                              {formatearFecha(receta.fecha_dispensacion)}
                            </p>
                          </div>
                        )}
                        {receta.medico_nombre && (
                          <div>
                            <p className="text-gray-500">Médico prescriptor:</p>
                            <p className="font-semibold text-gray-800">
                              Dr(a). {receta.medico_nombre}
                            </p>
                          </div>
                        )}
                        {isFarmaceutico && receta.farmaceutico_nombre && (
                          <div>
                            <p className="text-gray-500">Dispensado por:</p>
                            <p className="font-semibold text-gray-800">
                              {receta.farmaceutico_nombre}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Medicamentos */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <p className="text-xs text-gray-500 mb-2">MEDICAMENTOS PRESCRITOS:</p>
                  <p className="text-sm text-gray-800 font-medium whitespace-pre-wrap">
                    {receta.medicamentos}
                  </p>
                </div>

                {/* Indicaciones */}
                {receta.indicaciones && (
                  <div className="bg-blue-50 rounded-lg p-4 mb-4">
                    <p className="text-xs text-blue-600 mb-2">INDICACIONES:</p>
                    <p className="text-sm text-gray-800">
                      {receta.indicaciones}
                    </p>
                  </div>
                )}

                {/* Observaciones */}
                {receta.observaciones && (
                  <div className="bg-amber-50 rounded-lg p-4 mb-4">
                    <p className="text-xs text-amber-600 mb-2">OBSERVACIONES:</p>
                    <p className="text-sm text-gray-800">
                      {receta.observaciones}
                    </p>
                  </div>
                )}

                {/* Acciones */}
                <div className="flex items-center space-x-3 pt-4 border-t border-gray-200">
                  {/* Botón descargar PDF - disponible para todos */}
                  <button
                    onClick={() => handleDescargarPDF(receta.id)}
                    className="bg-gradient-to-r from-purple-600 to-purple-700 text-white py-2 px-4 rounded-lg font-semibold hover:from-purple-700 hover:to-purple-800 transition-all shadow-md flex items-center justify-center space-x-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Descargar PDF</span>
                  </button>

                  {/* Botones de dispensación - solo farmacéutico con recetas pendientes */}
                  {(isFarmaceutico || isAdmin) && receta.estado === 'pendiente' && (
                    <>
                      <button
                        onClick={() => handleDispensar(receta.id, receta.paciente_nombre)}
                        className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white py-2 px-4 rounded-lg font-semibold hover:from-green-700 hover:to-green-800 transition-all shadow-md flex items-center justify-center space-x-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Dispensar Completo</span>
                      </button>
                      <button
                        onClick={() => handleDispensarParcial(receta.id, receta.paciente_nombre)}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-2 px-4 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-md flex items-center justify-center space-x-2"
                      >
                        <FileText className="w-4 h-4" />
                        <span>Dispensar Parcial</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Pill className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">
              No hay recetas {filtroEstado !== 'todas' && `con estado "${filtroEstado}"`}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default RecetaList
