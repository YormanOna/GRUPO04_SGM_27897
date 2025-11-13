import React, { useEffect, useState } from 'react'
import { getMedicamentos, createMedicamento } from '../../services/medicamentoService'
import { Pill, Search, Plus, Package, AlertTriangle, TrendingUp, Edit, Trash2, X, Eye } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import FormField from '../../components/FormField'

const MedicamentoList = () => {
  const { user } = useAuth()
  const [medicamentos, setMedicamentos] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [nuevoMedicamento, setNuevoMedicamento] = useState({
    nombre: '',
    contenido: '',
    stock: 0
  })
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})

  // Permisos: Solo Administradores pueden crear/editar/eliminar medicamentos
  const isAdmin = user?.cargo === 'Administrador' || user?.cargo === 'Admin General'
  const isFarmaceutico = user?.cargo === 'Farmaceutico'

  useEffect(() => {
    loadMedicamentos()
  }, [])

  const loadMedicamentos = async () => {
    try {
      setLoading(true)
      console.log('Cargando medicamentos...')
      const data = await getMedicamentos()
      console.log('Medicamentos recibidos:', data)
      console.log('Tipo de datos:', typeof data)
      console.log('Es array:', Array.isArray(data))
      
      if (Array.isArray(data)) {
        setMedicamentos(data)
        console.log('Total medicamentos cargados:', data.length)
      } else {
        console.error('Los datos no son un array:', data)
        setMedicamentos([])
        toast.error('Error: formato de datos incorrecto')
      }
    } catch (error) {
      console.error('Error loading medications:', error)
      console.error('Error completo:', error.response?.data || error.message)
      toast.error('Error al cargar medicamentos: ' + (error.response?.data?.detail || error.message))
      setMedicamentos([])
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setNuevoMedicamento(prev => ({
      ...prev,
      [name]: name === 'stock' ? parseInt(value) || 0 : value
    }))
    
    // Limpiar error cuando el usuario empiece a escribir
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' })
    }
  }

  const handleBlur = (e) => {
    const { name } = e.target
    setTouched({ ...touched, [name]: true })
    validateField(name, nuevoMedicamento[name])
  }

  const validateField = (name, value) => {
    let error = ''

    switch (name) {
      case 'nombre':
        if (!value || !value.toString().trim()) {
          error = 'El nombre del medicamento es obligatorio'
        } else if (value.toString().trim().length < 3) {
          error = 'El nombre debe tener al menos 3 caracteres'
        } else if (value.toString().trim().length > 150) {
          error = 'El nombre no puede exceder 150 caracteres'
        }
        break

      case 'contenido':
        if (value && value.toString().trim().length > 100) {
          error = 'El contenido no puede exceder 100 caracteres'
        }
        break

      case 'stock':
        const stockNum = parseInt(value)
        if (isNaN(stockNum) || stockNum < 0) {
          error = 'El stock debe ser un número mayor o igual a 0'
        } else if (stockNum > 10000) {
          error = 'El stock no puede exceder 10,000 unidades'
        }
        break

      default:
        break
    }

    setErrors(prev => ({ ...prev, [name]: error }))
    return error
  }

  const validateForm = () => {
    const newErrors = {}
    
    const nombreError = validateField('nombre', nuevoMedicamento.nombre)
    if (nombreError) newErrors.nombre = nombreError

    const contenidoError = validateField('contenido', nuevoMedicamento.contenido)
    if (contenidoError) newErrors.contenido = contenidoError

    const stockError = validateField('stock', nuevoMedicamento.stock)
    if (stockError) newErrors.stock = stockError

    setTouched({ nombre: true, contenido: true, stock: true })
    setErrors(newErrors)
    
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validar formulario completo
    if (!validateForm()) {
      toast.error('Por favor corrija los errores en el formulario')
      return
    }

    try {
      await createMedicamento(nuevoMedicamento)
      toast.success('Medicamento agregado exitosamente')
      setShowModal(false)
      setNuevoMedicamento({
        nombre: '',
        contenido: '',
        stock: 0
      })
      setErrors({})
      setTouched({})
      loadMedicamentos()
    } catch (error) {
      console.error('Error creating medication:', error)
      const errorMsg = error.response?.data?.detail || 'Error al agregar medicamento'
      if (typeof errorMsg === 'object') {
        const errores = Object.values(errorMsg).flat()
        errores.forEach(err => toast.error(err))
      } else {
        toast.error(errorMsg)
      }
    }
  }

  const filteredMedicamentos = medicamentos.filter(m =>
    m.nombre?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStockStatus = (stock) => {
    if (stock === 0) return { color: 'text-red-600', bg: 'bg-red-100', label: 'Agotado', icon: AlertTriangle }
    if (stock < 10) return { color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'Bajo', icon: AlertTriangle }
    return { color: 'text-green-600', bg: 'bg-green-100', label: 'Disponible', icon: Package }
  }

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
          <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-700 rounded-xl flex items-center justify-center">
            <Pill className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-800">Farmacia</h2>
            <p className="text-gray-600">
              {isFarmaceutico ? 'Inventario de medicamentos (Solo lectura)' : 'Inventario de medicamentos'}
            </p>
          </div>
        </div>
        {/* Botón Agregar solo para Administradores */}
        {isAdmin && (
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-2 bg-gradient-to-r from-orange-600 to-orange-700 text-white px-6 py-3 rounded-xl hover:from-orange-700 hover:to-orange-800 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
          >
            <Plus className="w-5 h-5" />
            <span>Agregar Medicamento</span>
          </button>
        )}
      </div>

      {/* Búsqueda */}
      <div className="bg-white rounded-xl shadow-card p-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar medicamento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Medicamentos</p>
              <p className="text-2xl font-bold text-gray-800">{medicamentos.length}</p>
            </div>
            <Package className="w-10 h-10 text-blue-500 opacity-20" />
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Stock Total</p>
              <p className="text-2xl font-bold text-green-600">
                {medicamentos.reduce((sum, m) => sum + (m.stock || 0), 0)}
              </p>
            </div>
            <TrendingUp className="w-10 h-10 text-green-500 opacity-20" />
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Stock Bajo</p>
              <p className="text-2xl font-bold text-yellow-600">
                {medicamentos.filter(m => m.stock > 0 && m.stock < 10).length}
              </p>
            </div>
            <AlertTriangle className="w-10 h-10 text-yellow-500 opacity-20" />
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Agotados</p>
              <p className="text-2xl font-bold text-red-600">
                {medicamentos.filter(m => m.stock === 0).length}
              </p>
            </div>
            <AlertTriangle className="w-10 h-10 text-red-500 opacity-20" />
          </div>
        </div>
      </div>

      {/* Grid de medicamentos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMedicamentos.length > 0 ? (
          filteredMedicamentos.map((medicamento) => {
            const stockStatus = getStockStatus(medicamento.stock)
            const StatusIcon = stockStatus.icon

            return (
              <div
                key={medicamento.id}
                className="bg-white rounded-xl shadow-card hover:shadow-card-hover transition-all duration-200 overflow-hidden"
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                        <Pill className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-white">
                        <h3 className="font-bold text-lg">{medicamento.nombre}</h3>
                        <p className="text-xs text-orange-100">ID: {medicamento.id}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contenido */}
                <div className="p-6 space-y-4">
                  {/* Stock */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Stock disponible</span>
                    <div className="flex items-center space-x-2">
                      <span className={`text-2xl font-bold ${stockStatus.color}`}>
                        {medicamento.stock || 0}
                      </span>
                      <span className="text-gray-500 text-sm">unidades</span>
                    </div>
                  </div>

                  {/* Contenido */}
                  {medicamento.contenido && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Contenido</span>
                      <span className="font-medium text-gray-800">{medicamento.contenido} mg</span>
                    </div>
                  )}

                  {/* Estado */}
                  <div className={`flex items-center space-x-2 p-3 rounded-lg ${stockStatus.bg}`}>
                    <StatusIcon className={`w-5 h-5 ${stockStatus.color}`} />
                    <span className={`font-medium ${stockStatus.color}`}>
                      {stockStatus.label}
                    </span>
                  </div>

                 
                  {/* Acciones - Solo para Administradores */}
                  {isAdmin && (
                    <div className="flex space-x-2 pt-4 border-t border-gray-200">
                      <button className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-sm font-medium transition-colors">
                        <Edit className="w-4 h-4" />
                        <span>Editar</span>
                      </button>
                      <button className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors">
                        <Trash2 className="w-4 h-4" />
                        <span>Eliminar</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center py-12">
            <Pill className="w-16 h-16 text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">No se encontraron medicamentos</p>
          </div>
        )}
      </div>

      {/* Modal Agregar Medicamento */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            {/* Header del Modal */}
            <div className="bg-gradient-to-r from-orange-600 to-orange-700 p-6 rounded-t-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <Pill className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Agregar Medicamento</h3>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Contenido del Modal */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Nombre */}
              <FormField
                label="Nombre del Medicamento"
                icon={Pill}
                name="nombre"
                value={nuevoMedicamento.nombre}
                onChange={handleInputChange}
                onBlur={handleBlur}
                error={errors.nombre}
                touched={touched.nombre}
                placeholder="Ej: Paracetamol"
                required
              />

              {/* Contenido */}
              <FormField
                label="Contenido/Presentación"
                icon={Package}
                name="contenido"
                value={nuevoMedicamento.contenido}
                onChange={handleInputChange}
                onBlur={handleBlur}
                error={errors.contenido}
                touched={touched.contenido}
                placeholder="Ej: 500mg, 100ml, etc."
              />

              {/* Stock */}
              <div>
                <FormField
                  label="Stock Inicial"
                  icon={TrendingUp}
                  name="stock"
                  type="number"
                  value={nuevoMedicamento.stock}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  error={errors.stock}
                  touched={touched.stock}
                  min="0"
                  placeholder="0"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  El medicamento se asignará automáticamente a la farmacia principal
                </p>
              </div>

              {/* Botones */}
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-lg hover:from-orange-700 hover:to-orange-800 transition-colors font-medium shadow-lg"
                >
                  Agregar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default MedicamentoList

