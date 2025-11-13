import { useState, useEffect } from 'react';
import { Package, Plus, Calendar, AlertCircle, MapPin, DollarSign, Trash2, Edit, CheckCircle, XCircle } from 'lucide-react';
import { loteService } from '../../services/loteService';
import { medicamentoService } from '../../services/medicamentoService';
import Modal from '../../components/Modal';
import { toast } from 'react-hot-toast';
import Swal from 'sweetalert2';

export default function LoteList() {
  const [lotes, setLotes] = useState([]);
  const [medicamentos, setMedicamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedMedicamento, setSelectedMedicamento] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [formData, setFormData] = useState({
    medicamento_id: '',
    numero_lote: '',
    fecha_ingreso: new Date().toISOString().split('T')[0],
    fecha_vencimiento: '',
    cantidad_inicial: '',
    cantidad_disponible: '',
    ubicacion_fisica: '',
    proveedor: '',
    numero_factura: '',
    costo_unitario: '',
    observaciones: '',
  });

  useEffect(() => {
    loadLotes();
    loadMedicamentos();
  }, [filtroEstado, selectedMedicamento]);

  const loadLotes = async () => {
    try {
      setLoading(true);
      const data = await loteService.listarLotes(
        selectedMedicamento,
        filtroEstado || null
      );
      setLotes(data);
    } catch (error) {
      console.error('Error al cargar lotes:', error);
      toast.error('Error al cargar lotes');
    } finally {
      setLoading(false);
    }
  };

  const loadMedicamentos = async () => {
    try {
      const data = await medicamentoService.getMedicamentos();
      setMedicamentos(data);
    } catch (error) {
      console.error('Error al cargar medicamentos:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Si cambia cantidad_inicial, actualizar cantidad_disponible
    if (name === 'cantidad_inicial') {
      setFormData((prev) => ({
        ...prev,
        cantidad_disponible: value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Validaciones
      if (!formData.medicamento_id || !formData.numero_lote || !formData.fecha_vencimiento) {
        toast.error('Complete los campos requeridos');
        return;
      }

      if (parseInt(formData.cantidad_inicial) <= 0) {
        toast.error('La cantidad debe ser mayor a 0');
        return;
      }

      // Crear lote
      await loteService.crearLote({
        ...formData,
        medicamento_id: parseInt(formData.medicamento_id),
        cantidad_inicial: parseInt(formData.cantidad_inicial),
        cantidad_disponible: parseInt(formData.cantidad_disponible),
        costo_unitario: formData.costo_unitario ? parseFloat(formData.costo_unitario) : null,
      });

      toast.success('Lote registrado exitosamente');
      setShowModal(false);
      resetForm();
      loadLotes();
    } catch (error) {
      console.error('Error al crear lote:', error);
      toast.error(error.response?.data?.detail || 'Error al crear lote');
    }
  };

  const handleDelete = async (loteId) => {
    const result = await Swal.fire({
      title: '¿Eliminar lote?',
      text: 'Esta acción eliminará permanentemente este lote del inventario',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: '🗑️ Sí, eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    })

    if (!result.isConfirmed) return

    try {
      await loteService.eliminarLote(loteId);
      Swal.fire({
        icon: 'success',
        title: '¡Eliminado!',
        text: 'Lote eliminado exitosamente',
        timer: 2000,
        showConfirmButton: false
      })
      loadLotes();
    } catch (error) {
      console.error('Error al eliminar lote:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo eliminar el lote',
        confirmButtonColor: '#ef4444'
      })
    }
  };

  const resetForm = () => {
    setFormData({
      medicamento_id: '',
      numero_lote: '',
      fecha_ingreso: new Date().toISOString().split('T')[0],
      fecha_vencimiento: '',
      cantidad_inicial: '',
      cantidad_disponible: '',
      ubicacion_fisica: '',
      proveedor: '',
      numero_factura: '',
      costo_unitario: '',
      observaciones: '',
    });
  };

  const getEstadoBadge = (estado, fechaVencimiento) => {
    const hoy = new Date();
    const vencimiento = new Date(fechaVencimiento);
    const diasRestantes = Math.ceil((vencimiento - hoy) / (1000 * 60 * 60 * 24));

    if (estado === 'vencido' || diasRestantes < 0) {
      return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Vencido</span>;
    }
    if (estado === 'agotado') {
      return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">Agotado</span>;
    }
    if (estado === 'proximo_a_vencer' || diasRestantes <= 30) {
      return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Próximo a vencer</span>;
    }
    return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Disponible</span>;
  };

  const calcularDiasRestantes = (fechaVencimiento) => {
    const hoy = new Date();
    const vencimiento = new Date(fechaVencimiento);
    const dias = Math.ceil((vencimiento - hoy) / (1000 * 60 * 60 * 24));
    return dias;
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Package className="w-8 h-8 text-blue-600" />
            Gestión de Lotes
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Control de inventario por lotes (FEFO - First Expired, First Out)
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="w-5 h-5" />
          Registrar Lote
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Filtrar por Medicamento
            </label>
            <select
              value={selectedMedicamento || ''}
              onChange={(e) => setSelectedMedicamento(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Todos los medicamentos</option>
              {medicamentos.map((med) => (
                <option key={med.id} value={med.id}>
                  {med.nombre} (Stock: {med.stock})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Filtrar por Estado
            </label>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Todos los estados</option>
              <option value="disponible">Disponible</option>
              <option value="proximo_a_vencer">Próximo a vencer</option>
              <option value="vencido">Vencido</option>
              <option value="agotado">Agotado</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Lotes */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : lotes.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No hay lotes registrados</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Lote / Medicamento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Fechas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Ubicación
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Proveedor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {lotes.map((lote) => {
                  const diasRestantes = calcularDiasRestantes(lote.fecha_vencimiento);
                  return (
                    <tr key={lote.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <Package className="w-5 h-5 text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {lote.numero_lote}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {lote.medicamento_nombre}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="text-gray-900 dark:text-white flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            Vence: {new Date(lote.fecha_vencimiento).toLocaleDateString()}
                          </div>
                          <div className="text-gray-500 dark:text-gray-400">
                            {diasRestantes >= 0 ? `${diasRestantes} días restantes` : 'Vencido'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="text-gray-900 dark:text-white font-semibold">
                            {lote.cantidad_disponible} / {lote.cantidad_inicial}
                          </div>
                          <div className="text-xs text-gray-500">
                            {lote.costo_unitario && `$${parseFloat(lote.costo_unitario).toFixed(2)}/u`}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        {lote.ubicacion_fisica ? (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            {lote.ubicacion_fisica}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        {lote.proveedor || <span className="text-gray-400">-</span>}
                      </td>
                      <td className="px-6 py-4">
                        {getEstadoBadge(lote.estado, lote.fecha_vencimiento)}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium">
                        <button
                          onClick={() => handleDelete(lote.id)}
                          className="text-red-600 hover:text-red-900 dark:hover:text-red-400 ml-3"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Crear Lote */}
      {showModal && (
        <Modal onClose={() => { setShowModal(false); resetForm(); }}>
          <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Registrar Nuevo Lote</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Medicamento *
                </label>
                <select
                  name="medicamento_id"
                  value={formData.medicamento_id}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Seleccione medicamento</option>
                  {medicamentos.map((med) => (
                    <option key={med.id} value={med.id}>
                      {med.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Número de Lote *
                </label>
                <input
                  type="text"
                  name="numero_lote"
                  value={formData.numero_lote}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Ej: LOTE-2025-001"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Fecha de Ingreso
                </label>
                <input
                  type="date"
                  name="fecha_ingreso"
                  value={formData.fecha_ingreso}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Fecha de Vencimiento *
                </label>
                <input
                  type="date"
                  name="fecha_vencimiento"
                  value={formData.fecha_vencimiento}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Cantidad *
                </label>
                <input
                  type="number"
                  name="cantidad_inicial"
                  value={formData.cantidad_inicial}
                  onChange={handleInputChange}
                  required
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Unidades"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Costo Unitario ($)
                </label>
                <input
                  type="number"
                  name="costo_unitario"
                  value={formData.costo_unitario}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Ubicación Física
                </label>
                <input
                  type="text"
                  name="ubicacion_fisica"
                  value={formData.ubicacion_fisica}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Ej: Estantería A, Nivel 2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Número de Factura
                </label>
                <input
                  type="text"
                  name="numero_factura"
                  value={formData.numero_factura}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Ej: FAC-2025-001"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Proveedor
              </label>
              <input
                type="text"
                name="proveedor"
                value={formData.proveedor}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Nombre del proveedor"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Observaciones
              </label>
              <textarea
                name="observaciones"
                value={formData.observaciones}
                onChange={handleInputChange}
                rows="2"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Observaciones adicionales"
              />
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <button
                type="button"
                onClick={() => { setShowModal(false); resetForm(); }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Registrar Lote
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
