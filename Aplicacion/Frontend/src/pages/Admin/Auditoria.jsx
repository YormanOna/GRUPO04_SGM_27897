import { useState, useEffect } from 'react';
import { Shield, Search, Filter, Download, Calendar, User, Activity, AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';

const Auditoria = () => {
  const [registros, setRegistros] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    fecha_desde: '',
    fecha_hasta: '',
    usuario_id: '',
    accion: '',
    modulo: '',
    estado: ''
  });
  const [paginacion, setPaginacion] = useState({
    skip: 0,
    limit: 20
  });
  const [totalRegistros, setTotalRegistros] = useState(0);

  const acciones = ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'VIEW', 'EXPORT'];
  const estados = ['exitoso', 'fallido', 'advertencia'];
  const modulos = ['Empleados', 'Pacientes', 'Citas', 'Consultas', 'Farmacia', 'Recetas', 'Autenticación'];

  useEffect(() => {
    cargarDatos();
  }, [paginacion]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Construir query params
      const params = new URLSearchParams({
        skip: paginacion.skip,
        limit: paginacion.limit,
        ...Object.fromEntries(Object.entries(filtros).filter(([_, v]) => v !== ''))
      });

      // Cargar registros
      const responseRegistros = await fetch(
        `http://localhost:8000/auditoria?${params}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      
      if (responseRegistros.ok) {
        const data = await responseRegistros.json();
        setRegistros(data);
      }

      // Cargar estadísticas
      const responseStats = await fetch(
        'http://localhost:8000/auditoria/estadisticas',
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      
      if (responseStats.ok) {
        const stats = await responseStats.json();
        setEstadisticas(stats);
      }

      // Cargar total de registros
      const responseCount = await fetch(
        `http://localhost:8000/auditoria/count?${params}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      
      if (responseCount.ok) {
        const countData = await responseCount.json();
        setTotalRegistros(countData.total);
      }

    } catch (error) {
      console.error('Error cargando auditoría:', error);
    } finally {
      setLoading(false);
    }
  };

  const aplicarFiltros = () => {
    setPaginacion({ skip: 0, limit: 20 });
    cargarDatos();
  };

  const limpiarFiltros = () => {
    setFiltros({
      fecha_desde: '',
      fecha_hasta: '',
      usuario_id: '',
      accion: '',
      modulo: '',
      estado: ''
    });
    setPaginacion({ skip: 0, limit: 20 });
  };

  const exportarCSV = () => {
    if (registros.length === 0) return;

    const headers = ['Fecha', 'Usuario', 'Cargo', 'Acción', 'Módulo', 'Descripción', 'Estado', 'IP'];
    const rows = registros.map(r => [
      new Date(r.fecha_hora).toLocaleString('es-ES'),
      r.usuario_nombre,
      r.usuario_cargo,
      r.accion,
      r.modulo,
      r.descripcion,
      r.estado,
      r.ip_address || 'N/A'
    ]);

    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `auditoria_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getEstadoIcon = (estado) => {
    switch (estado) {
      case 'exitoso':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'fallido':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'advertencia':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getAccionColor = (accion) => {
    const colores = {
      'CREATE': 'bg-green-100 text-green-800',
      'UPDATE': 'bg-blue-100 text-blue-800',
      'DELETE': 'bg-red-100 text-red-800',
      'LOGIN': 'bg-purple-100 text-purple-800',
      'LOGOUT': 'bg-gray-100 text-gray-800',
      'VIEW': 'bg-teal-100 text-teal-800',
      'EXPORT': 'bg-orange-100 text-orange-800'
    };
    return colores[accion] || 'bg-gray-100 text-gray-800';
  };

  const paginaSiguiente = () => {
    if (paginacion.skip + paginacion.limit < totalRegistros) {
      setPaginacion(prev => ({ ...prev, skip: prev.skip + prev.limit }));
    }
  };

  const paginaAnterior = () => {
    if (paginacion.skip > 0) {
      setPaginacion(prev => ({ ...prev, skip: Math.max(0, prev.skip - prev.limit) }));
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
            <Shield className="w-8 h-8 text-purple-600 dark:text-purple-300" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Auditoría del Sistema</h1>
            <p className="text-gray-600 dark:text-gray-400">Registro completo de todas las acciones del sistema</p>
          </div>
        </div>
        <button
          onClick={exportarCSV}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
        >
          <Download className="w-5 h-5" />
          Exportar CSV
        </button>
      </div>

      {/* Estadísticas */}
      {estadisticas && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-transparent dark:border-gray-700">
            <div className="flex items-center gap-3">
              <Activity className="w-10 h-10 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Registros</p>
                <p className="text-2xl font-bold text-gray-800">{estadisticas.total_registros}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center gap-3">
              <User className="w-10 h-10 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Usuarios Activos</p>
                <p className="text-2xl font-bold text-gray-800">{estadisticas.usuarios_activos?.length || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center gap-3">
              <Activity className="w-10 h-10 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Módulos Activos</p>
                <p className="text-2xl font-bold text-gray-800">{estadisticas.modulos_activos?.length || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-10 h-10 text-teal-600" />
              <div>
                <p className="text-sm text-gray-600">Acción Más Común</p>
                <p className="text-lg font-bold text-gray-800">
                  {estadisticas.acciones_comunes?.[0]?.accion || 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-800">Filtros</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
            <input
              type="date"
              value={filtros.fecha_desde}
              onChange={(e) => setFiltros({ ...filtros, fecha_desde: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
            <input
              type="date"
              value={filtros.fecha_hasta}
              onChange={(e) => setFiltros({ ...filtros, fecha_hasta: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Acción</label>
            <select
              value={filtros.accion}
              onChange={(e) => setFiltros({ ...filtros, accion: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Todas</option>
              {acciones.map(accion => (
                <option key={accion} value={accion}>{accion}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Módulo</label>
            <select
              value={filtros.modulo}
              onChange={(e) => setFiltros({ ...filtros, modulo: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Todos</option>
              {modulos.map(modulo => (
                <option key={modulo} value={modulo}>{modulo}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select
              value={filtros.estado}
              onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Todos</option>
              {estados.map(estado => (
                <option key={estado} value={estado}>{estado}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={aplicarFiltros}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              <Search className="w-5 h-5 mx-auto" />
            </button>
            <button
              onClick={limpiarFiltros}
              className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
            >
              Limpiar
            </button>
          </div>
        </div>
      </div>

      {/* Tabla de registros */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha/Hora
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acción
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Módulo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descripción
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  IP
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                    <p className="mt-2 text-gray-600">Cargando registros...</p>
                  </td>
                </tr>
              ) : registros.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                    No se encontraron registros de auditoría
                  </td>
                </tr>
              ) : (
                registros.map((registro) => (
                  <tr key={registro.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(registro.fecha_hora).toLocaleString('es-ES')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{registro.usuario_nombre}</div>
                      <div className="text-xs text-gray-500">{registro.usuario_cargo}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getAccionColor(registro.accion)}`}>
                        {registro.accion}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {registro.modulo}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 max-w-md truncate">
                      {registro.descripcion}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getEstadoIcon(registro.estado)}
                        <span className="text-sm text-gray-700 capitalize">{registro.estado}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {registro.ip_address || 'N/A'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {!loading && totalRegistros > 0 && (
          <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
            <div className="text-sm text-gray-700">
              Mostrando <span className="font-medium">{paginacion.skip + 1}</span> a{' '}
              <span className="font-medium">{Math.min(paginacion.skip + paginacion.limit, totalRegistros)}</span> de{' '}
              <span className="font-medium">{totalRegistros}</span> registros
            </div>
            <div className="flex gap-2">
              <button
                onClick={paginaAnterior}
                disabled={paginacion.skip === 0}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Anterior
              </button>
              <button
                onClick={paginaSiguiente}
                disabled={paginacion.skip + paginacion.limit >= totalRegistros}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Auditoria;
