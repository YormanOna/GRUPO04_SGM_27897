import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { 
  FileText, Search, AlertCircle, User, Calendar, Activity, 
  Heart, Droplets, Thermometer, Wind, Weight, ChevronDown, 
  ChevronUp, Pill, Clock, Shield, TrendingUp, CheckCircle,
  XCircle, Info
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import expedienteService from '../../services/expedienteService'
import { buscarPacientes } from '../../services/pacienteService'
import { 
  validarSignosVitales, 
  getBgColorClass, 
  getColorClass 
} from '../../utils/signosVitalesValidator'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const ExpedienteClinico = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const [busqueda, setBusqueda] = useState('')
  const [buscando, setBuscando] = useState(false)
  const [expediente, setExpediente] = useState(null)
  const [sugerencias, setSugerencias] = useState([])
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false)
  const [buscandoSugerencias, setBuscandoSugerencias] = useState(false)
  const searchRef = useRef(null)
  const [seccionesAbiertas, setSeccionesAbiertas] = useState({
    identificacion: true,
    alergias: true,
    antecedentes: true,
    consultas: true,
    recetas: false,
    graficos: false
  })

  // RF-002: Búsqueda automática si viene con query parameter
  useEffect(() => {
    const queryParam = searchParams.get('query')
    if (queryParam) {
      setBusqueda(queryParam)
      // Realizar búsqueda automática
      buscarExpedienteAutomatico(queryParam)
    }
  }, [searchParams])

  // Cerrar sugerencias al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setMostrarSugerencias(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Buscar sugerencias mientras el usuario escribe
  useEffect(() => {
    const buscarSugerenciasDebounce = async () => {
      if (busqueda.trim().length < 2) {
        setSugerencias([])
        setMostrarSugerencias(false)
        return
      }

      setBuscandoSugerencias(true)
      try {
        const pacientes = await buscarPacientes(busqueda.trim())
        setSugerencias(pacientes.slice(0, 5)) // Mostrar solo 5 sugerencias
        setMostrarSugerencias(pacientes.length > 0)
      } catch (error) {
        console.error('Error buscando sugerencias:', error)
        setSugerencias([])
      } finally {
        setBuscandoSugerencias(false)
      }
    }

    const timer = setTimeout(buscarSugerenciasDebounce, 300)
    return () => clearTimeout(timer)
  }, [busqueda])

  const buscarExpedienteAutomatico = async (query) => {
    setBuscando(true)
    try {
      const data = await expedienteService.buscarExpediente(query)
      setExpediente(data)
      toast.success('Expediente encontrado')
    } catch (error) {
      console.error('Error:', error)
      const mensaje = error.response?.data?.detail || 'No se encontró el expediente'
      toast.error(mensaje)
      setExpediente(null)
    } finally {
      setBuscando(false)
    }
  }

  const toggleSeccion = (seccion) => {
    setSeccionesAbiertas(prev => ({
      ...prev,
      [seccion]: !prev[seccion]
    }))
  }

  const buscarExpediente = async () => {
    if (!busqueda.trim()) {
      toast.error('Ingrese un número de historia clínica o cédula')
      return
    }

    setBuscando(true)
    try {
      const data = await expedienteService.buscarExpediente(busqueda.trim())
      setExpediente(data)
      toast.success('Expediente encontrado')
    } catch (error) {
      console.error('Error:', error)
      const mensaje = error.response?.data?.detail || 'No se encontró el expediente'
      toast.error(mensaje)
      setExpediente(null)
    } finally {
      setBuscando(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      buscarExpediente()
      setMostrarSugerencias(false)
    } else if (e.key === 'Escape') {
      setMostrarSugerencias(false)
    }
  }

  const seleccionarSugerencia = async (paciente) => {
    // Buscar por cédula del paciente
    setBusqueda(paciente.cedula.toString())
    setMostrarSugerencias(false)
    
    // Buscar expediente inmediatamente
    setBuscando(true)
    try {
      const data = await expedienteService.buscarExpediente(paciente.cedula.toString())
      setExpediente(data)
      toast.success(`Expediente de ${paciente.nombre} ${paciente.apellido} cargado`)
    } catch (error) {
      console.error('Error:', error)
      const mensaje = error.response?.data?.detail || 'No se encontró el expediente'
      toast.error(mensaje)
      setExpediente(null)
    } finally {
      setBuscando(false)
    }
  }

  const formatearFecha = (fecha) => {
    if (!fecha) return 'N/A'
    return new Date(fecha).toLocaleDateString('es-EC', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatearFechaHora = (fecha) => {
    if (!fecha) return 'N/A'
    return new Date(fecha).toLocaleString('es-EC', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const calcularEdad = (fechaNacimiento) => {
    if (!fechaNacimiento) return 'N/A'
    const hoy = new Date()
    const nacimiento = new Date(fechaNacimiento)
    let edad = hoy.getFullYear() - nacimiento.getFullYear()
    const mes = hoy.getMonth() - nacimiento.getMonth()
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--
    }
    return `${edad} años`
  }

  // Preparar datos para gráficos de tendencia
  const prepararDatosGrafico = () => {
    if (!expediente?.consultas || expediente.consultas.length === 0) return []
    
    return expediente.consultas
      .filter(c => c.signos_vitales)
      .map(c => {
        const sv = c.signos_vitales
        const pa = sv.presion_arterial ? sv.presion_arterial.split('/') : [null, null]
        
        return {
          fecha: new Date(c.fecha_consulta).toLocaleDateString('es-EC', { month: 'short', day: 'numeric' }),
          presion_sistolica: pa[0] ? parseInt(pa[0]) : null,
          presion_diastolica: pa[1] ? parseInt(pa[1]) : null,
          frecuencia_cardiaca: sv.frecuencia_cardiaca || null,
          temperatura: sv.temperatura || null,
          peso: sv.peso || null,
          saturacion: sv.saturacion_oxigeno || null
        }
      })
      .reverse() // Mostrar de más antigua a más reciente
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
              <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              Expediente Clínico Electrónico
            </h1>
          
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <strong>Usuario:</strong> {user?.nombre} {user?.apellido}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              <strong>Rol:</strong> {user?.cargo}
            </p>
          </div>
        </div>

        {/* Buscador */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-2 border-blue-200 dark:border-blue-800">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Buscar por Número de Historia Clínica, Cédula o Nombre
          </label>
          <div className="flex gap-3">
            <div className="flex-1 relative" ref={searchRef}>
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                onKeyPress={handleKeyPress}
                onFocus={() => sugerencias.length > 0 && setMostrarSugerencias(true)}
                placeholder="Ej: HC-2024-001, 1234567890 o Juan Pérez"
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all"
              />
              
              {/* Sugerencias de autocompletado */}
              {mostrarSugerencias && sugerencias.length > 0 && (
                <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-lg shadow-2xl max-h-80 overflow-y-auto">
                  {buscandoSugerencias ? (
                    <div className="p-4 text-center text-gray-500">
                      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                      Buscando...
                    </div>
                  ) : (
                    <div className="py-2">
                      {sugerencias.map((paciente) => (
                        <button
                          key={paciente.id}
                          onClick={() => seleccionarSugerencia(paciente)}
                          className="w-full px-4 py-3 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors text-left border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold">
                              {paciente.nombre.charAt(0)}{paciente.apellido.charAt(0)}
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-gray-800 dark:text-white">
                                {paciente.nombre} {paciente.apellido}
                              </p>
                              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                                <span>CI: {paciente.cedula}</span>
                                {paciente.numero_historia_clinica && (
                                  <span>HC: {paciente.numero_historia_clinica}</span>
                                )}
                              </div>
                            </div>
                            <User className="w-5 h-5 text-gray-400" />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            <button
              onClick={buscarExpediente}
              disabled={buscando}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
            >
              <Search className="w-5 h-5" />
              {buscando ? 'Buscando...' : 'Buscar'}
            </button>
          </div>
          
          {/* Indicador de búsqueda activa */}
          {busqueda.length > 0 && busqueda.length < 2 && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              💡 Escribe al menos 2 caracteres para ver sugerencias
            </p>
          )}
        </div>
      </div>

      {/* Mensaje de acceso limitado */}
      {expediente?.mensaje && (
        <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 p-4 rounded-lg">
          <div className="flex items-center gap-3">
            <Info className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            <div>
              <p className="font-semibold text-yellow-800 dark:text-yellow-200">
                Acceso Limitado
              </p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                {expediente.mensaje}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Contenido del expediente */}
      {expediente && (
        <div className="space-y-6">
          {/* Sección: Datos de Identificación */}
          <SeccionColapsable
            titulo="Datos de Identificación"
            icono={User}
            color="blue"
            abierta={seccionesAbiertas.identificacion}
            toggle={() => toggleSeccion('identificacion')}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <DatoItem label="Nombre Completo" valor={`${expediente.paciente.nombre} ${expediente.paciente.apellido}`} />
              <DatoItem label="Cédula" valor={expediente.paciente.cedula} />
              <DatoItem label="Historia Clínica" valor={expediente.historia?.identificador || 'N/A'} destacado />
              <DatoItem label="Fecha de Nacimiento" valor={formatearFecha(expediente.paciente.fecha_nacimiento)} />
              <DatoItem label="Edad" valor={calcularEdad(expediente.paciente.fecha_nacimiento)} />
              <DatoItem label="Género" valor={expediente.paciente.genero || 'N/A'} />
              <DatoItem label="Grupo Sanguíneo" valor={expediente.paciente.grupo_sanguineo || 'N/A'} />
              {expediente.paciente.email && <DatoItem label="Email" valor={expediente.paciente.email} />}
              {expediente.paciente.telefono && <DatoItem label="Teléfono" valor={expediente.paciente.telefono} />}
              {expediente.paciente.tipo_seguro && <DatoItem label="Tipo de Seguro" valor={expediente.paciente.tipo_seguro} />}
              {expediente.paciente.aseguradora && <DatoItem label="Aseguradora" valor={expediente.paciente.aseguradora} />}
              {expediente.paciente.numero_poliza && <DatoItem label="Número de Póliza" valor={expediente.paciente.numero_poliza} />}
            </div>
          </SeccionColapsable>

          {/* Sección: Alergias (ALERTA ROJA) */}
          {expediente.paciente.alergias && (
            <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-500 rounded-xl p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-3">
                <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400 animate-pulse" />
                <h3 className="text-xl font-bold text-red-800 dark:text-red-200">
                  ⚠️ ALERGIAS CONOCIDAS
                </h3>
              </div>
              <p className="text-lg text-red-700 dark:text-red-300 font-semibold">
                {expediente.paciente.alergias}
              </p>
            </div>
          )}

          {/* Sección: Antecedentes Médicos */}
          {expediente.paciente.antecedentes_medicos && (
            <SeccionColapsable
              titulo="Antecedentes Médicos"
              icono={Activity}
              color="amber"
              abierta={seccionesAbiertas.antecedentes}
              toggle={() => toggleSeccion('antecedentes')}
            >
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded-lg p-4">
                <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                  {expediente.paciente.antecedentes_medicos}
                </p>
              </div>
            </SeccionColapsable>
          )}

          {/* Sección: Historial de Consultas */}
          {expediente.consultas && expediente.consultas.length > 0 && (
            <SeccionColapsable
              titulo={`Historial de Consultas (${expediente.consultas.length})`}
              icono={Calendar}
              color="green"
              abierta={seccionesAbiertas.consultas}
              toggle={() => toggleSeccion('consultas')}
            >
              <div className="space-y-4">
                {expediente.consultas.map((consulta, index) => (
                  <ConsultaCard key={consulta.id} consulta={consulta} index={index} />
                ))}
              </div>
            </SeccionColapsable>
          )}

          {/* Sección: Prescripciones y Recetas */}
          {expediente.recetas && expediente.recetas.length > 0 && (
            <SeccionColapsable
              titulo={`Prescripciones y Dispensaciones (${expediente.recetas.length})`}
              icono={Pill}
              color="purple"
              abierta={seccionesAbiertas.recetas}
              toggle={() => toggleSeccion('recetas')}
            >
              <div className="space-y-4">
                {expediente.recetas.map((receta) => (
                  <RecetaCard key={receta.id} receta={receta} />
                ))}
              </div>
            </SeccionColapsable>
          )}

          {/* Sección: Gráficos de Tendencia */}
          {expediente.consultas && expediente.consultas.some(c => c.signos_vitales) && (
            <SeccionColapsable
              titulo="Gráficos de Tendencia - Signos Vitales"
              icono={TrendingUp}
              color="cyan"
              abierta={seccionesAbiertas.graficos}
              toggle={() => toggleSeccion('graficos')}
            >
              <GraficosTendencia datos={prepararDatosGrafico()} />
            </SeccionColapsable>
          )}
        </div>
      )}

      {/* Estado vacío */}
      {!expediente && !buscando && (
        <div className="text-center py-16">
          <FileText className="w-24 h-24 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
            No hay expediente seleccionado
          </h3>
          <p className="text-gray-500 dark:text-gray-500">
            Utilice el buscador para acceder al expediente de un paciente
          </p>
        </div>
      )}
    </div>
  )
}

// Componente: Sección Colapsable
const SeccionColapsable = ({ titulo, icono: Icono, color, abierta, toggle, children }) => {
  const colores = {
    blue: 'from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700',
    amber: 'from-amber-500 to-amber-600 dark:from-amber-600 dark:to-amber-700',
    green: 'from-green-500 to-green-600 dark:from-green-600 dark:to-green-700',
    purple: 'from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700',
    cyan: 'from-cyan-500 to-cyan-600 dark:from-cyan-600 dark:to-cyan-700'
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
      <button
        onClick={toggle}
        className={`w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r ${colores[color]} text-white hover:opacity-90 transition-all`}
      >
        <div className="flex items-center gap-3">
          <Icono className="w-6 h-6" />
          <h3 className="text-lg font-bold">{titulo}</h3>
        </div>
        {abierta ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
      </button>
      {abierta && (
        <div className="p-6">
          {children}
        </div>
      )}
    </div>
  )
}

// Componente: Dato Individual
const DatoItem = ({ label, valor, destacado = false }) => (
  <div className={`${destacado ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-300 dark:border-blue-700 rounded-lg p-3' : ''}`}>
    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{label}</p>
    <p className={`font-semibold ${destacado ? 'text-blue-700 dark:text-blue-300 text-lg' : 'text-gray-800 dark:text-gray-200'}`}>
      {valor}
    </p>
  </div>
)

// Componente: Tarjeta de Consulta
const ConsultaCard = ({ consulta, index }) => {
  const validacion = validarSignosVitales(consulta.signos_vitales)
  
  return (
    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-5 border-l-4 border-green-500">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h4 className="font-bold text-gray-800 dark:text-gray-200 text-lg">
            Consulta #{consulta.id}
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <Clock className="w-4 h-4 inline mr-1" />
            {new Date(consulta.fecha_consulta).toLocaleString('es-EC')}
          </p>
          {consulta.medico && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <User className="w-4 h-4 inline mr-1" />
              Dr. {consulta.medico.nombre} {consulta.medico.apellido}
            </p>
          )}
        </div>
        {validacion.estado === 'con_alertas' && (
          <div className="flex items-center gap-2 bg-red-100 dark:bg-red-900/30 px-3 py-1 rounded-full">
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
            <span className="text-xs font-semibold text-red-700 dark:text-red-300">
              {validacion.alertas.length} alerta(s)
            </span>
          </div>
        )}
      </div>

      {/* Signos Vitales con validación */}
      {consulta.signos_vitales && (
        <div className="mb-4">
          <h5 className="font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Signos Vitales
          </h5>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {validacion.resultados.presion_arterial && (
              <SignoVitalItem
                label="Presión Arterial"
                valor={consulta.signos_vitales.presion_arterial}
                validacion={validacion.resultados.presion_arterial}
                unidad="mmHg"
              />
            )}
            {validacion.resultados.frecuencia_cardiaca && (
              <SignoVitalItem
                label="Frecuencia Cardíaca"
                valor={consulta.signos_vitales.frecuencia_cardiaca}
                validacion={validacion.resultados.frecuencia_cardiaca}
                unidad="lpm"
              />
            )}
            {validacion.resultados.temperatura && (
              <SignoVitalItem
                label="Temperatura"
                valor={consulta.signos_vitales.temperatura}
                validacion={validacion.resultados.temperatura}
                unidad="°C"
              />
            )}
            {validacion.resultados.saturacion_oxigeno && (
              <SignoVitalItem
                label="Saturación O₂"
                valor={consulta.signos_vitales.saturacion_oxigeno}
                validacion={validacion.resultados.saturacion_oxigeno}
                unidad="%"
              />
            )}
          </div>
        </div>
      )}

      {/* Información clínica (solo para médicos) */}
      {consulta.motivo_consulta && (
        <div className="space-y-2">
          {consulta.motivo_consulta && (
            <CampoConsulta label="Motivo de Consulta" valor={consulta.motivo_consulta} />
          )}
          {consulta.diagnostico && (
            <CampoConsulta 
              label={consulta.diagnostico_codigo ? `Diagnóstico (${consulta.diagnostico_codigo})` : "Diagnóstico"} 
              valor={consulta.diagnostico} 
              destacado 
            />
          )}
          {consulta.tratamiento && (
            <CampoConsulta label="Tratamiento" valor={consulta.tratamiento} />
          )}
        </div>
      )}
    </div>
  )
}

// Componente: Signo Vital Individual
const SignoVitalItem = ({ label, valor, validacion, unidad }) => (
  <div className={`${getBgColorClass(validacion.valido)} rounded-lg p-3 border ${validacion.valido ? 'border-green-300 dark:border-green-700' : 'border-red-300 dark:border-red-700'}`}>
    <div className="flex items-center justify-between mb-1">
      <p className="text-xs text-gray-600 dark:text-gray-400">{label}</p>
      {validacion.icono && (
        <span className={`text-lg ${getColorClass(validacion.valido)}`}>
          {validacion.icono}
        </span>
      )}
    </div>
    <p className={`font-bold text-lg ${getColorClass(validacion.valido)}`}>
      {valor} {unidad}
    </p>
    <p className={`text-xs ${getColorClass(validacion.valido)}`}>
      {validacion.mensaje}
    </p>
  </div>
)

// Componente: Campo de Consulta
const CampoConsulta = ({ label, valor, destacado = false }) => (
  <div className={`${destacado ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700' : 'bg-white dark:bg-gray-600'} rounded p-3`}>
    <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">{label}</p>
    <p className={`text-sm ${destacado ? 'text-blue-800 dark:text-blue-200 font-semibold' : 'text-gray-700 dark:text-gray-300'}`}>
      {valor}
    </p>
  </div>
)

// Componente: Tarjeta de Receta
const RecetaCard = ({ receta }) => {
  const estadoConfig = {
    pendiente: { color: 'amber', icono: Clock, texto: 'Pendiente' },
    dispensada: { color: 'green', icono: CheckCircle, texto: 'Dispensada' },
    parcial: { color: 'blue', icono: Info, texto: 'Parcial' },
    cancelada: { color: 'red', icono: XCircle, texto: 'Cancelada' }
  }

  const config = estadoConfig[receta.estado] || estadoConfig.pendiente
  const Icono = config.icono

  return (
    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-5 border-l-4 border-purple-500">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h4 className="font-bold text-gray-800 dark:text-gray-200 text-lg">
            Receta #{receta.id}
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Emitida: {new Date(receta.fecha_emision).toLocaleDateString('es-EC')}
          </p>
        </div>
        <div className={`flex items-center gap-2 bg-${config.color}-100 dark:bg-${config.color}-900/30 px-3 py-1 rounded-full`}>
          <Icono className={`w-4 h-4 text-${config.color}-600 dark:text-${config.color}-400`} />
          <span className={`text-xs font-semibold text-${config.color}-700 dark:text-${config.color}-300`}>
            {config.texto}
          </span>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-600 rounded-lg p-4 mb-3">
        <h5 className="font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
          <Pill className="w-4 h-4" />
          Medicamentos Prescritos
        </h5>
        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
          {receta.medicamentos}
        </p>
      </div>

      {receta.indicaciones && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 mb-3">
          <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1">Indicaciones</p>
          <p className="text-sm text-blue-800 dark:text-blue-200">{receta.indicaciones}</p>
        </div>
      )}

      {receta.estado === 'dispensada' && receta.fecha_dispensacion && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 pt-3 border-t border-gray-300 dark:border-gray-600">
          <DatoItem label="Dispensada" valor={new Date(receta.fecha_dispensacion).toLocaleDateString('es-EC')} />
          {receta.lote && <DatoItem label="Lote" valor={receta.lote} />}
          {receta.fecha_vencimiento && <DatoItem label="Vencimiento" valor={new Date(receta.fecha_vencimiento).toLocaleDateString('es-EC')} />}
        </div>
      )}
    </div>
  )
}

// Componente: Gráficos de Tendencia
const GraficosTendencia = ({ datos }) => {
  if (!datos || datos.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        No hay suficientes datos para mostrar gráficos de tendencia
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Gráfico: Presión Arterial */}
      <div>
        <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-3">Evolución de Presión Arterial</h4>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={datos}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="fecha" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="presion_sistolica" stroke="#ef4444" name="Sistólica (mmHg)" strokeWidth={2} />
            <Line type="monotone" dataKey="presion_diastolica" stroke="#3b82f6" name="Diastólica (mmHg)" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Gráfico: Peso y Temperatura */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-3">Evolución de Peso</h4>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={datos}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="fecha" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="peso" stroke="#10b981" name="Peso (kg)" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div>
          <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-3">Evolución de Temperatura</h4>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={datos}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="fecha" />
              <YAxis domain={[36, 38]} />
              <Tooltip />
              <Line type="monotone" dataKey="temperatura" stroke="#f59e0b" name="Temperatura (°C)" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

export default ExpedienteClinico
