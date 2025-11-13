import api from './api'

export const crearReceta = async (data) => {
  const res = await api.post('/recetas', data)
  return res.data
}

export const getRecetas = async (pacienteId = null, estado = null) => {
  const params = {}
  if (pacienteId) params.paciente_id = pacienteId
  if (estado) params.estado = estado
  
  const res = await api.get('/recetas', { params })
  return res.data
}

export const listarRecetas = async (params = {}) => {
  const res = await api.get('/recetas', { params })
  return res.data
}

export const getReceta = async (id) => {
  const res = await api.get(`/recetas/${id}`)
  return res.data
}

export const dispensarReceta = async (id, data) => {
  const res = await api.post(`/recetas/${id}/dispensar`, data)
  return res.data
}

export const cancelarReceta = async (id, observaciones = null) => {
  const res = await api.put(`/recetas/${id}/cancelar`, null, {
    params: { observaciones }
  })
  return res.data
}

export const descargarRecetaPDF = async (id) => {
  const res = await api.get(`/recetas/${id}/pdf`, {
    responseType: 'blob'
  })
  
  // Crear URL temporal para el blob
  const url = window.URL.createObjectURL(new Blob([res.data]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', `receta_${id}.pdf`)
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

export default {
  crearReceta,
  getRecetas,
  listarRecetas,
  getReceta,
  dispensarReceta,
  cancelarReceta,
  descargarRecetaPDF
}
