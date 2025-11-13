import React, { useState, useEffect } from 'react'
import { createPaciente, getPaciente, updatePaciente } from '../../services/pacienteService'
import { useNavigate, useParams } from 'react-router-dom'
import { UserPlus, Save, X, User, CreditCard, Mail, Phone, MapPin, Calendar, Droplet, AlertCircle, Users, Eye } from 'lucide-react'
import toast from 'react-hot-toast'
import FormField, { TextAreaField, SelectField } from '../../components/FormField'

const PacienteForm = ({ mode = 'create' }) => {
  const { id } = useParams()
  const isEdit = id && mode !== 'view'
  const isView = mode === 'view'
  const [form, setForm] = useState({ 
    nombre: '', 
    apellido: '', 
    cedula: '',
    email: '',
    telefono: '',
    direccion: '',
    fecha_nacimiento: '',
    genero: '',
    grupo_sanguineo: '',
    alergias: '',
    antecedentes_medicos: '',
    contacto_emergencia_nombre: '',
    contacto_emergencia_telefono: '',
    contacto_emergencia_relacion: '',
    // Nuevos campos de afiliación médica (RF-001)
    tipo_seguro: '',
    aseguradora: '',
    numero_poliza: '',
    fecha_vigencia_poliza: ''
  })
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [cedulaValida, setCedulaValida] = useState(null) // null, true, false
  const [numeroHistoriaClinica, setNumeroHistoriaClinica] = useState(null)
  const navigate = useNavigate()

  // Cargar datos del paciente si está en modo edición o vista
  useEffect(() => {
    if (id) {
      loadPaciente()
    }
  }, [id])

  const loadPaciente = async () => {
    try {
      setIsLoading(true)
      const paciente = await getPaciente(id)
      setForm({
        nombre: paciente.nombre || '',
        apellido: paciente.apellido || '',
        cedula: paciente.cedula?.toString() || '',
        email: paciente.email || '',
        telefono: paciente.telefono || '',
        direccion: paciente.direccion || '',
        fecha_nacimiento: paciente.fecha_nacimiento || '',
        genero: paciente.genero || '',
        grupo_sanguineo: paciente.grupo_sanguineo || '',
        alergias: paciente.alergias || '',
        antecedentes_medicos: paciente.antecedentes_medicos || '',
        contacto_emergencia_nombre: paciente.contacto_emergencia_nombre || '',
        contacto_emergencia_telefono: paciente.contacto_emergencia_telefono || '',
        contacto_emergencia_relacion: paciente.contacto_emergencia_relacion || '',
        tipo_seguro: paciente.tipo_seguro || '',
        aseguradora: paciente.aseguradora || '',
        numero_poliza: paciente.numero_poliza || '',
        fecha_vigencia_poliza: paciente.fecha_vigencia_poliza || ''
      })
      setCedulaValida(true)
      if (paciente.numero_historia_clinica) {
        setNumeroHistoriaClinica(paciente.numero_historia_clinica)
      }
    } catch (error) {
      console.error('Error loading patient:', error)
      toast.error('Error al cargar datos del paciente')
      navigate('/pacientes')
    } finally {
      setIsLoading(false)
    }
  }

  // Función de validación de cédula ecuatoriana (RF-001)
  const validarCedulaEcuatoriana = (cedula) => {
    if (cedula.length !== 10) return false
    
    // Verificar que todos sean dígitos
    if (!/^\d+$/.test(cedula)) return false
    
    // Verificar código de provincia (01-24)
    const provincia = parseInt(cedula.substring(0, 2), 10)
    if (provincia < 1 || provincia > 24) return false
    
    // Verificar tercer dígito (debe ser menor a 6 para personas naturales)
    const tercerDigito = parseInt(cedula.charAt(2), 10)
    if (tercerDigito > 5) return false
    
    // Algoritmo de validación del dígito verificador
    const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2]
    let suma = 0
    
    for (let i = 0; i < 9; i++) {
      let valor = parseInt(cedula.charAt(i), 10) * coeficientes[i]
      if (valor > 9) valor -= 9
      suma += valor
    }
    
    const residuo = suma % 10
    const digitoVerificador = residuo === 0 ? 0 : 10 - residuo
    const digitoVerificadorRecibido = parseInt(cedula.charAt(9), 10)
    
    return digitoVerificador === digitoVerificadorRecibido
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm({ ...form, [name]: value })
    
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' })
    }
  }

  const handleBlur = (e) => {
    const { name } = e.target
    setTouched({ ...touched, [name]: true })
    validateField(name, form[name])
  }

  const validateField = (name, value) => {
    let error = ''

    switch (name) {
      case 'nombre':
        if (!value.trim()) {
          error = 'El nombre es obligatorio'
        } else if (value.trim().length < 2) {
          error = 'El nombre debe tener al menos 2 caracteres'
        } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(value)) {
          error = 'El nombre solo puede contener letras'
        }
        break

      case 'apellido':
        if (!value.trim()) {
          error = 'El apellido es obligatorio'
        } else if (value.trim().length < 2) {
          error = 'El apellido debe tener al menos 2 caracteres'
        } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(value)) {
          error = 'El apellido solo puede contener letras'
        }
        break

      case 'cedula':
        if (!value.trim()) {
          error = 'La cédula es obligatoria'
          setCedulaValida(null)
        } else if (!/^\d{10}$/.test(value.trim())) {
          error = 'La cédula debe tener exactamente 10 dígitos'
          setCedulaValida(false)
        } else {
          // Validación de cédula ecuatoriana (RF-001)
          const isValid = validarCedulaEcuatoriana(value.trim())
          if (!isValid) {
            error = 'La cédula ingresada no es válida'
            setCedulaValida(false)
          } else {
            setCedulaValida(true)
          }
        }
        break

      case 'email':
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          error = 'El correo electrónico no es válido'
        }
        break

      case 'telefono':
        if (value && value.length < 7) {
          error = 'El teléfono debe tener al menos 7 dígitos'
        } else if (value && !/^[\d\s\+\-\(\)]+$/.test(value)) {
          error = 'El teléfono solo puede contener números y símbolos telefónicos'
        }
        break

      case 'fecha_nacimiento':
        if (value) {
          const fecha = new Date(value)
          const hoy = new Date()
          if (fecha > hoy) {
            error = 'La fecha de nacimiento no puede ser futura'
          }
          const edad = hoy.getFullYear() - fecha.getFullYear()
          if (edad > 120) {
            error = 'La fecha de nacimiento no es válida'
          }
        }
        break

      case 'grupo_sanguineo':
        if (value && !/^(A|B|AB|O)[+-]$/.test(value)) {
          error = 'Formato de grupo sanguíneo inválido (ej: O+, A-, B+)'
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
    const fields = ['nombre', 'apellido', 'cedula']
    
    fields.forEach(field => {
      const error = validateField(field, form[field])
      if (error) newErrors[field] = error
    })

    // Validar email si está presente
    if (form.email) {
      const emailError = validateField('email', form.email)
      if (emailError) newErrors.email = emailError
    }

    // Validar teléfono si está presente
    if (form.telefono) {
      const telefonoError = validateField('telefono', form.telefono)
      if (telefonoError) newErrors.telefono = telefonoError
    }

    // Validar fecha de nacimiento si está presente
    if (form.fecha_nacimiento) {
      const fechaError = validateField('fecha_nacimiento', form.fecha_nacimiento)
      if (fechaError) newErrors.fecha_nacimiento = fechaError
    }

    // Marcar todos los campos como tocados
    const allTouched = {}
    Object.keys(form).forEach(key => {
      allTouched[key] = true
    })
    setTouched(allTouched)

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

    setIsLoading(true)
    try {
      // Convertir cedula a número entero y preparar datos
      const pacienteData = {
        ...form,
        cedula: parseInt(form.cedula.trim(), 10)
      }
      
      if (isEdit) {
        // Modo edición: actualizar paciente existente
        await updatePaciente(id, pacienteData)
        toast.success('✅ Paciente actualizado exitosamente')
        
        // Esperar 1 segundo antes de redirigir
        setTimeout(() => {
          navigate('/pacientes')
        }, 1000)
      } else {
        // Modo creación: crear nuevo paciente con generación automática de HC (RF-001)
        const response = await createPaciente(pacienteData)
        
        // Capturar el número de historia clínica generado
        if (response.numero_historia_clinica) {
          setNumeroHistoriaClinica(response.numero_historia_clinica)
          toast.success(
            `✅ Paciente registrado exitosamente\n📋 HC: ${response.numero_historia_clinica}`,
            { duration: 5000 }
          )
        } else {
          toast.success('Paciente registrado exitosamente')
        }
        
        // Esperar 2 segundos para mostrar el número de HC antes de redirigir
        setTimeout(() => {
          navigate('/pacientes')
        }, 2000)
      }
    } catch (error) {
      console.error('Error:', error)
      
      // Manejar errores de validación 422
      if (error.response?.status === 422) {
        const validationErrors = error.response?.data?.detail
        if (Array.isArray(validationErrors)) {
          // Mostrar cada error de validación
          validationErrors.forEach(err => {
            const field = err.loc?.[1] || 'campo'
            const message = err.msg || 'Error de validación'
            toast.error(`${field}: ${message}`)
          })
        } else if (typeof validationErrors === 'string') {
          toast.error(validationErrors)
        } else {
          toast.error('Error de validación en los datos del formulario')
        }
      } else {
        const errorMsg = error.response?.data?.detail || 
          (isEdit ? 'Error al actualizar paciente' : 'Error al registrar paciente')
        toast.error(errorMsg)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-3">
            <div className={`w-12 h-12 bg-gradient-to-br ${isView ? 'from-blue-500 to-blue-700' : isEdit ? 'from-yellow-500 to-orange-700' : 'from-green-500 to-green-700'} rounded-xl flex items-center justify-center`}>
              {isView ? <Eye className="w-6 h-6 text-white" /> : isEdit ? <User className="w-6 h-6 text-white" /> : <UserPlus className="w-6 h-6 text-white" />}
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-800">
                {isView ? 'Ver Paciente' : isEdit ? 'Editar Paciente' : 'Nuevo Paciente'}
              </h2>
              <p className="text-gray-600">
                {isView ? 'Información del paciente' : isEdit ? 'Actualizar información del paciente' : 'Registrar información del paciente'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/pacientes')}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            ← Volver
          </button>
        </div>
      </div>

      <form onSubmit={isView ? (e) => e.preventDefault() : handleSubmit} className="bg-white rounded-xl shadow-card p-8">
        {/* Alerta de Historia Clínica Generada (RF-001) */}
        {numeroHistoriaClinica && (
          <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">✓</span>
              </div>
              <div>
                <p className="text-green-800 font-semibold">¡Paciente registrado exitosamente!</p>
                <p className="text-green-700 text-sm mt-1">
                  Número de Historia Clínica generado: <span className="font-mono font-bold">{numeroHistoriaClinica}</span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Información Personal */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center space-x-2">
            <User className="w-5 h-5 text-primary-600" />
            <span>Información Personal</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              label="Nombre"
              icon={User}
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.nombre}
              touched={touched.nombre}
              placeholder="Ingrese el nombre"
              required
            />
            <FormField
              label="Apellido"
              icon={User}
              name="apellido"
              value={form.apellido}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.apellido}
              touched={touched.apellido}
              placeholder="Ingrese el apellido"
              required
            />
            <div>
              <FormField
                label="Cédula"
                icon={CreditCard}
                name="cedula"
                type="text"
                value={form.cedula}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.cedula}
                touched={touched.cedula}
                placeholder="1234567890"
                maxLength="10"
                required
              />
              {/* Indicador de validación de cédula (RF-001) */}
              {form.cedula.length === 10 && cedulaValida !== null && (
                <div className={`mt-2 flex items-center space-x-2 text-sm ${cedulaValida ? 'text-green-600' : 'text-red-600'}`}>
                  {cedulaValida ? (
                    <>
                      <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-600 font-bold">✓</span>
                      </div>
                      <span>Cédula ecuatoriana válida</span>
                    </>
                  ) : (
                    <>
                      <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center">
                        <span className="text-red-600 font-bold">✗</span>
                      </div>
                      <span>Cédula inválida</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Información de Contacto */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center space-x-2">
            <Phone className="w-5 h-5 text-primary-600" />
            <span>Información de Contacto</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              label="Correo Electrónico"
              icon={Mail}
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.email}
              touched={touched.email}
              placeholder="correo@ejemplo.com"
            />
            <FormField
              label="Teléfono"
              icon={Phone}
              name="telefono"
              type="tel"
              value={form.telefono}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.telefono}
              touched={touched.telefono}
              placeholder="+593 999 999 999"
            />
          </div>
          <div className="mt-6">
            <TextAreaField
              label="Dirección"
              icon={MapPin}
              name="direccion"
              value={form.direccion}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.direccion}
              touched={touched.direccion}
              rows={3}
              placeholder="Ingrese la dirección completa"
            />
          </div>
        </div>

        {/* Información de Afiliación Médica (RF-001) */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center space-x-2">
            <CreditCard className="w-5 h-5 text-blue-600" />
            <span>Afiliación Médica</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SelectField
              label="Tipo de Seguro"
              icon={CreditCard}
              name="tipo_seguro"
              value={form.tipo_seguro}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.tipo_seguro}
              touched={touched.tipo_seguro}
            >
              <option value="">Seleccione</option>
              <option value="Público">Público (MSP)</option>
              <option value="IESS">IESS</option>
              <option value="Seguro Privado">Seguro Privado</option>
              <option value="Particular">Particular</option>
              <option value="Otro">Otro</option>
            </SelectField>
            <FormField
              label="Aseguradora"
              icon={CreditCard}
              name="aseguradora"
              value={form.aseguradora}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.aseguradora}
              touched={touched.aseguradora}
              placeholder="Nombre de la aseguradora"
            />
            <FormField
              label="Número de Póliza / Carnet"
              icon={CreditCard}
              name="numero_poliza"
              value={form.numero_poliza}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.numero_poliza}
              touched={touched.numero_poliza}
              placeholder="Número de póliza o carnet"
            />
            <FormField
              label="Fecha de Vigencia de Póliza"
              icon={Calendar}
              name="fecha_vigencia_poliza"
              type="date"
              value={form.fecha_vigencia_poliza}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.fecha_vigencia_poliza}
              touched={touched.fecha_vigencia_poliza}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>

        {/* Información Médica */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span>Información Médica</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FormField
              label="Fecha de Nacimiento"
              icon={Calendar}
              name="fecha_nacimiento"
              type="date"
              value={form.fecha_nacimiento}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.fecha_nacimiento}
              touched={touched.fecha_nacimiento}
              max={new Date().toISOString().split('T')[0]}
            />
            <SelectField
              label="Género"
              icon={User}
              name="genero"
              value={form.genero}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.genero}
              touched={touched.genero}
            >
              <option value="">Seleccione</option>
              <option value="Masculino">Masculino</option>
              <option value="Femenino">Femenino</option>
            </SelectField>
            <FormField
              label="Grupo Sanguíneo"
              icon={Droplet}
              name="grupo_sanguineo"
              value={form.grupo_sanguineo}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.grupo_sanguineo}
              touched={touched.grupo_sanguineo}
              placeholder="Ej: O+, A-, B+"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <TextAreaField
              label="Alergias"
              name="alergias"
              value={form.alergias}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.alergias}
              touched={touched.alergias}
              rows={3}
              placeholder="Registre las alergias conocidas del paciente"
            />
            <TextAreaField
              label="Antecedentes Médicos"
              name="antecedentes_medicos"
              value={form.antecedentes_medicos}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.antecedentes_medicos}
              touched={touched.antecedentes_medicos}
              rows={3}
              placeholder="Enfermedades previas, cirugías, etc."
            />
          </div>
        </div>

        {/* Contacto de Emergencia */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center space-x-2">
            <Users className="w-5 h-5 text-orange-600" />
            <span>Contacto de Emergencia</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FormField
              label="Nombre Completo"
              icon={User}
              name="contacto_emergencia_nombre"
              value={form.contacto_emergencia_nombre}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.contacto_emergencia_nombre}
              touched={touched.contacto_emergencia_nombre}
              placeholder="Nombre del contacto"
            />
            <FormField
              label="Teléfono"
              icon={Phone}
              name="contacto_emergencia_telefono"
              value={form.contacto_emergencia_telefono}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.contacto_emergencia_telefono}
              touched={touched.contacto_emergencia_telefono}
              placeholder="+593 999 999 999"
            />
            <FormField
              label="Relación"
              icon={Users}
              name="contacto_emergencia_relacion"
              value={form.contacto_emergencia_relacion}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.contacto_emergencia_relacion}
              touched={touched.contacto_emergencia_relacion}
              placeholder="Ej: Padre, Madre, Hermano/a"
            />
          </div>
        </div>

        {/* Botones de acción */}
        {!isView && (
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/pacientes')}
              className="flex items-center space-x-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
            >
              <X className="w-5 h-5" />
              <span>Cancelar</span>
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={`flex items-center space-x-2 px-6 py-3 bg-gradient-to-r ${isEdit ? 'from-yellow-600 to-orange-700 hover:from-yellow-700 hover:to-orange-800' : 'from-green-600 to-green-700 hover:from-green-700 hover:to-green-800'} text-white rounded-lg font-medium transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <Save className="w-5 h-5" />
              <span>{isLoading ? (isEdit ? 'Actualizando...' : 'Guardando...') : (isEdit ? 'Actualizar Paciente' : 'Guardar Paciente')}</span>
            </button>
          </div>
        )}
      </form>
    </div>
  )
}

export default PacienteForm

