import api from './api'

/**
 * Servicio para gestión de expedientes clínicos (RF-002)
 */
const expedienteService = {
  /**
   * Buscar expediente por número de HC o cédula
   * @param {string} query - Número de historia clínica o cédula
   * @returns {Promise}
   */
  buscarExpediente: async (query) => {
    const response = await api.get(`/historias/expediente/buscar?query=${query}`)
    return response.data
  },

  /**
   * Obtener expediente completo por ID de paciente
   * @param {number} pacienteId 
   * @returns {Promise}
   */
  obtenerPorPaciente: async (pacienteId) => {
    const response = await api.get(`/historias/expediente/paciente/${pacienteId}`)
    return response.data
  }
}

export default expedienteService
