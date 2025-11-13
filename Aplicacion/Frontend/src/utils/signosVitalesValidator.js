/**
 * RF-002: Validación de signos vitales según rangos normales
 * Retorna indicadores visuales y estado de cada signo vital
 */

export const RANGOS_NORMALES = {
  presion_arterial: {
    sistolica: { min: 90, max: 120 },
    diastolica: { min: 60, max: 80 }
  },
  frecuencia_cardiaca: { min: 60, max: 100 },
  frecuencia_respiratoria: { min: 12, max: 20 },
  temperatura: { min: 36.5, max: 37.5 },
  saturacion_oxigeno: { min: 95, max: 100 },
  peso: { min: 30, max: 200 }, // kg
  talla: { min: 1.0, max: 2.5 }, // metros
  imc: { min: 18.5, max: 24.9 } // Normal
}

/**
 * Valida la presión arterial
 * @param {string} presion - Formato "120/80"
 * @returns {object} Estado de validación
 */
export const validarPresionArterial = (presion) => {
  if (!presion) return { valido: null, mensaje: 'No registrado', color: 'gray' }
  
  const partes = presion.split('/')
  if (partes.length !== 2) return { valido: false, mensaje: 'Formato inválido', color: 'red' }
  
  const sistolica = parseInt(partes[0])
  const diastolica = parseInt(partes[1])
  
  const sistolicaOk = sistolica >= RANGOS_NORMALES.presion_arterial.sistolica.min && 
                      sistolica <= RANGOS_NORMALES.presion_arterial.sistolica.max
  const diastolicaOk = diastolica >= RANGOS_NORMALES.presion_arterial.diastolica.min && 
                       diastolica <= RANGOS_NORMALES.presion_arterial.diastolica.max
  
  if (sistolicaOk && diastolicaOk) {
    return { valido: true, mensaje: 'Normal', color: 'green', icono: '✓' }
  } else if (sistolica > 140 || diastolica > 90) {
    return { valido: false, mensaje: 'Hipertensión', color: 'red', icono: '⚠' }
  } else if (sistolica < 90 || diastolica < 60) {
    return { valido: false, mensaje: 'Hipotensión', color: 'red', icono: '⚠' }
  } else {
    return { valido: false, mensaje: 'Fuera de rango', color: 'orange', icono: '⚠' }
  }
}

/**
 * Valida un valor numérico contra rangos
 * @param {number} valor 
 * @param {object} rango - { min, max }
 * @param {string} nombre - Nombre del signo vital
 * @returns {object}
 */
export const validarRango = (valor, rango, nombre) => {
  if (!valor && valor !== 0) {
    return { valido: null, mensaje: 'No registrado', color: 'gray' }
  }
  
  const num = parseFloat(valor)
  if (isNaN(num)) {
    return { valido: false, mensaje: 'Valor inválido', color: 'red' }
  }
  
  if (num >= rango.min && num <= rango.max) {
    return { valido: true, mensaje: 'Normal', color: 'green', icono: '✓' }
  } else if (num < rango.min) {
    return { valido: false, mensaje: `Bajo (< ${rango.min})`, color: 'red', icono: '⚠' }
  } else {
    return { valido: false, mensaje: `Alto (> ${rango.max})`, color: 'red', icono: '⚠' }
  }
}

/**
 * Valida todos los signos vitales de una consulta
 * @param {object} signosVitales 
 * @returns {object} Resultados de validación
 */
export const validarSignosVitales = (signosVitales) => {
  if (!signosVitales) {
    return {
      estado: 'sin_datos',
      mensaje: 'No hay signos vitales registrados',
      alertas: []
    }
  }
  
  const resultados = {
    presion_arterial: validarPresionArterial(signosVitales.presion_arterial),
    frecuencia_cardiaca: validarRango(
      signosVitales.frecuencia_cardiaca,
      RANGOS_NORMALES.frecuencia_cardiaca,
      'Frecuencia Cardíaca'
    ),
    frecuencia_respiratoria: validarRango(
      signosVitales.frecuencia_respiratoria,
      RANGOS_NORMALES.frecuencia_respiratoria,
      'Frecuencia Respiratoria'
    ),
    temperatura: validarRango(
      signosVitales.temperatura,
      RANGOS_NORMALES.temperatura,
      'Temperatura'
    ),
    saturacion_oxigeno: validarRango(
      signosVitales.saturacion_oxigeno,
      RANGOS_NORMALES.saturacion_oxigeno,
      'Saturación de Oxígeno'
    ),
    peso: validarRango(
      signosVitales.peso,
      RANGOS_NORMALES.peso,
      'Peso'
    ),
    talla: validarRango(
      signosVitales.talla,
      RANGOS_NORMALES.talla,
      'Talla'
    ),
    imc: validarRango(
      signosVitales.imc,
      RANGOS_NORMALES.imc,
      'IMC'
    )
  }
  
  // Contar alertas
  const alertas = Object.entries(resultados)
    .filter(([key, val]) => val.valido === false)
    .map(([key, val]) => ({
      parametro: key.replace(/_/g, ' ').toUpperCase(),
      mensaje: val.mensaje,
      color: val.color
    }))
  
  const estado = alertas.length === 0 ? 'normal' : 'con_alertas'
  
  return {
    estado,
    resultados,
    alertas,
    mensaje: alertas.length === 0 
      ? 'Todos los signos vitales en rango normal' 
      : `${alertas.length} parámetro(s) fuera de rango`
  }
}

/**
 * Obtiene clase CSS según el estado de validación
 * @param {boolean} valido 
 * @returns {string}
 */
export const getColorClass = (valido) => {
  if (valido === null) return 'text-gray-500'
  return valido ? 'text-green-600' : 'text-red-600'
}

/**
 * Obtiene color de fondo según el estado
 * @param {boolean} valido 
 * @returns {string}
 */
export const getBgColorClass = (valido) => {
  if (valido === null) return 'bg-gray-50 dark:bg-gray-700'
  return valido ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'
}
