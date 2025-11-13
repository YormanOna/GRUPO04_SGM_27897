import { useState, useEffect } from 'react';
import { AlertTriangle, AlertCircle, Package, Calendar, XCircle, RefreshCw, TrendingDown } from 'lucide-react';
import { notificacionService } from '../../services/notificacionService';
import { toast } from 'react-hot-toast';

export default function AlertasFarmacia() {
  const [alertas, setAlertas] = useState({
    stock_critico: [],
    stock_agotado: [],
    proximos_vencer: [],
    vencidos: []
  });
  const [loading, setLoading] = useState(true);
  const [filtroGravedad, setFiltroGravedad] = useState('todas');
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadAlertas();

    // Auto-refresh cada 30 segundos si está habilitado
    let interval;
    if (autoRefresh) {
      interval = setInterval(() => {
        loadAlertas(true);
      }, 30000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const loadAlertas = async (silencioso = false) => {
    try {
      if (!silencioso) setLoading(true);
      const data = await notificacionService.obtenerAlertasStock();
      setAlertas(data);
    } catch (error) {
      console.error('Error al cargar alertas:', error);
      if (!silencioso) toast.error('Error al cargar alertas');
    } finally {
      if (!silencioso) setLoading(false);
    }
  };

  const getGravedadColor = (gravedad) => {
    switch (gravedad) {
      case 'critica':
        return 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/20 dark:text-red-400 dark:border-red-700';
      case 'advertencia':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-700';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-700';
    }
  };

  const getGravedadIcon = (gravedad) => {
    switch (gravedad) {
      case 'critica':
        return <XCircle className="w-5 h-5" />;
      case 'advertencia':
        return <AlertTriangle className="w-5 h-5" />;
      default:
        return <AlertCircle className="w-5 h-5" />;
    }
  };

  const todasLasAlertas = [
    ...alertas.vencidos.map(a => ({ ...a, categoria: 'Medicamento Vencido' })),
    ...alertas.stock_agotado.map(a => ({ ...a, categoria: 'Stock Agotado' })),
    ...alertas.proximos_vencer.map(a => ({ ...a, categoria: 'Próximo a Vencer' })),
    ...alertas.stock_critico.map(a => ({ ...a, categoria: 'Stock Crítico' }))
  ];

  const alertasFiltradas = filtroGravedad === 'todas'
    ? todasLasAlertas
    : todasLasAlertas.filter(a => a.gravedad === filtroGravedad);

  const contadores = {
    total: todasLasAlertas.length,
    criticas: todasLasAlertas.filter(a => a.gravedad === 'critica').length,
    advertencias: todasLasAlertas.filter(a => a.gravedad === 'advertencia').length,
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <AlertTriangle className="w-8 h-8 text-yellow-600" />
            Centro de Alertas Farmacéuticas
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Monitoreo de stock, vencimientos y alertas críticas
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-4 py-2 rounded-lg border ${
              autoRefresh
                ? 'bg-green-50 border-green-300 text-green-700 dark:bg-green-900/20 dark:border-green-700 dark:text-green-400'
                : 'bg-gray-50 border-gray-300 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300'
            }`}
          >
            {autoRefresh ? '✓ Auto-refresh ON' : 'Auto-refresh OFF'}
          </button>
          <button
            onClick={() => loadAlertas()}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>
      </div>

      {/* Contadores */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm font-medium">Alertas Críticas</p>
              <p className="text-4xl font-bold mt-2">{contadores.criticas}</p>
            </div>
            <XCircle className="w-12 h-12 text-red-200" />
          </div>
          <p className="text-red-100 text-xs mt-3">Requieren acción inmediata</p>
        </div>

        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm font-medium">Advertencias</p>
              <p className="text-4xl font-bold mt-2">{contadores.advertencias}</p>
            </div>
            <AlertTriangle className="w-12 h-12 text-yellow-200" />
          </div>
          <p className="text-yellow-100 text-xs mt-3">Requieren atención</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Alertas</p>
              <p className="text-4xl font-bold mt-2">{contadores.total}</p>
            </div>
            <AlertCircle className="w-12 h-12 text-blue-200" />
          </div>
          <p className="text-blue-100 text-xs mt-3">Todas las notificaciones</p>
        </div>
      </div>

      {/* Resumen por Categoría */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border-l-4 border-red-500">
          <div className="flex items-center gap-2 mb-1">
            <XCircle className="w-5 h-5 text-red-600" />
            <h3 className="font-semibold text-gray-800 dark:text-white">Vencidos</h3>
          </div>
          <p className="text-3xl font-bold text-red-600">{alertas.vencidos.length}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Lotes vencidos con stock</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border-l-4 border-red-400">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="w-5 h-5 text-red-500" />
            <h3 className="font-semibold text-gray-800 dark:text-white">Agotados</h3>
          </div>
          <p className="text-3xl font-bold text-red-500">{alertas.stock_agotado.length}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Sin stock disponible</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border-l-4 border-yellow-500">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-5 h-5 text-yellow-600" />
            <h3 className="font-semibold text-gray-800 dark:text-white">Por Vencer</h3>
          </div>
          <p className="text-3xl font-bold text-yellow-600">{alertas.proximos_vencer.length}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Próximos 30 días</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border-l-4 border-orange-500">
          <div className="flex items-center gap-2 mb-1">
            <Package className="w-5 h-5 text-orange-600" />
            <h3 className="font-semibold text-gray-800 dark:text-white">Stock Bajo</h3>
          </div>
          <p className="text-3xl font-bold text-orange-600">{alertas.stock_critico.length}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Menos de 10 unidades</p>
        </div>
      </div>

      {/* Filtro */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Filtrar por Gravedad
        </label>
        <select
          value={filtroGravedad}
          onChange={(e) => setFiltroGravedad(e.target.value)}
          className="w-full md:w-64 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
        >
          <option value="todas">Todas las alertas</option>
          <option value="critica">Solo críticas</option>
          <option value="advertencia">Solo advertencias</option>
        </select>
      </div>

      {/* Lista de Alertas */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : alertasFiltradas.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">
            {filtroGravedad === 'todas' 
              ? '¡Excelente! No hay alertas pendientes' 
              : `No hay alertas de tipo "${filtroGravedad}"`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {alertasFiltradas.map((alerta, index) => (
            <div
              key={`${alerta.tipo}-${alerta.id}-${index}`}
              className={`rounded-lg border-2 p-4 ${getGravedadColor(alerta.gravedad)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="mt-0.5">
                    {getGravedadIcon(alerta.gravedad)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold uppercase tracking-wide">
                        {alerta.categoria}
                      </span>
                      {alerta.dias_restantes !== undefined && (
                        <span className="text-xs font-medium">
                          {alerta.dias_restantes} días restantes
                        </span>
                      )}
                    </div>
                    <p className="font-medium text-sm mb-1">{alerta.mensaje}</p>
                    <div className="flex flex-wrap gap-3 text-xs mt-2">
                      {alerta.medicamento_nombre && (
                        <span className="flex items-center gap-1">
                          <Package className="w-3 h-3" />
                          {alerta.medicamento_nombre}
                        </span>
                      )}
                      {alerta.numero_lote && (
                        <span className="flex items-center gap-1">
                          📦 Lote {alerta.numero_lote}
                        </span>
                      )}
                      {alerta.ubicacion && (
                        <span className="flex items-center gap-1">
                          📍 {alerta.ubicacion}
                        </span>
                      )}
                      {alerta.cantidad_disponible !== undefined && (
                        <span className="flex items-center gap-1">
                          📊 Stock: {alerta.cantidad_disponible}
                        </span>
                      )}
                      {alerta.fecha_vencimiento && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(alerta.fecha_vencimiento).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
