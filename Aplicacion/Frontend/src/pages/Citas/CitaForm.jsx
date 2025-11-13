import React, { useState, useEffect } from 'react'
import { createCita, getDisponibilidadMedicos } from '../../services/citaService'
import { getPacientes } from '../../services/pacienteService'
import { getMedicos } from '../../services/medicoService'
import { useNavigate } from 'react-router-dom'
import { Calendar, User, Stethoscope, FileText, Clock, Save, X, Search, AlertCircle, CheckCircle2, Filter, ArrowLeft, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'
import QRModal from '../../components/QRModal'

const CitaForm = () => {
  // Estado del formulario
  const [form, setForm] = useState({ 
    fecha: '', 
    hora_inicio: '',
    hora_fin: '',
    paciente_id: '',
    medico_id: '',
    motivo: '',
    tipo_cita: 'consulta'
  })

  // Estados auxiliares
  const [pacientes, setPacientes] = useState([])
  const [todasEspecialidades, setTodasEspecialidades] = useState([])
  const [especialidadSeleccionada, setEspecialidadSeleccionada] = useState('')
  const [medicosDisponibles, setMedicosDisponibles] = useState([])
  const [bloquesDisponibles, setBloquesDisponibles] = useState([])
  const [searchPaciente, setSearchPaciente] = useState('')
  const [showPacienteSuggestions, setShowPacienteSuggestions] = useState(false)
  const [selectedPaciente, setSelectedPaciente] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [paso, setPaso] = useState(1) // Control de pasos del wizard
  const [showQRModal, setShowQRModal] = useState(false)
  const [createdCitaId, setCreatedCitaId] = useState(null)
  const [createdCitaData, setCreatedCitaData] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    // Cargar disponibilidad cuando se selecciona especialidad y fecha
    if (especialidadSeleccionada && form.fecha) {
      cargarDisponibilidad()
    }
  }, [especialidadSeleccionada, form.fecha])

  const loadData = async () => {
    try {
      const [pacientesData, medicosData] = await Promise.all([
        getPacientes(),
        getMedicos()
      ])
      setPacientes(pacientesData)
      
      // Extraer especialidades únicas
      const especialidades = [...new Set(medicosData.map(m => m.especialidad))].filter(Boolean)
      setTodasEspecialidades(especialidades)
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Error al cargar datos')
    }
  }

  const cargarDisponibilidad = async () => {
    if (!especialidadSeleccionada || !form.fecha) return
    
    try {
      setIsLoading(true)
      const disponibilidad = await getDisponibilidadMedicos(
        form.fecha,
        especialidadSeleccionada
      )
      
      setMedicosDisponibles(disponibilidad || [])
      
      // Generar bloques horarios de 30 minutos de 8:00 a 18:00
      const bloques = []
      for (let hora = 8; hora < 18; hora++) {
        for (let minuto of [0, 30]) {
          const horaStr = `${hora.toString().padStart(2, '0')}:${minuto.toString().padStart(2, '0')}:00`
          const horaFinMinuto = minuto === 30 ? 0 : 30
          const horaFin = minuto === 30 ? hora + 1 : hora
          const horaFinStr = `${horaFin.toString().padStart(2, '0')}:${horaFinMinuto.toString().padStart(2, '0')}:00`
          
          bloques.push({
            inicio: horaStr,
            fin: horaFinStr,
            label: `${hora.toString().padStart(2, '0')}:${minuto.toString().padStart(2, '0')} - ${horaFin.toString().padStart(2, '0')}:${horaFinMinuto.toString().padStart(2, '0')}`
          })
        }
      }
      
      setBloquesDisponibles(bloques)
    } catch (error) {
      console.error('Error cargando disponibilidad:', error)
      toast.error('Error al cargar disponibilidad de médicos')
    } finally {
      setIsLoading(false)
    }
  }

  const verificarBloqueDisponible = (bloque) => {
    if (!form.medico_id) return true
    
    const medicoSeleccionado = medicosDisponibles.find(m => m.medico_id === parseInt(form.medico_id))
    if (!medicoSeleccionado) return true
    
    // Verificar si hay conflicto con bloques ocupados
    return !medicoSeleccionado.bloques_ocupados.some(ocupado => {
      return (
        (bloque.inicio >= ocupado.inicio && bloque.inicio < ocupado.fin) ||
        (bloque.fin > ocupado.inicio && bloque.fin <= ocupado.fin) ||
        (bloque.inicio <= ocupado.inicio && bloque.fin >= ocupado.fin)
      )
    })
  }

  const filteredPacientes = pacientes.filter(p => 
    searchPaciente && (
      p.nombre?.toLowerCase().includes(searchPaciente.toLowerCase()) ||
      p.apellido?.toLowerCase().includes(searchPaciente.toLowerCase()) ||
      p.cedula?.toString().includes(searchPaciente)
    )
  )

  const handlePacienteSelect = (paciente) => {
    setSelectedPaciente(paciente)
    setSearchPaciente(`${paciente.nombre} ${paciente.apellido}`)
    setForm({ ...form, paciente_id: paciente.id })
    setShowPacienteSuggestions(false)
  }

  const handleSubmit = async (e) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    
    // CRÍTICO: Solo procesar el submit si estamos en el paso 5 (Confirmación)
    if (paso !== 5) {
      console.log('⚠️ Submit bloqueado - No estamos en paso 5. Paso actual:', paso)
      return
    }
    
    console.log('✅ Iniciando creación de cita desde paso 5...')
    
    // Validaciones
    if (!form.paciente_id) {
      toast.error('Debe seleccionar un paciente')
      return
    }
    
    if (!especialidadSeleccionada) {
      toast.error('Debe seleccionar una especialidad médica')
      return
    }
    
    if (!form.medico_id) {
      toast.error('Debe seleccionar un médico')
      return
    }
    
    if (!form.fecha) {
      toast.error('Debe seleccionar una fecha')
      return
    }

    if (!form.hora_inicio || !form.hora_fin) {
      toast.error('Debe seleccionar un bloque horario')
      return
    }

    // Validar que el bloque esté disponible
    const bloqueSeleccionado = { inicio: form.hora_inicio, fin: form.hora_fin }
    if (!verificarBloqueDisponible(bloqueSeleccionado)) {
      toast.error('El bloque horario seleccionado ya no está disponible')
      return
    }

    // Validar que la fecha no sea en el pasado
    const fechaSeleccionada = new Date(form.fecha + 'T' + form.hora_inicio)
    const ahora = new Date()
    if (fechaSeleccionada < ahora) {
      toast.error('No puede agendar citas en el pasado')
      return
    }

    setIsLoading(true)
    try {
      // Construir la fecha completa con zona horaria
      // Crear objeto Date y convertir a ISO string completo
      const [year, month, day] = form.fecha.split('-')
      const [hours, minutes] = form.hora_inicio.split(':')
      
      const fechaCompleta = new Date(
        parseInt(year),
        parseInt(month) - 1, // Los meses en JS van de 0-11
        parseInt(day),
        parseInt(hours),
        parseInt(minutes),
        0
      )
      
      const citaData = {
        paciente_id: parseInt(form.paciente_id, 10),
        medico_id: parseInt(form.medico_id, 10),
        fecha: fechaCompleta.toISOString(), // Formato: 2025-11-28T09:00:00.000Z
        hora_inicio: form.hora_inicio,
        hora_fin: form.hora_fin,
        motivo: form.motivo || 'Consulta médica',
        estado: 'programada',
        tipo_cita: form.tipo_cita
      }
      
      // Debug: Mostrar datos que se enviarán
      console.log('📤 Datos de cita a enviar:', citaData)
      console.log('📅 Fecha original:', form.fecha, 'Hora:', form.hora_inicio)
      console.log('📅 Fecha ISO generada:', fechaCompleta.toISOString())
      console.log('📋 Tipo de cita:', form.tipo_cita, '- Tipo:', typeof form.tipo_cita)
      
      const response = await createCita(citaData)
      toast.success('✅ Cita agendada exitosamente')
      
      // Preparar datos para el modal de QR
      const medicoNombre = medicosDisponibles.find(m => m.medico_id === parseInt(form.medico_id))?.nombre || 'Médico'
      const fechaFormateada = new Date(form.fecha).toLocaleDateString('es-ES', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
      
      setCreatedCitaId(response.id)
      setCreatedCitaData({
        paciente: `${selectedPaciente.nombre} ${selectedPaciente.apellido}`,
        medico: medicoNombre,
        fecha: fechaFormateada,
        hora: `${form.hora_inicio.slice(0,5)} - ${form.hora_fin.slice(0,5)}`,
        motivo: form.motivo || 'Consulta médica'
      })
      
      // Mostrar modal de QR
      setShowQRModal(true)
    } catch (error) {
      console.error('❌ Error al crear cita:', error)
      console.error('📄 Response completo:', error.response)
      console.error('📋 Detalle del error:', error.response?.data)
      
      const errorDetail = error.response?.data?.detail
      
      // Manejar errores de validación de Pydantic (array de objetos)
      if (Array.isArray(errorDetail)) {
        console.error('🔍 Errores de validación:', errorDetail)
        errorDetail.forEach(err => {
          const campo = err.loc ? err.loc.join(' > ') : 'campo desconocido'
          const mensaje = `${campo}: ${err.msg}`
          toast.error(mensaje)
          console.error(`  - ${mensaje}`)
        })
      } 
      // Manejar errores simples (string)
      else if (typeof errorDetail === 'string') {
        toast.error(errorDetail)
      }
      // Manejar errores como objeto con mensajes
      else if (typeof errorDetail === 'object' && errorDetail !== null) {
        const errores = Object.values(errorDetail).flat()
        errores.forEach(err => {
          if (typeof err === 'string') {
            toast.error(err)
          } else if (err.msg) {
            toast.error(err.msg)
          }
        })
      }
      // Error genérico
      else {
        toast.error('Error al agendar la cita')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleCloseQRModal = () => {
    setShowQRModal(false)
    navigate('/citas')
  }

  const avanzarPaso = () => {
    if (paso === 1 && !selectedPaciente) {
      toast.error('Debe seleccionar un paciente')
      return
    }
    if (paso === 1 && !form.tipo_cita) {
      toast.error('Debe seleccionar el tipo de cita')
      return
    }
    if (paso === 2 && !especialidadSeleccionada) {
      toast.error('Debe seleccionar una especialidad')
      return
    }
    if (paso === 3 && (!form.medico_id || !form.fecha)) {
      toast.error('Debe seleccionar médico y fecha')
      return
    }
    if (paso === 4 && (!form.hora_inicio || !form.hora_fin)) {
      toast.error('Debe seleccionar un bloque horario')
      return
    }
    setPaso(paso + 1)
  }

  const retrocederPaso = () => {
    if (paso > 1) setPaso(paso - 1)
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-800">Agendar Cita Médica</h2>
              <p className="text-gray-600">Proceso de agendamiento paso a paso</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/citas')}
            className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Volver</span>
          </button>
        </div>

        {/* Indicador de pasos */}
        <div className="bg-white rounded-xl shadow-card p-4">
          <div className="flex items-center justify-between">
            {[
              { num: 1, label: 'Paciente y Tipo', icon: User },
              { num: 2, label: 'Especialidad', icon: Filter },
              { num: 3, label: 'Médico y Fecha', icon: Stethoscope },
              { num: 4, label: 'Horario', icon: Clock },
              { num: 5, label: 'Confirmación', icon: CheckCircle2 }
            ].map(({ num, label, icon: Icon }, index) => (
              <div key={num} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all ${
                    paso === num 
                      ? 'bg-gradient-to-br from-purple-500 to-purple-700 text-white shadow-lg scale-110' 
                      : paso > num
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className={`mt-2 text-sm font-medium ${paso === num ? 'text-purple-700' : 'text-gray-500'}`}>
                    {label}
                  </span>
                </div>
                {index < 4 && (
                  <div className={`h-1 w-24 mx-2 ${paso > num ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-card p-8">
        {/* PASO 1: Seleccionar Paciente y Tipo de Cita */}
        {paso === 1 && (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center space-x-2">
              <User className="w-6 h-6 text-purple-600" />
              <span>Paso 1: Seleccionar Paciente y Tipo de Cita</span>
            </h3>
            
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar Paciente *
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchPaciente}
                  onChange={(e) => {
                    setSearchPaciente(e.target.value)
                    setShowPacienteSuggestions(true)
                  }}
                  onFocus={() => setShowPacienteSuggestions(true)}
                  placeholder="Buscar por nombre, apellido o cédula..."
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Sugerencias de pacientes */}
              {showPacienteSuggestions && searchPaciente && filteredPacientes.length > 0 && (
                <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                  {filteredPacientes.map((paciente) => (
                    <div
                      key={paciente.id}
                      onClick={() => handlePacienteSelect(paciente)}
                      className="px-4 py-3 hover:bg-purple-50 cursor-pointer transition-colors border-b border-gray-100 last:border-0"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {paciente.nombre?.charAt(0)}{paciente.apellido?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">
                            {paciente.nombre} {paciente.apellido}
                          </p>
                          <p className="text-sm text-gray-500">
                            Cédula: {paciente.cedula}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Paciente seleccionado */}
              {selectedPaciente && (
                <div className="mt-3 p-4 bg-green-50 border-2 border-green-200 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <CheckCircle2 className="w-8 h-8 text-green-600" />
                      <div>
                        <p className="text-sm text-green-700 font-medium">Paciente seleccionado:</p>
                        <p className="font-bold text-gray-800 text-lg">
                          {selectedPaciente.nombre} {selectedPaciente.apellido}
                        </p>
                        <p className="text-sm text-gray-600">
                          Cédula: {selectedPaciente.cedula}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPaciente(null)
                        setSearchPaciente('')
                        setForm({ ...form, paciente_id: '' })
                      }}
                      className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Selector de Tipo de Cita - Solo visible si hay paciente seleccionado */}
            {selectedPaciente && (
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Tipo de Cita *
                </label>
                <div className="grid grid-cols-3 gap-4">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setForm({ ...form, tipo_cita: 'consulta' })
                    }}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      form.tipo_cita === 'consulta'
                        ? 'border-blue-500 bg-blue-50 shadow-lg scale-105'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <Stethoscope className={`w-8 h-8 ${
                        form.tipo_cita === 'consulta' ? 'text-blue-600' : 'text-gray-400'
                      }`} />
                      <div className="text-center">
                        <p className={`font-semibold ${
                          form.tipo_cita === 'consulta' ? 'text-blue-700' : 'text-gray-700'
                        }`}>
                          Consulta
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Consulta médica regular
                        </p>
                      </div>
                      {form.tipo_cita === 'consulta' && (
                        <CheckCircle2 className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setForm({ ...form, tipo_cita: 'seguimiento' })
                    }}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      form.tipo_cita === 'seguimiento'
                        ? 'border-green-500 bg-green-50 shadow-lg scale-105'
                        : 'border-gray-200 hover:border-green-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <Clock className={`w-8 h-8 ${
                        form.tipo_cita === 'seguimiento' ? 'text-green-600' : 'text-gray-400'
                      }`} />
                      <div className="text-center">
                        <p className={`font-semibold ${
                          form.tipo_cita === 'seguimiento' ? 'text-green-700' : 'text-gray-700'
                        }`}>
                          Seguimiento
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Control o revisión
                        </p>
                      </div>
                      {form.tipo_cita === 'seguimiento' && (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      )}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setForm({ ...form, tipo_cita: 'emergencia' })
                    }}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      form.tipo_cita === 'emergencia'
                        ? 'border-red-500 bg-red-50 shadow-lg scale-105'
                        : 'border-gray-200 hover:border-red-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <AlertCircle className={`w-8 h-8 ${
                        form.tipo_cita === 'emergencia' ? 'text-red-600' : 'text-gray-400'
                      }`} />
                      <div className="text-center">
                        <p className={`font-semibold ${
                          form.tipo_cita === 'emergencia' ? 'text-red-700' : 'text-gray-700'
                        }`}>
                          Emergencia
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Atención urgente
                        </p>
                      </div>
                      {form.tipo_cita === 'emergencia' && (
                        <CheckCircle2 className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PASO 2: Seleccionar Especialidad */}
        {paso === 2 && (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center space-x-2">
              <Filter className="w-6 h-6 text-purple-600" />
              <span>Paso 2: Seleccionar Especialidad Médica</span>
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {todasEspecialidades.map((especialidad) => (
                <button
                  key={especialidad}
                  type="button"
                  onClick={() => setEspecialidadSeleccionada(especialidad)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    especialidadSeleccionada === especialidad
                      ? 'border-purple-500 bg-purple-50 shadow-lg scale-105'
                      : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="text-center">
                    <Stethoscope className={`w-8 h-8 mx-auto mb-2 ${
                      especialidadSeleccionada === especialidad ? 'text-purple-600' : 'text-gray-400'
                    }`} />
                    <p className={`font-semibold ${
                      especialidadSeleccionada === especialidad ? 'text-purple-700' : 'text-gray-700'
                    }`}>
                      {especialidad}
                    </p>
                  </div>
                </button>
              ))}
            </div>

            {especialidadSeleccionada && (
              <div className="p-4 bg-green-50 border-2 border-green-200 rounded-xl flex items-center space-x-3">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
                <p className="text-green-700 font-medium">
                  Especialidad seleccionada: <span className="font-bold">{especialidadSeleccionada}</span>
                </p>
              </div>
            )}
          </div>
        )}

        {/* PASO 3: Seleccionar Médico y Fecha */}
        {paso === 3 && (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center space-x-2">
              <Stethoscope className="w-6 h-6 text-purple-600" />
              <span>Paso 3: Seleccionar Médico y Fecha</span>
            </h3>

            {/* Seleccionar Fecha */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de la Cita *
              </label>
              <input
                type="date"
                value={form.fecha}
                onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Médicos Disponibles */}
            {form.fecha && medicosDisponibles.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Médicos Disponibles ({medicosDisponibles.length})
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {medicosDisponibles.map((medico) => (
                    <button
                      key={medico.medico_id}
                      type="button"
                      onClick={() => setForm({ ...form, medico_id: medico.medico_id })}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${
                        parseInt(form.medico_id) === medico.medico_id
                          ? 'border-purple-500 bg-purple-50 shadow-lg'
                          : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                          {medico.nombre.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-gray-800">{medico.nombre}</p>
                          <p className="text-sm text-gray-600">{medico.especialidad}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {medico.total_citas_dia} citas programadas
                          </p>
                        </div>
                        {parseInt(form.medico_id) === medico.medico_id && (
                          <CheckCircle2 className="w-6 h-6 text-purple-600" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {form.fecha && medicosDisponibles.length === 0 && !isLoading && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex items-start space-x-3">
                <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-yellow-800">No hay médicos disponibles</p>
                  <p className="text-sm text-yellow-700">
                    No se encontraron médicos de {especialidadSeleccionada} disponibles para la fecha seleccionada.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PASO 4: Seleccionar Horario */}
        {paso === 4 && (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center space-x-2">
              <Clock className="w-6 h-6 text-purple-600" />
              <span>Paso 4: Seleccionar Bloque Horario</span>
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {bloquesDisponibles.map((bloque) => {
                const disponible = verificarBloqueDisponible(bloque)
                const seleccionado = form.hora_inicio === bloque.inicio && form.hora_fin === bloque.fin
                
                return (
                  <button
                    key={bloque.inicio}
                    type="button"
                    onClick={() => {
                      if (disponible) {
                        setForm({ 
                          ...form, 
                          hora_inicio: bloque.inicio,
                          hora_fin: bloque.fin
                        })
                      }
                    }}
                    disabled={!disponible}
                    className={`p-3 rounded-lg border-2 transition-all font-medium ${
                      seleccionado
                        ? 'border-purple-500 bg-purple-500 text-white shadow-lg'
                        : disponible
                        ? 'border-green-300 bg-green-50 text-green-700 hover:border-green-500 hover:shadow-md'
                        : 'border-red-200 bg-red-50 text-red-400 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center justify-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">{bloque.label}</span>
                    </div>
                  </button>
                )
              })}
            </div>

            {form.hora_inicio && form.hora_fin && (
              <div className="p-4 bg-green-50 border-2 border-green-200 rounded-xl flex items-center space-x-3">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
                <p className="text-green-700 font-medium">
                  Horario seleccionado: <span className="font-bold">{form.hora_inicio.slice(0,5)} - {form.hora_fin.slice(0,5)}</span>
                </p>
              </div>
            )}
          </div>
        )}

        {/* PASO 5: Confirmación */}
        {paso === 5 && (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center space-x-2">
              <CheckCircle2 className="w-6 h-6 text-purple-600" />
              <span>Paso 5: Confirmación de la Cita</span>
            </h3>

            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 border-2 border-purple-200">
              <h4 className="font-bold text-lg text-purple-900 mb-4">Resumen de la Cita</h4>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <User className="w-5 h-5 text-purple-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Paciente:</p>
                    <p className="font-semibold text-gray-800">{selectedPaciente?.nombre} {selectedPaciente?.apellido}</p>
                    <p className="text-sm text-gray-600">Cédula: {selectedPaciente?.cedula}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Filter className="w-5 h-5 text-purple-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Especialidad:</p>
                    <p className="font-semibold text-gray-800">{especialidadSeleccionada}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Stethoscope className="w-5 h-5 text-purple-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Médico:</p>
                    <p className="font-semibold text-gray-800">
                      {medicosDisponibles.find(m => m.medico_id === parseInt(form.medico_id))?.nombre}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Calendar className="w-5 h-5 text-purple-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Fecha:</p>
                    <p className="font-semibold text-gray-800">
                      {new Date(form.fecha).toLocaleDateString('es-ES', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Clock className="w-5 h-5 text-purple-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Horario:</p>
                    <p className="font-semibold text-gray-800">
                      {form.hora_inicio.slice(0,5)} - {form.hora_fin.slice(0,5)}
                    </p>
                  </div>
                </div>

                {/* Tipo de Cita integrado en el resumen */}
                <div className="pt-3 border-t-2 border-purple-200">
                  <div className="flex items-start space-x-3">
                    {form.tipo_cita === 'consulta' && <Stethoscope className="w-5 h-5 text-blue-600 mt-0.5" />}
                    {form.tipo_cita === 'seguimiento' && <Clock className="w-5 h-5 text-green-600 mt-0.5" />}
                    {form.tipo_cita === 'emergencia' && <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />}
                    <div>
                      <p className="text-sm text-gray-600">Tipo de Cita:</p>
                      <div className={`inline-flex items-center px-3 py-1.5 rounded-lg font-semibold text-sm mt-1 ${
                        form.tipo_cita === 'consulta' ? 'bg-blue-100 text-blue-700' :
                        form.tipo_cita === 'seguimiento' ? 'bg-green-100 text-green-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {form.tipo_cita === 'consulta' ? '🩺 Consulta Regular' : 
                         form.tipo_cita === 'seguimiento' ? '🔄 Seguimiento/Control' : 
                         '🚨 Atención de Emergencia'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Motivo de consulta */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Motivo de la Consulta (Opcional)
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <textarea
                  value={form.motivo}
                  onChange={(e) => setForm({ ...form, motivo: e.target.value })}
                  rows="3"
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
                  placeholder="Describa brevemente el motivo de la consulta..."
                />
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start space-x-3">
              <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-blue-900">Información Importante</p>
                <ul className="text-sm text-blue-800 mt-2 space-y-1">
                  <li>• Se enviará un correo de confirmación al paciente</li>
                  <li>• Se generará un comprobante imprimible con código QR</li>
                  <li>• Por favor llegue 15 minutos antes de su cita</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Botones de navegación */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t-2 border-gray-100">
          <button
            type="button"
            onClick={retrocederPaso}
            disabled={paso === 1}
            className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Anterior</span>
          </button>

          <div className="text-sm text-gray-500">
            Paso {paso} de 5
          </div>

          {paso < 5 ? (
            <button
              type="button"
              onClick={avanzarPaso}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all font-medium flex items-center space-x-2 shadow-lg hover:shadow-xl"
            >
              <span>Siguiente</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading}
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all font-medium flex items-center space-x-2 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-5 h-5" />
              <span>{isLoading ? 'Guardando...' : 'Confirmar y Agendar Cita'}</span>
            </button>
          )}
        </div>
      </form>

      {/* Modal de QR */}
      <QRModal
        isOpen={showQRModal}
        onClose={handleCloseQRModal}
        citaId={createdCitaId}
        citaData={createdCitaData}
      />
    </div>
  )
}

export default CitaForm
