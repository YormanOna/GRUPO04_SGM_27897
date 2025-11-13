/**
 * Utilidades para el manejo de citas médicas
 */

// Mapeo de estados de citas (backend -> frontend)
export const ESTADOS_CITA = {
  programada: 'Programada',
  confirmada: 'Confirmada',
  en_consulta: 'En Consulta',
  completada: 'Completada',
  cancelada: 'Cancelada',
  no_asistio: 'No Asistió'
}

// Mapeo inverso (frontend -> backend) - para compatibilidad con código legacy
export const ESTADOS_CITA_BACKEND = {
  'Programada': 'programada',
  'Pendiente': 'programada', // Alias para compatibilidad
  'Confirmada': 'confirmada',
  'En Consulta': 'en_consulta',
  'Completada': 'completada',
  'Cancelada': 'cancelada',
  'No Asistió': 'no_asistio',
  'No asistió': 'no_asistio'
}

// Mapeo de tipos de cita (backend -> frontend)
export const TIPOS_CITA = {
  consulta: 'Consulta',
  seguimiento: 'Seguimiento',
  emergencia: 'Emergencia'
}

// Mapeo inverso tipos de cita
export const TIPOS_CITA_BACKEND = {
  'Consulta': 'consulta',
  'Seguimiento': 'seguimiento',
  'Emergencia': 'emergencia',
  'Consulta General': 'consulta' // Alias para compatibilidad
}

/**
 * Traduce el estado de cita del backend al frontend
 * @param {string} estadoBackend - Estado en formato backend (programada, confirmada, etc.)
 * @returns {string} Estado en formato legible (Programada, Confirmada, etc.)
 */
export const traducirEstado = (estadoBackend) => {
  if (!estadoBackend) return 'Sin Estado'
  return ESTADOS_CITA[estadoBackend.toLowerCase()] || estadoBackend
}

/**
 * Traduce el estado de cita del frontend al backend
 * @param {string} estadoFrontend - Estado en formato frontend (Programada, Confirmada, etc.)
 * @returns {string} Estado en formato backend (programada, confirmada, etc.)
 */
export const traducirEstadoBackend = (estadoFrontend) => {
  if (!estadoFrontend) return 'programada'
  return ESTADOS_CITA_BACKEND[estadoFrontend] || estadoFrontend.toLowerCase()
}

/**
 * Traduce el tipo de cita del backend al frontend
 * @param {string} tipoBackend - Tipo en formato backend (consulta, seguimiento, etc.)
 * @returns {string} Tipo en formato legible (Consulta, Seguimiento, etc.)
 */
export const traducirTipoCita = (tipoBackend) => {
  if (!tipoBackend) return 'Consulta'
  return TIPOS_CITA[tipoBackend.toLowerCase()] || tipoBackend
}

/**
 * Traduce el tipo de cita del frontend al backend
 * @param {string} tipoFrontend - Tipo en formato frontend (Consulta, Seguimiento, etc.)
 * @returns {string} Tipo en formato backend (consulta, seguimiento, etc.)
 */
export const traducirTipoCitaBackend = (tipoFrontend) => {
  if (!tipoFrontend) return 'consulta'
  return TIPOS_CITA_BACKEND[tipoFrontend] || tipoFrontend.toLowerCase()
}

/**
 * Obtiene la clase CSS según el estado de la cita
 * @param {string} estado - Estado de la cita
 * @returns {string} Clases CSS para el badge
 */
export const getEstadoClasses = (estado) => {
  const estadoLower = (estado || '').toLowerCase()
  
  const clases = {
    'programada': 'bg-blue-100 text-blue-700',
    'pendiente': 'bg-yellow-100 text-yellow-700', // Alias
    'confirmada': 'bg-green-100 text-green-700',
    'en_consulta': 'bg-purple-100 text-purple-700',
    'completada': 'bg-gray-100 text-gray-700',
    'cancelada': 'bg-red-100 text-red-700',
    'no_asistio': 'bg-orange-100 text-orange-700'
  }
  
  return clases[estadoLower] || 'bg-gray-100 text-gray-700'
}

/**
 * Obtiene el color de fondo según el estado (para calendarios)
 * @param {string} estado - Estado de la cita
 * @returns {string} Color hexadecimal
 */
export const getEstadoColor = (estado) => {
  const estadoLower = (estado || '').toLowerCase()
  
  const colores = {
    'programada': '#3B82F6',     // blue-500
    'pendiente': '#EAB308',      // yellow-500 (alias)
    'confirmada': '#10B981',     // green-500
    'en_consulta': '#8B5CF6',    // purple-500
    'completada': '#6B7280',     // gray-500
    'cancelada': '#EF4444',      // red-500
    'no_asistio': '#F97316'      // orange-500
  }
  
  return colores[estadoLower] || '#6B7280'
}

/**
 * Verifica si una cita está en un estado activo (no completada ni cancelada)
 * @param {string} estado - Estado de la cita
 * @returns {boolean} True si está activa
 */
export const isCitaActiva = (estado) => {
  const estadoLower = (estado || '').toLowerCase()
  return ['programada', 'pendiente', 'confirmada', 'en_consulta'].includes(estadoLower)
}

/**
 * Verifica si una cita puede ser editada
 * @param {string} estado - Estado de la cita
 * @returns {boolean} True si puede editarse
 */
export const canEditarCita = (estado) => {
  const estadoLower = (estado || '').toLowerCase()
  return ['programada', 'pendiente', 'confirmada'].includes(estadoLower)
}

/**
 * Verifica si una cita puede ser cancelada
 * @param {string} estado - Estado de la cita
 * @returns {boolean} True si puede cancelarse
 */
export const canCancelarCita = (estado) => {
  const estadoLower = (estado || '').toLowerCase()
  return ['programada', 'pendiente', 'confirmada'].includes(estadoLower)
}
