/**
 * Utilidades para formatear fechas y horas
 */

/**
 * Formatea una hora en formato "HH:mm:ss" o "HH:mm" a "hh:mm AM/PM"
 * @param {string} timeString - Hora en formato "HH:mm:ss" o "HH:mm"
 * @returns {string} - Hora formateada "hh:mm AM/PM"
 */
export const formatTime = (timeString) => {
  if (!timeString) return 'N/A';
  
  // Extraer horas y minutos
  const [hours, minutes] = timeString.split(':').map(Number);
  
  // Convertir a formato 12 horas
  const period = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  
  return `${hour12.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`;
};

/**
 * Formatea una fecha ISO a formato legible en español
 * @param {string} dateString - Fecha en formato ISO
 * @returns {string} - Fecha formateada "DD de MMMM, YYYY"
 */
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

/**
 * Formatea fecha y hora juntos
 * @param {string} dateString - Fecha en formato ISO
 * @param {string} timeString - Hora en formato "HH:mm:ss"
 * @returns {string} - Fecha y hora formateadas
 */
export const formatDateTime = (dateString, timeString) => {
  if (!dateString || !timeString) return 'N/A';
  
  const formattedDate = formatDate(dateString);
  const formattedTime = formatTime(timeString);
  
  return `${formattedDate} a las ${formattedTime}`;
};

/**
 * Formatea una fecha ISO completa (con hora incluida) 
 * @param {string} isoString - Fecha ISO completa "2025-01-01T18:00:00"
 * @returns {object} - { date: "1 de enero, 2025", time: "06:00 PM" }
 */
export const parseISODateTime = (isoString) => {
  if (!isoString) return { date: 'N/A', time: 'N/A' };
  
  const dateTime = new Date(isoString);
  
  const date = dateTime.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  
  const hours = dateTime.getHours();
  const minutes = dateTime.getMinutes();
  const period = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  const time = `${hour12.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`;
  
  return { date, time };
};

/**
 * Obtiene el nombre del día de la semana
 * @param {string} dateString - Fecha en formato ISO
 * @returns {string} - Nombre del día en español
 */
export const getDayName = (dateString) => {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', { weekday: 'long' });
};

/**
 * Calcula la diferencia en días entre dos fechas
 * @param {string} date1 - Primera fecha ISO
 * @param {string} date2 - Segunda fecha ISO (opcional, por defecto hoy)
 * @returns {number} - Diferencia en días
 */
export const daysDifference = (date1, date2 = new Date()) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2 - d1);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Verifica si una fecha es hoy
 * @param {string} dateString - Fecha ISO
 * @returns {boolean}
 */
export const isToday = (dateString) => {
  if (!dateString) return false;
  
  const date = new Date(dateString);
  const today = new Date();
  
  return date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
};

/**
 * Verifica si una fecha es mañana
 * @param {string} dateString - Fecha ISO
 * @returns {boolean}
 */
export const isTomorrow = (dateString) => {
  if (!dateString) return false;
  
  const date = new Date(dateString);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  return date.getDate() === tomorrow.getDate() &&
    date.getMonth() === tomorrow.getMonth() &&
    date.getFullYear() === tomorrow.getFullYear();
};

/**
 * Obtiene un texto relativo (hoy, mañana, o fecha)
 * @param {string} dateString - Fecha ISO
 * @returns {string}
 */
export const getRelativeDateText = (dateString) => {
  if (isToday(dateString)) return 'Hoy';
  if (isTomorrow(dateString)) return 'Mañana';
  return formatDate(dateString);
};
