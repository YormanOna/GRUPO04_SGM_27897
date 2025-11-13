import { X, Download, Calendar, User, Clock, Stethoscope, FileText } from 'lucide-react';
import { useState, useEffect } from 'react';

const QRModal = ({ isOpen, onClose, citaId, citaData }) => {
  const [qrUrl, setQrUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen && citaId) {
      // El endpoint QR es público, no necesita autenticación
      const url = `http://localhost:8000/citas/${citaId}/qr`;
      setQrUrl(url);
      setIsLoading(false);
    }
  }, [isOpen, citaId]);

  const handleDownloadPDF = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/citas/${citaId}/comprobante/pdf`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Error al descargar PDF');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `comprobante_cita_${citaId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error al descargar PDF:', error);
      alert('No se pudo descargar el comprobante');
    }
  };

  const handleDownloadQR = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(qrUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Error al descargar QR');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `qr_cita_${citaId}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error al descargar QR:', error);
      alert('No se pudo descargar el código QR');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-slideUp">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 p-6 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">¡Cita Confirmada!</h2>
              <p className="text-white/80 text-sm">Tu código QR está listo</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/20 rounded-lg"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Success Message */}
          <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl">
            <p className="text-emerald-700 dark:text-emerald-300 text-center font-medium">
              ✅ La cita se ha registrado exitosamente
            </p>
          </div>

          {/* QR Code */}
          <div className="flex justify-center mb-6">
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 p-6 rounded-2xl shadow-lg">
              {isLoading ? (
                <div className="w-64 h-64 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
                </div>
              ) : (
                <img
                  src={qrUrl}
                  alt="Código QR de la cita"
                  className="w-64 h-64 object-contain"
                  onError={() => {
                    console.error('Error al cargar QR');
                    setIsLoading(false);
                  }}
                />
              )}
            </div>
          </div>

          {/* Cita Details */}
          {citaData && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* Paciente */}
              <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                <div className="bg-blue-100 dark:bg-blue-800/50 p-2 rounded-lg">
                  <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">Paciente</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{citaData.paciente}</p>
                </div>
              </div>

              {/* Médico */}
              <div className="flex items-start gap-3 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
                <div className="bg-purple-100 dark:bg-purple-800/50 p-2 rounded-lg">
                  <Stethoscope className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">Médico</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{citaData.medico || 'Por asignar'}</p>
                </div>
              </div>

              {/* Fecha y Hora */}
              <div className="flex items-start gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
                <div className="bg-emerald-100 dark:bg-emerald-800/50 p-2 rounded-lg">
                  <Clock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">Fecha y Hora</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {citaData.fecha} - {citaData.hora}
                  </p>
                </div>
              </div>

              {/* Motivo */}
              <div className="flex items-start gap-3 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-200 dark:border-orange-800">
                <div className="bg-orange-100 dark:bg-orange-800/50 p-2 rounded-lg">
                  <FileText className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">Motivo</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{citaData.motivo || 'Consulta'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
              <span className="bg-blue-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">i</span>
              Instrucciones
            </h3>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 ml-7">
              <li>• Presenta este código QR al llegar al hospital</li>
              <li>• También puedes descargar el comprobante en PDF</li>
              <li>• Te llegará un email de confirmación con los detalles</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleDownloadQR}
              className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl"
            >
              <Download className="w-5 h-5" />
              Descargar QR
            </button>
            <button
              onClick={handleDownloadPDF}
              className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-semibold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl"
            >
              <Download className="w-5 h-5" />
              Descargar PDF
            </button>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full mt-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-medium py-3 px-6 rounded-xl transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default QRModal;
