import React, { useEffect, useState } from 'react'
import { getMedicos } from '../../services/medicoService'
import { UserCheck, Search, Award, Mail, Phone, Stethoscope } from 'lucide-react'

const MedicoList = () => {
  const [medicos, setMedicos] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMedicos()
  }, [])

  const loadMedicos = async () => {
    try {
      const data = await getMedicos()
      setMedicos(data)
    } catch (error) {
      console.error('Error loading doctors:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredMedicos = medicos.filter(m =>
    m.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.apellido?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.especialidad?.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-cyan-700 rounded-xl flex items-center justify-center">
            <UserCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-800">Médicos</h2>
            <p className="text-gray-600">Personal médico del sistema</p>
          </div>
        </div>
      </div>

      {/* Búsqueda */}
      <div className="bg-white rounded-xl shadow-card p-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar médico por nombre o especialidad..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <p className="text-sm text-gray-600">Total Médicos</p>
          <p className="text-2xl font-bold text-gray-800">{medicos.length}</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <p className="text-sm text-gray-600">Especialidades</p>
          <p className="text-2xl font-bold text-cyan-600">
            {new Set(medicos.map(m => m.especialidad).filter(Boolean)).size}
          </p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <p className="text-sm text-gray-600">Activos Hoy</p>
          <p className="text-2xl font-bold text-green-600">{medicos.length}</p>
        </div>
      </div>

      {/* Grid de tarjetas de médicos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMedicos.length > 0 ? (
          filteredMedicos.map((medico) => (
            <div
              key={medico.id}
              className="bg-white rounded-xl shadow-card hover:shadow-card-hover transition-all duration-200 overflow-hidden group"
            >
              {/* Header de la tarjeta */}
              <div className="bg-gradient-to-r from-cyan-500 to-cyan-600 p-6 text-white">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white font-bold text-xl border-2 border-white/30">
                    {medico.nombre?.charAt(0)}{medico.apellido?.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold">
                      Dr. {medico.nombre} {medico.apellido}
                    </h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <Award className="w-4 h-4" />
                      <span className="text-sm text-cyan-100">
                        {medico.especialidad || 'Medicina General'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contenido de la tarjeta */}
              <div className="p-6 space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 text-gray-600">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Stethoscope className="w-4 h-4 text-cyan-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Cédula</p>
                      <p className="font-mono text-sm font-medium text-gray-800">{medico.cedula}</p>
                    </div>
                  </div>

                  {medico.email && (
                    <div className="flex items-center space-x-3 text-gray-600">
                      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Mail className="w-4 h-4 text-cyan-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500">Email</p>
                        <p className="text-sm text-gray-800 truncate">{medico.email}</p>
                      </div>
                    </div>
                  )}

                  {medico.telefono && (
                    <div className="flex items-center space-x-3 text-gray-600">
                      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Phone className="w-4 h-4 text-cyan-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Teléfono</p>
                        <p className="text-sm text-gray-800">{medico.telefono}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center py-12">
            <UserCheck className="w-16 h-16 text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">No se encontraron médicos</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default MedicoList

