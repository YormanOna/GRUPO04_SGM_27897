import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCita } from '../../services/citaService';
import { 
  Calendar, Clock, User, Stethoscope, FileText, 
  AlertCircle, CheckCircle, XCircle, ArrowLeft, Edit2 
} from 'lucide-react';

const CitaView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cita, setCita] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    cargarCita();
  }, [id]);

  const cargarCita = async () => {
    try {
      setLoading(true);
      const data = await getCita(id);
      setCita(data);
    } catch (err) {
      console.error('Error al cargar la cita:', err);
      setError('No se pudo cargar la información de la cita');
    } finally {
      setLoading(false);
    }
  };

  const getEstadoBadge = (estado) => {
    const configs = {
      Pendiente: {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        icon: Clock,
        label: 'Pendiente'
      },
      Confirmada: {
        bg: 'bg-blue-100',
        text: 'text-blue-800',
        icon: CheckCircle,
        label: 'Confirmada'
      },
      Completada: {
        bg: 'bg-green-100',
        text: 'text-green-800',
        icon: CheckCircle,
        label: 'Completada'
      },
      Cancelada: {
        bg: 'bg-red-100',
        text: 'text-red-800',
        icon: XCircle,
        label: 'Cancelada'
      },
      'No asistió': {
        bg: 'bg-gray-100',
        text: 'text-gray-800',
        icon: AlertCircle,
        label: 'No asistió'
      }
    };

    const config = configs[estado] || configs['Pendiente'];
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${config.bg} ${config.text}`}>
        <Icon className="w-4 h-4" />
        {config.label}
      </span>
    );
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return 'N/A';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-EC', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatearHora = (hora) => {
    if (!hora) return 'N/A';
    return hora.substring(0, 5); // HH:MM
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 font-medium">Cargando información...</p>
        </div>
      </div>
    );
  }

  if (error || !cita) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-8 max-w-md w-full">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-red-100 rounded-full">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-red-900">Error</h3>
              <p className="text-red-700">{error || 'Cita no encontrada'}</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/citas')}
            className="w-full mt-4 px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-all"
          >
            Volver a Citas
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate('/citas')}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-indigo-600 transition-colors font-medium"
            >
              <ArrowLeft className="w-5 h-5" />
              Volver a Citas
            </button>
            
            <button
              onClick={() => navigate(`/citas/editar/${id}`)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all transform hover:scale-105"
            >
              <Edit2 className="w-5 h-5" />
              Editar Cita
            </button>
          </div>
          
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">
                  Detalles de la Cita
                </h1>
                <p className="text-gray-600">
                  Cita #{cita.id} - {formatearFecha(cita.fecha)}
                </p>
              </div>
              <div>
                {getEstadoBadge(cita.estado)}
              </div>
            </div>
          </div>
        </div>

        {/* Grid de Información */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Información del Paciente */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-blue-100">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl">
                <User className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Paciente</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                  Nombre Completo
                </label>
                <p className="text-lg font-bold text-gray-900 mt-1">
                  {cita.paciente_nombre} {cita.paciente_apellido}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                  Cédula
                </label>
                <p className="text-lg font-semibold text-gray-700 mt-1">
                  {cita.paciente_cedula || 'No registrada'}
                </p>
              </div>
            </div>
          </div>

          {/* Información del Médico */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-purple-100">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
                <Stethoscope className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Médico</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                  Doctor(a)
                </label>
                <p className="text-lg font-bold text-gray-900 mt-1">
                  {cita.medico_nombre} {cita.medico_apellido}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                  Especialidad
                </label>
                <p className="text-lg font-semibold text-gray-700 mt-1">
                  {cita.medico_especialidad || 'General'}
                </p>
              </div>
            </div>
          </div>

          {/* Fecha y Hora */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-green-100">
              <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Fecha y Hora</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                  Fecha
                </label>
                <p className="text-lg font-bold text-gray-900 mt-1 capitalize">
                  {formatearFecha(cita.fecha)}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                    Hora Inicio
                  </label>
                  <p className="text-lg font-semibold text-gray-700 mt-1">
                    {formatearHora(cita.hora_inicio)}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                    Hora Fin
                  </label>
                  <p className="text-lg font-semibold text-gray-700 mt-1">
                    {formatearHora(cita.hora_fin)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Motivo */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-orange-100">
              <div className="p-3 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Motivo</h2>
            </div>
            
            <div>
              <p className="text-lg text-gray-700 leading-relaxed">
                {cita.motivo || 'Sin motivo especificado'}
              </p>
            </div>
          </div>
        </div>

        {/* Observaciones (si existen) */}
        {cita.observaciones && (
          <div className="mt-6 bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Observaciones</h2>
            </div>
            <p className="text-gray-700 text-lg leading-relaxed whitespace-pre-wrap">
              {cita.observaciones}
            </p>
          </div>
        )}

        {/* Botón de Acción */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={() => navigate('/citas/calendario')}
            className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-lg hover:shadow-2xl transition-all transform hover:scale-105 flex items-center gap-3"
          >
            <Calendar className="w-6 h-6" />
            Ver Calendario
          </button>
        </div>
      </div>
    </div>
  );
};

export default CitaView;
