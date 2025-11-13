const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const diagnosticoService = {
  /**
   * Busca diagnósticos CIE-10 por código o descripción
   * @param {string} query - Término de búsqueda
   * @param {number} limit - Cantidad máxima de resultados
   * @returns {Promise<Array>}
   */
  async buscar(query, limit = 20) {
    const token = localStorage.getItem('token');
    
    const response = await fetch(
      `${API_URL}/diagnosticos/buscar?query=${encodeURIComponent(query)}&limit=${limit}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error('Error al buscar diagnósticos CIE-10');
    }

    return await response.json();
  },

  /**
   * Obtiene un diagnóstico específico por su código
   * @param {string} codigo - Código CIE-10
   * @returns {Promise<Object>}
   */
  async obtenerPorCodigo(codigo) {
    const token = localStorage.getItem('token');
    
    const response = await fetch(
      `${API_URL}/diagnosticos/${codigo}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error('Diagnóstico CIE-10 no encontrado');
    }

    return await response.json();
  }
};
