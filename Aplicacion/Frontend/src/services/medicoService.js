import api from './api'

export const getMedicos = async () => {
  const res = await api.get('/medicos/')
  return res.data
}
