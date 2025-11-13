import { useState, useEffect } from 'react';
import { ShieldCheck, AlertTriangle, AlertCircle, CheckCircle, XCircle, Package, User } from 'lucide-react';
import { validacionService } from '../../services/notificacionService';
import { recetaService } from '../../services/recetaService';
import { loteService } from '../../services/loteService';
import { toast } from 'react-hot-toast';

export default function ValidacionFarmaceutica({ receta, onValidacionCompleta, onCancelar }) {
  const [validando, setValidando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [lotesSeleccionados, setLotesSeleccionados] = useState({});
  const [lotesDisponibles, setLotesDisponibles] = useState({});
  const [dispensando, setDispensando] = useState(false);

  useEffect(() => {
    if (receta) {
      realizarValidacion();
      cargarLotesDisponibles();
    }
  }, [receta]);

  const realizarValidacion = async () => {
    setValidando(true);
    try {
      // Preparar medicamentos para validación
      const medicamentos = receta.medicamentos || [];
      const medicamentosValidar = medicamentos.map(med => ({
        medicamento_id: med.medicamento_id,
        cantidad: med.cantidad,
        dosis: med.dosis
      }));

      const res = await validacionService.validarPrescripcion(
        receta.paciente_id,
        medicamentosValidar
      );

      setResultado(res);
    } catch (error) {
      console.error('Error en validación:', error);
      toast.error('Error al validar prescripción');
    } finally {
      setValidando(false);
    }
  };

  const cargarLotesDisponibles = async () => {
    try {
      const medicamentos = receta.medicamentos || [];
      const lotes = {};

      for (const med of medicamentos) {
        const lotesDisp = await loteService.listarLotesDisponibles(med.medicamento_id);
        lotes[med.medicamento_id] = lotesDisp;
        
        // Seleccionar automáticamente el primer lote (FEFO)
        if (lotesDisp.length > 0) {
          setLotesSeleccionados(prev => ({
            ...prev,
            [med.medicamento_id]: lotesDisp[0].id
          }));
        }
      }

      setLotesDisponibles(lotes);
    } catch (error) {
      console.error('Error al cargar lotes:', error);
    }
  };

  const handleDispensar = async () => {
    if (!resultado?.puede_dispensar) {
      toast.error('No se puede dispensar debido a alertas críticas');
      return;
    }

    // Verificar que todos los medicamentos tengan lote seleccionado
    const medicamentos = receta.medicamentos || [];
    for (const med of medicamentos) {
      if (!lotesSeleccionados[med.medicamento_id]) {
        toast.error(`Seleccione un lote para ${med.medicamento_nombre}`);
        return;
      }
    }

    setDispensando(true);
    try {
      // Dispensar cada medicamento con su lote
      for (const med of medicamentos) {
        await recetaService.dispensarReceta(receta.id, {
          lote_id: lotesSeleccionados[med.medicamento_id],
          observaciones: 'Validación farmacéutica aprobada'
        });
      }

      toast.success('Receta dispensada correctamente');
      if (onValidacionCompleta) {
        onValidacionCompleta();
      }
    } catch (error) {
      console.error('Error al dispensar:', error);
      toast.error(error.response?.data?.detail || 'Error al dispensar receta');
    } finally {
      setDispensando(false);
    }
  };

  if (!receta) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">No hay receta para validar</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-blue-600" />
            Validación Farmacéutica
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Receta #{receta.id} - {receta.paciente_nombre}
          </p>
        </div>
      </div>

      {/* Estado de Validación */}
      {validando ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Validando prescripción...</p>
        </div>
      ) : resultado ? (
        <>
          {/* Resultado General */}
          <div className={`rounded-lg p-6 ${
            resultado.puede_dispensar 
              ? 'bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800' 
              : 'bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800'
          }`}>
            <div className="flex items-center gap-3">
              {resultado.puede_dispensar ? (
                <CheckCircle className="w-8 h-8 text-green-600" />
              ) : (
                <XCircle className="w-8 h-8 text-red-600" />
              )}
              <div>
                <h3 className={`text-lg font-semibold ${
                  resultado.puede_dispensar ? 'text-green-800 dark:text-green-400' : 'text-red-800 dark:text-red-400'
                }`}>
                  {resultado.puede_dispensar 
                    ? '✅ Validación APROBADA - Puede dispensar' 
                    : '❌ Validación RECHAZADA - NO puede dispensar'}
                </h3>
                <p className={`text-sm mt-1 ${
                  resultado.puede_dispensar ? 'text-green-700 dark:text-green-500' : 'text-red-700 dark:text-red-500'
                }`}>
                  {resultado.puede_dispensar 
                    ? 'La prescripción ha pasado todas las validaciones críticas' 
                    : 'Existen alertas críticas que impiden la dispensación'}
                </p>
              </div>
            </div>
          </div>

          {/* Alertas Críticas */}
          {resultado.criticas && resultado.criticas.length > 0 && (
            <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-6 h-6 text-red-600" />
                <h4 className="text-lg font-semibold text-red-800 dark:text-red-400">
                  Alertas Críticas ({resultado.criticas.length})
                </h4>
              </div>
              <ul className="space-y-2">
                {resultado.criticas.map((alerta, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-red-700 dark:text-red-400">
                    <XCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <span className="text-sm font-medium">{alerta}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Advertencias */}
          {resultado.advertencias && resultado.advertencias.length > 0 && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-300 dark:border-yellow-700 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
                <h4 className="text-lg font-semibold text-yellow-800 dark:text-yellow-400">
                  Advertencias ({resultado.advertencias.length})
                </h4>
              </div>
              <ul className="space-y-2">
                {resultado.advertencias.map((alerta, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-yellow-700 dark:text-yellow-400">
                    <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{alerta}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Información */}
          {resultado.info && resultado.info.length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-300 dark:border-blue-700 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-6 h-6 text-blue-600" />
                <h4 className="text-lg font-semibold text-blue-800 dark:text-blue-400">
                  Información Adicional ({resultado.info.length})
                </h4>
              </div>
              <ul className="space-y-2">
                {resultado.info.map((alerta, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-blue-700 dark:text-blue-400">
                    <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{alerta}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Selección de Lotes */}
          {resultado.puede_dispensar && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-600" />
                Selección de Lotes para Dispensación (FEFO)
              </h4>
              <div className="space-y-4">
                {receta.medicamentos?.map((med) => (
                  <div key={med.medicamento_id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h5 className="font-medium text-gray-800 dark:text-white">
                          {med.medicamento_nombre}
                        </h5>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Cantidad a dispensar: {med.cantidad} unidades
                        </p>
                      </div>
                    </div>

                    {lotesDisponibles[med.medicamento_id]?.length > 0 ? (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Seleccionar Lote (ordenado por FEFO - primero en vencer, primero en salir)
                        </label>
                        <select
                          value={lotesSeleccionados[med.medicamento_id] || ''}
                          onChange={(e) => setLotesSeleccionados(prev => ({
                            ...prev,
                            [med.medicamento_id]: parseInt(e.target.value)
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        >
                          {lotesDisponibles[med.medicamento_id].map((lote) => {
                            const diasRestantes = Math.ceil(
                              (new Date(lote.fecha_vencimiento) - new Date()) / (1000 * 60 * 60 * 24)
                            );
                            return (
                              <option key={lote.id} value={lote.id}>
                                Lote {lote.numero_lote} - Stock: {lote.cantidad_disponible} - 
                                Vence: {new Date(lote.fecha_vencimiento).toLocaleDateString()} 
                                ({diasRestantes} días) - {lote.ubicacion_fisica || 'Sin ubicación'}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    ) : (
                      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-3">
                        <p className="text-sm text-red-700 dark:text-red-400 flex items-center gap-2">
                          <XCircle className="w-4 h-4" />
                          No hay lotes disponibles para este medicamento
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Acciones */}
          <div className="flex gap-3 justify-end pt-4">
            <button
              onClick={onCancelar}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancelar
            </button>
            {resultado.puede_dispensar && (
              <button
                onClick={handleDispensar}
                disabled={dispensando}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {dispensando ? (
                  <>
                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Dispensando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Dispensar Receta
                  </>
                )}
              </button>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
