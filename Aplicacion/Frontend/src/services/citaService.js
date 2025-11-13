import api from './api'

export const listar = async (filtros = {}) => {
  const params = new URLSearchParams();
  if (filtros.fecha) params.append('fecha', filtros.fecha);
  if (filtros.estado) params.append('estado', filtros.estado);
  if (filtros.paciente_id) params.append('paciente_id', filtros.paciente_id);
  if (filtros.medico_id) params.append('medico_id', filtros.medico_id);
  
  const res = await api.get(`/citas/?${params.toString()}`);
  return res;
}

export const getCitas = async () => {
  const res = await api.get('/citas/')
  return res.data
}

export const getCita = async (id) => {
  const res = await api.get(`/citas/${id}`)
  return res.data
}

export const createCita = async (data) => {
  const res = await api.post('/citas/', data)
  return res.data
}

export const actualizar = async (id, data) => {
  const res = await api.put(`/citas/${id}`, data)
  return res.data
}

export const updateCita = async (id, data) => {
  const res = await api.put(`/citas/${id}`, data)
  return res.data
}

export const deleteCita = async (id) => {
  const res = await api.delete(`/citas/${id}`)
  return res.data
}

/**
 * Obtiene citas filtradas por fecha (RF-001)
 * @param {string} fecha - Fecha en formato YYYY-MM-DD
 * @param {number} medicoId - ID del médico (opcional)
 * @returns {Promise<Array>} - Lista de citas
 */
export const getCitasPorFecha = async (fecha, medicoId = null) => {
  let url = `/citas/fecha/${fecha}`
  if (medicoId) url += `?medico_id=${medicoId}`
  const res = await api.get(url)
  return res.data
}

/**
 * Obtiene disponibilidad de médicos por especialidad (RF-001)
 * @param {string} fecha - Fecha en formato YYYY-MM-DD (opcional)
 * @param {string} especialidad - Especialidad médica (opcional)
 * @returns {Promise<Array>} - Lista de médicos con disponibilidad
 */
export const getDisponibilidadMedicos = async (fecha = null, especialidad = null) => {
  const params = new URLSearchParams()
  if (fecha) params.append('fecha', fecha)
  if (especialidad) params.append('especialidad', especialidad)
  
  const res = await api.get(`/citas/disponibilidad/medicos?${params.toString()}`)
  return res.data
}

/**
 * Descarga comprobante de cita en PDF con código QR (RF-001)
 * @param {number} id - ID de la cita
 * @returns {Promise<Blob>} - Archivo PDF
 */
export const descargarComprobantePDF = async (id) => {
  const res = await api.get(`/citas/${id}/comprobante/pdf`, {
    responseType: 'blob'
  })
  
  // Crear un enlace de descarga
  const url = window.URL.createObjectURL(new Blob([res.data]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', `comprobante_cita_${id}.pdf`)
  document.body.appendChild(link)
  link.click()
  link.remove()
  
  return res.data
}

/**
 * Cancela una cita con motivo obligatorio (RF-001)
 * @param {number} id - ID de la cita
 * @param {string} motivo - Motivo de cancelación (mínimo 10 caracteres)
 * @returns {Promise<Object>} - Cita actualizada
 */
export const cancelarCita = async (id, motivo) => {
  const res = await api.post(`/citas/${id}/cancelar`, { motivo })
  return res.data
}

/**
 * Reprograma una cita a nueva fecha/hora (RF-001)
 * @param {number} id - ID de la cita
 * @param {Object} data - Datos de reprogramación
 * @returns {Promise<Object>} - Cita actualizada
 */
export const reprogramarCita = async (id, data) => {
  const res = await api.post(`/citas/${id}/reprogramar`, data)
  return res.data
}

/**
 * Valida una cita del día actual y notifica a enfermería (RF-001)
 * @param {number} id - ID de la cita
 * @returns {Promise<Object>} - Cita validada
 */
export const validarCita = async (id) => {
  const res = await api.post(`/citas/${id}/validar`)
  return res.data
}

/**
 * Obtiene la lista completa de médicos
 * @returns {Promise<Array>} - Lista de médicos
 */
export const getMedicos = async () => {
  const res = await api.get('/medicos/')
  return res.data
}

export default {
  listar,
  getCitas,
  getCita,
  createCita,
  crear: createCita, // Alias para compatibilidad
  actualizar,
  updateCita,
  deleteCita,
  getCitasPorFecha,
  getDisponibilidadMedicos,
  descargarComprobantePDF,
  cancelarCita,
  reprogramarCita,
  validarCita,
  getMedicos
}
