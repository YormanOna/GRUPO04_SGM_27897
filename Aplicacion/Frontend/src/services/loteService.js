import axios from 'axios';

const API_URL = 'http://localhost:8000';

// Obtener token del localStorage
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };
};

export const loteService = {
  // Crear un nuevo lote
  crearLote: async (loteData) => {
    const response = await axios.post(`${API_URL}/lotes/`, loteData, getAuthHeaders());
    return response.data;
  },

  // Listar lotes con filtros
  listarLotes: async (medicamentoId = null, estado = null, skip = 0, limit = 100) => {
    const params = new URLSearchParams();
    if (medicamentoId) params.append('medicamento_id', medicamentoId);
    if (estado) params.append('estado', estado);
    params.append('skip', skip);
    params.append('limit', limit);

    const response = await axios.get(`${API_URL}/lotes/?${params.toString()}`, getAuthHeaders());
    return response.data;
  },

  // Obtener lotes disponibles de un medicamento (FEFO)
  listarLotesDisponibles: async (medicamentoId) => {
    const response = await axios.get(
      `${API_URL}/lotes/medicamento/${medicamentoId}/disponibles`,
      getAuthHeaders()
    );
    return response.data;
  },

  // Obtener lotes próximos a vencer
  obtenerLotesProximosVencer: async (dias = 30) => {
    const response = await axios.get(
      `${API_URL}/lotes/proximos-vencer?dias=${dias}`,
      getAuthHeaders()
    );
    return response.data;
  },

  // Obtener lotes vencidos
  obtenerLotesVencidos: async () => {
    const response = await axios.get(`${API_URL}/lotes/vencidos`, getAuthHeaders());
    return response.data;
  },

  // Obtener un lote por ID
  obtenerLote: async (loteId) => {
    const response = await axios.get(`${API_URL}/lotes/${loteId}`, getAuthHeaders());
    return response.data;
  },

  // Actualizar un lote
  actualizarLote: async (loteId, loteData) => {
    const response = await axios.put(`${API_URL}/lotes/${loteId}`, loteData, getAuthHeaders());
    return response.data;
  },

  // Eliminar un lote
  eliminarLote: async (loteId) => {
    const response = await axios.delete(`${API_URL}/lotes/${loteId}`, getAuthHeaders());
    return response.data;
  },

  // Actualizar estados de todos los lotes
  actualizarEstadosLotes: async () => {
    const response = await axios.post(`${API_URL}/lotes/actualizar-estados`, {}, getAuthHeaders());
    return response.data;
  },
};
