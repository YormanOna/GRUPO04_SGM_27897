import api from './api'

export const getMedicamentos = async () => {
  const res = await api.get('/medicamentos/')
  return res.data
}
