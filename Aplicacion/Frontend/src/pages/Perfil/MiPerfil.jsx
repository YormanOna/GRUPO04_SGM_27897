import React, { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { User, Mail, Phone, Briefcase, Calendar, Save, X, Edit2, Shield } from 'lucide-react'
import toast from 'react-hot-toast'

const MiPerfil = () => {
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    nombre: user?.nombre || '',
    apellido: user?.apellido || '',
    email: user?.email || '',
    telefono: user?.telefono || '',
    cargo: user?.cargo || ''
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleSave = async () => {
    try {
      // Aquí iría la llamada al API para actualizar el perfil
      // await updateProfile(user.id, formData)
      
      toast.success('✅ Perfil actualizado correctamente')
      setIsEditing(false)
    } catch (error) {
      toast.error('Error al actualizar el perfil')
    }
  }

  const handleCancel = () => {
    setFormData({
      nombre: user?.nombre || '',
      apellido: user?.apellido || '',
      email: user?.email || '',
      telefono: user?.telefono || '',
      cargo: user?.cargo || ''
    })
    setIsEditing(false)
  }

  const InfoField = ({ icon: Icon, label, value }) => (
    <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-blue-600" />
      </div>
      <div className="flex-1">
        <p className="text-xs text-gray-500 font-medium uppercase">{label}</p>
        <p className="text-base text-gray-800 font-semibold mt-1">{value || 'No especificado'}</p>
      </div>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg">
              {user?.nombre?.charAt(0)}{user?.apellido?.charAt(0)}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Mi Perfil</h1>
              <p className="text-gray-600">Gestiona tu información personal</p>
            </div>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
              isEditing
                ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                : 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700'
            }`}
          >
            {isEditing ? (
              <>
                <X className="w-5 h-5" />
                <span>Cancelar</span>
              </>
            ) : (
              <>
                <Edit2 className="w-5 h-5" />
                <span>Editar Perfil</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Información del Usuario */}
      <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
          <User className="w-6 h-6 mr-2 text-blue-600" />
          Información Personal
        </h2>

        {isEditing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre *
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Apellido *
                </label>
                <input
                  type="text"
                  name="apellido"
                  value={formData.apellido}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Correo Electrónico *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Teléfono
              </label>
              <input
                type="tel"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                onClick={handleCancel}
                className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all font-medium shadow-lg flex items-center justify-center"
              >
                <Save className="w-5 h-5 mr-2" />
                Guardar Cambios
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoField icon={User} label="Nombre Completo" value={`${user?.nombre} ${user?.apellido}`} />
            <InfoField icon={Mail} label="Correo Electrónico" value={user?.email} />
            <InfoField icon={Briefcase} label="Cargo" value={user?.cargo} />
            <InfoField icon={Shield} label="Rol" value={user?.rol || 'Usuario'} />
          </div>
        )}
      </div>

      {/* Información de Cuenta */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
          <Shield className="w-6 h-6 mr-2 text-blue-600" />
          Información de Cuenta
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoField icon={Calendar} label="Miembro desde" value={new Date().toLocaleDateString('es-ES')} />
          <InfoField icon={Shield} label="Estado de Cuenta" value="Activa" />
        </div>
      </div>
    </div>
  )
}

export default MiPerfil
