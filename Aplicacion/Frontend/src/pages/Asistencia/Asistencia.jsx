import React, { useState, useEffect } from 'react'
import { Clock, LogIn, LogOut, Calendar, User, CheckCircle2, XCircle } from 'lucide-react'
import { registrarEntrada, registrarSalida, getAsistencias } from '../../services/asistenciaService'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

const Asistencia = () => {
  const { user } = useAuth()
  const [asistencias, setAsistencias] = useState([])
  const [loading, setLoading] = useState(false)
  const [ultimaAsistencia, setUltimaAsistencia] = useState(null)
  const [observaciones, setObservaciones] = useState('')
  const [horaActual, setHoraActual] = useState(new Date())

  useEffect(() => {
    loadAsistencias()
    
    // Actualizar el reloj cada segundo
    const interval = setInterval(() => {
      setHoraActual(new Date())
    }, 1000)
    
    return () => clearInterval(interval)
  }, [])

  const loadAsistencias = async () => {
    try {
      const data = await getAsistencias()
      setAsistencias(data)
      
      // Buscar última entrada sin salida
      const sinSalida = data.find(a => !a.fecha_salida)
      setUltimaAsistencia(sinSalida)
    } catch (error) {
      console.error('Error cargando asistencias:', error)
    }
  }

  const handleEntrada = async () => {
    setLoading(true)
    try {
      await registrarEntrada(observaciones || null)
      toast.success('✅ Entrada registrada exitosamente')
      setObservaciones('')
      loadAsistencias()
    } catch (error) {
      toast.error('Error al registrar entrada')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleSalida = async () => {
    setLoading(true)
    try {
      await registrarSalida(observaciones || null)
      toast.success('👋 Salida registrada exitosamente')
      setObservaciones('')
      loadAsistencias()
    } catch (error) {
      toast.error('Error al registrar salida')
      console.error(error)
    } finally {
      setLoading(false)
    }
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

  const calcularHorasTrabajadas = (entrada, salida) => {
    if (!salida) return 'En curso'
    const diff = new Date(salida) - new Date(entrada)
    const hours = Math.floor(diff / 1000 / 60 / 60)
    const minutes = Math.floor((diff / 1000 / 60) % 60)
    return `${hours}h ${minutes}m`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Control de Asistencia</h1>
          <p className="text-gray-600 mt-1">Registra tu entrada y salida diaria</p>
        </div>
        <div className="flex items-center space-x-3 bg-white px-5 py-3 rounded-xl shadow-md border border-gray-200">
          <Clock className="w-6 h-6 text-blue-600" />
          <div>
            <p className="text-xs text-gray-500">Hora actual (Ecuador)</p>
            <p className="text-sm font-semibold text-gray-700">
              {horaActual.toLocaleTimeString('es-EC', {
                timeZone: 'America/Guayaquil',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Estado actual */}
      <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">
              {ultimaAsistencia ? '🟢 En trabajo' : '⚪ Fuera del trabajo'}
            </h2>
            <p className="text-blue-100">
              {ultimaAsistencia 
                ? `Entrada: ${formatearFecha(ultimaAsistencia.fecha_entrada)}`
                : 'No hay registro de entrada activo'
              }
            </p>
          </div>
          <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center">
            <User className="w-10 h-10 text-white" />
          </div>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Registrar Entrada */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <LogIn className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">Registrar Entrada</h3>
              <p className="text-sm text-gray-600">Marca tu hora de llegada</p>
            </div>
          </div>
          <textarea
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            placeholder="Observaciones (opcional)"
            className="w-full p-3 border-2 border-gray-200 rounded-xl mb-4 focus:outline-none focus:border-green-500 resize-none"
            rows="2"
          />
          <button
            onClick={handleEntrada}
            disabled={loading || ultimaAsistencia}
            className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-xl font-semibold hover:from-green-700 hover:to-green-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {loading ? 'Registrando...' : 'Marcar Entrada'}
          </button>
          {ultimaAsistencia && (
            <p className="text-xs text-amber-600 mt-2 text-center">
              ⚠️ Ya tienes una entrada activa
            </p>
          )}
        </div>

        {/* Registrar Salida */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <LogOut className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">Registrar Salida</h3>
              <p className="text-sm text-gray-600">Marca tu hora de salida</p>
            </div>
          </div>
          <textarea
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            placeholder="Observaciones (opcional)"
            className="w-full p-3 border-2 border-gray-200 rounded-xl mb-4 focus:outline-none focus:border-red-500 resize-none"
            rows="2"
          />
          <button
            onClick={handleSalida}
            disabled={loading || !ultimaAsistencia}
            className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-3 rounded-xl font-semibold hover:from-red-700 hover:to-red-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {loading ? 'Registrando...' : 'Marcar Salida'}
          </button>
          {!ultimaAsistencia && (
            <p className="text-xs text-amber-600 mt-2 text-center">
              ⚠️ Debes registrar entrada primero
            </p>
          )}
        </div>
      </div>

      {/* Historial de asistencias */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
            <Calendar className="w-5 h-5 text-purple-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-800">Historial de Asistencias</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Fecha Entrada</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Fecha Salida</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Horas</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Estado</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Observaciones</th>
              </tr>
            </thead>
            <tbody>
              {asistencias.length > 0 ? (
                asistencias.map((asistencia) => (
                  <tr key={asistencia.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-800">
                      {formatearFecha(asistencia.fecha_entrada)}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-800">
                      {asistencia.fecha_salida ? formatearFecha(asistencia.fecha_salida) : '-'}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-800">
                      {calcularHorasTrabajadas(asistencia.fecha_entrada, asistencia.fecha_salida)}
                    </td>
                    <td className="py-3 px-4">
                      {asistencia.fecha_salida ? (
                        <span className="inline-flex items-center space-x-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Completado</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold">
                          <Clock className="w-3 h-3" />
                          <span>En curso</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {asistencia.observaciones || '-'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-gray-500">
                    No hay registros de asistencia
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

export default Asistencia
