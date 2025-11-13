import axios from 'axios';

const API_URL = 'http://localhost:8000';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };
};

export const notificacionService = {
  // Obtener todas las alertas de stock
  obtenerAlertasStock: async () => {
    const response = await axios.get(
      `${API_URL}/notificaciones/stock/alertas`,
      getAuthHeaders()
    );
    return response.data;
  },

  // Obtener resumen de alertas (para badges)
  obtenerResumenAlertas: async () => {
    const response = await axios.get(
      `${API_URL}/notificaciones/stock/resumen`,
      getAuthHeaders()
    );
    return response.data;
  },

  // Verificar disponibilidad de medicamento antes de prescribir
  verificarDisponibilidad: async (medicamentoId, cantidad) => {
    const response = await axios.post(
      `${API_URL}/notificaciones/stock/verificar-disponibilidad`,
      { medicamento_id: medicamentoId, cantidad },
      getAuthHeaders()
    );
    return response.data;
  },
};

export const validacionService = {
  // Validar una prescripción completa
  validarPrescripcion: async (pacienteId, medicamentos) => {
    const response = await axios.post(
      `${API_URL}/recetas/validar-prescripcion`,
      { paciente_id: pacienteId, medicamentos },
      getAuthHeaders()
    );
    return response.data;
  },
};
