import api from './api';

const consultaService = {
  // Crear nueva consulta con signos vitales
  crear: async (data) => {
    return await api.post('/consultas/', data);
  },

  // Listar consultas con filtros opcionales
  listar: async (filtros = {}) => {
    const params = new URLSearchParams();
    if (filtros.paciente_id) params.append('paciente_id', filtros.paciente_id);
    if (filtros.medico_id) params.append('medico_id', filtros.medico_id);
    if (filtros.fecha_desde) params.append('fecha_desde', filtros.fecha_desde);
    if (filtros.fecha_hasta) params.append('fecha_hasta', filtros.fecha_hasta);
    
    return await api.get(`/consultas/?${params.toString()}`);
  },

  // Obtener consulta por ID
  obtenerPorId: async (id) => {
    return await api.get(`/consultas/${id}`);
  },

  // Actualizar consulta (completar con diagnóstico y tratamiento)
  actualizar: async (id, data) => {
    return await api.put(`/consultas/${id}`, data);
  },

  // Obtener consultas pendientes para un médico
  obtenerPendientes: async (medico_id) => {
    return await api.get(`/consultas/?medico_id=${medico_id}&estado=pendiente`);
  },

  // Completar consulta
  completar: async (id, data) => {
    return await api.post(`/consultas/${id}/completar`, data);
  },

  // RF-003: Generar comprobante de asistencia
  generarComprobante: async (consultaId, enviarEmail = false) => {
    const response = await api.post(
      `/consultas/${consultaId}/comprobante?enviar_email_paciente=${enviarEmail}`,
      {},
      {
        responseType: 'blob' // Para recibir el PDF como blob
      }
    );
    return response;
  }
};

export default consultaService;
