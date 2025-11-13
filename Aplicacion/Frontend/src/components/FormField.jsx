import React from 'react'
import { AlertCircle } from 'lucide-react'

/**
 * Componente FormField - Campo de formulario con validación visual
 * 
 * @param {string} label - Etiqueta del campo
 * @param {string} name - Nombre del campo
 * @param {string} type - Tipo de input (text, email, number, date, etc.)
 * @param {string} value - Valor del campo
 * @param {function} onChange - Función para manejar cambios
 * @param {function} onBlur - Función para manejar cuando pierde el foco
 * @param {string} error - Mensaje de error (si existe)
 * @param {boolean} touched - Si el campo ha sido tocado por el usuario
 * @param {boolean} required - Si el campo es obligatorio
 * @param {string} placeholder - Texto de placeholder
 * @param {React.Component} icon - Icono de Lucide React
 * @param {object} inputProps - Props adicionales para el input
 */
const FormField = ({ 
  label, 
  name, 
  type = 'text', 
  value, 
  onChange, 
  onBlur,
  error, 
  touched,
  required = false,
  placeholder = '',
  icon: Icon,
  ...inputProps 
}) => {
  const hasError = touched && error

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        {Icon && (
          <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors ${
            hasError ? 'text-red-500' : 'text-gray-400'
          }`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          className={`w-full ${Icon ? 'pl-10' : 'pl-4'} pr-4 py-2.5 border-2 rounded-lg transition-all duration-200
            ${hasError 
              ? 'border-red-500 bg-red-50 focus:border-red-600 focus:ring-4 focus:ring-red-100' 
              : 'border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100'
            }
            focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed
          `}
          {...inputProps}
        />
        {hasError && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <AlertCircle className="w-5 h-5 text-red-500" />
          </div>
        )}
      </div>
      {hasError && (
        <div className="mt-1.5 flex items-start space-x-1">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-600 font-medium">{error}</p>
        </div>
      )}
    </div>
  )
}

/**
 * Componente TextAreaField - Área de texto con validación visual
 */
export const TextAreaField = ({ 
  label, 
  name, 
  value, 
  onChange, 
  onBlur,
  error, 
  touched,
  required = false,
  placeholder = '',
  rows = 4,
  icon: Icon,
  ...textareaProps 
}) => {
  const hasError = touched && error

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        {Icon && (
          <div className={`absolute top-3 left-3 pointer-events-none transition-colors ${
            hasError ? 'text-red-500' : 'text-gray-400'
          }`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
        <textarea
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          rows={rows}
          className={`w-full ${Icon ? 'pl-10' : 'pl-4'} pr-4 py-2.5 border-2 rounded-lg transition-all duration-200 resize-none
            ${hasError 
              ? 'border-red-500 bg-red-50 focus:border-red-600 focus:ring-4 focus:ring-red-100' 
              : 'border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100'
            }
            focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed
          `}
          {...textareaProps}
        />
      </div>
      {hasError && (
        <div className="mt-1.5 flex items-start space-x-1">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-600 font-medium">{error}</p>
        </div>
      )}
    </div>
  )
}

/**
 * Componente SelectField - Select con validación visual
 */
export const SelectField = ({ 
  label, 
  name, 
  value, 
  onChange, 
  onBlur,
  error, 
  touched,
  required = false,
  children,
  icon: Icon,
  ...selectProps 
}) => {
  const hasError = touched && error

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        {Icon && (
          <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors ${
            hasError ? 'text-red-500' : 'text-gray-400'
          }`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
        <select
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          className={`w-full ${Icon ? 'pl-10' : 'pl-4'} pr-10 py-2.5 border-2 rounded-lg transition-all duration-200 appearance-none
            ${hasError 
              ? 'border-red-500 bg-red-50 focus:border-red-600 focus:ring-4 focus:ring-red-100' 
              : 'border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100'
            }
            focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed
          `}
          {...selectProps}
        >
          {children}
        </select>
        {/* Flecha del select */}
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          {hasError ? (
            <AlertCircle className="w-5 h-5 text-red-500" />
          ) : (
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </div>
      </div>
      {hasError && (
        <div className="mt-1.5 flex items-start space-x-1">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-600 font-medium">{error}</p>
        </div>
      )}
    </div>
  )
}

export default FormField
