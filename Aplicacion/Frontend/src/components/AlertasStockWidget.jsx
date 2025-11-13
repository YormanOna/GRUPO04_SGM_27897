import { useState, useEffect } from 'react';
import { AlertTriangle, Package, Calendar, XCircle, ChevronRight } from 'lucide-react';
import { notificacionService } from '../services/notificacionService';
import { useNavigate } from 'react-router-dom';

export default function AlertasStockWidget() {
  const [resumen, setResumen] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadResumen();

    // Auto-refresh cada 60 segundos
    const interval = setInterval(() => {
      loadResumen();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const loadResumen = async () => {
    try {
      const data = await notificacionService.obtenerResumenAlertas();
      setResumen(data);
    } catch (error) {
      console.error('Error al cargar resumen de alertas:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!resumen) return null;

  const totalAlertas = 
    (resumen.stock_critico || 0) + 
    (resumen.stock_agotado || 0) + 
    (resumen.proximos_vencer || 0) + 
    (resumen.vencidos || 0);

  const alertasCriticas = (resumen.stock_agotado || 0) + (resumen.vencidos || 0);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className={`w-5 h-5 ${
              alertasCriticas > 0 ? 'text-red-600' : 'text-yellow-600'
            }`} />
            <h3 className="font-semibold text-gray-800 dark:text-white">
              Alertas de Farmacia
            </h3>
          </div>
          {totalAlertas > 0 && (
            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
              alertasCriticas > 0 
                ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
            }`}>
              {totalAlertas}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {totalAlertas === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
              <Package className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              ✅ Sin alertas pendientes
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              Todo el inventario está en orden
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Vencidos */}
            {resumen.vencidos > 0 && (
              <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <div className="flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-red-600" />
                  <div>
                    <p className="text-sm font-medium text-red-800 dark:text-red-400">
                      Medicamentos Vencidos
                    </p>
                    <p className="text-xs text-red-600 dark:text-red-500">
                      Requiere acción inmediata
                    </p>
                  </div>
                </div>
                <span className="text-lg font-bold text-red-700 dark:text-red-400">
                  {resumen.vencidos}
                </span>
              </div>
            )}

            {/* Stock Agotado */}
            {resumen.stock_agotado > 0 && (
              <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-red-600" />
                  <div>
                    <p className="text-sm font-medium text-red-800 dark:text-red-400">
                      Stock Agotado
                    </p>
                    <p className="text-xs text-red-600 dark:text-red-500">
                      No disponibles para prescripción
                    </p>
                  </div>
                </div>
                <span className="text-lg font-bold text-red-700 dark:text-red-400">
                  {resumen.stock_agotado}
                </span>
              </div>
            )}

            {/* Próximos a Vencer */}
            {resumen.proximos_vencer > 0 && (
              <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-yellow-600" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-400">
                      Próximos a Vencer
                    </p>
                    <p className="text-xs text-yellow-600 dark:text-yellow-500">
                      En los próximos 30 días
                    </p>
                  </div>
                </div>
                <span className="text-lg font-bold text-yellow-700 dark:text-yellow-400">
                  {resumen.proximos_vencer}
                </span>
              </div>
            )}

            {/* Stock Crítico */}
            {resumen.stock_critico > 0 && (
              <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                  <div>
                    <p className="text-sm font-medium text-orange-800 dark:text-orange-400">
                      Stock Crítico
                    </p>
                    <p className="text-xs text-orange-600 dark:text-orange-500">
                      Menos de 10 unidades
                    </p>
                  </div>
                </div>
                <span className="text-lg font-bold text-orange-700 dark:text-orange-400">
                  {resumen.stock_critico}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      {totalAlertas > 0 && (
        <div className="p-3 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => navigate('/alertas-farmacia')}
            className="w-full flex items-center justify-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
          >
            Ver todas las alertas
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
