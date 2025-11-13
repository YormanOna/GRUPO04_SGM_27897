import api from './api'

export const getPacientes = async () => {
  const res = await api.get('/pacientes')
  return res.data
}

export const getPaciente = async (id) => {
  const res = await api.get(`/pacientes/${id}`)
  return res.data
}

export const createPaciente = async (data) => {
  const res = await api.post('/pacientes', data)
  return res.data
}

export const updatePaciente = async (id, data) => {
  const res = await api.put(`/pacientes/${id}`, data)
  return res.data
}

export const deletePaciente = async (id) => {
  const res = await api.delete(`/pacientes/${id}`)
  return res.data
}

/**
 * Búsqueda de pacientes por cédula o nombre en tiempo real (RF-001)
 * @param {string} query - Término de búsqueda
 * @returns {Promise<Array>} - Lista de pacientes coincidentes
 */
export const buscarPacientes = async (query) => {
  if (!query || query.length < 2) return []
  const res = await api.get(`/pacientes/buscar/search?q=${encodeURIComponent(query)}`)
  return res.data
}

/**
 * Valida el estado de la póliza de un paciente (RF-001)
 * @param {number} id - ID del paciente
 * @returns {Promise<Object>} - Estado de la póliza
 */
export const validarPoliza = async (id) => {
  const res = await api.get(`/pacientes/${id}/validar-poliza`)
  return res.data
}
