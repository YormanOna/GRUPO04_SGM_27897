import api from './api'

export const registrarEntrada = async (observaciones = null) => {
  const res = await api.post('/asistencias/entrada', null, {
    params: { observaciones }
  })
  return res.data
}

export const registrarSalida = async (observaciones = null) => {
  const res = await api.post('/asistencias/salida', { observaciones })
  return res.data
}

export const getAsistencias = async (empleadoId = null, fecha = null) => {
  const params = {}
  if (empleadoId) params.empleado_id = empleadoId
  if (fecha) params.fecha = fecha
  
  const res = await api.get('/asistencias', { params })
  return res.data
}

export const getAsistencia = async (id) => {
  const res = await api.get(`/asistencias/${id}`)
  return res.data
}
