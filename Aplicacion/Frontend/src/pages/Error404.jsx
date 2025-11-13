import React from 'react'
import { Link } from 'react-router-dom'
import { Home, ArrowLeft, FileQuestion } from 'lucide-react'

const Error404 = () => (
  <div className="flex min-h-screen items-center justify-center px-4">
    <div className="text-center max-w-2xl">
      {/* Icono animado */}
      <div className="mb-8 flex justify-center">
        <div className="relative">
          <div className="w-32 h-32 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center animate-pulse">
            <FileQuestion className="w-16 h-16 text-red-500" />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white font-bold">
            !
          </div>
        </div>
      </div>

      {/* Código de error */}
      <h1 className="text-9xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-700 mb-4">
        404
      </h1>

      {/* Mensaje */}
      <h2 className="text-3xl font-bold text-gray-800 mb-4">
        Página no encontrada
      </h2>
      <p className="text-gray-600 text-lg mb-8">
        Lo sentimos, la página que buscas no existe o ha sido movida.
      </p>

      {/* Botones de acción */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link
          to="/"
          className="flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
        >
          <Home className="w-5 h-5" />
          <span>Ir al inicio</span>
        </Link>
        <button
          onClick={() => window.history.back()}
          className="flex items-center justify-center space-x-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all duration-200 font-medium"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Volver atrás</span>
        </button>
      </div>

      {/* Links útiles */}
      <div className="mt-12 pt-8 border-t border-gray-200">
        <p className="text-sm text-gray-500 mb-4">Enlaces útiles:</p>
        <div className="flex flex-wrap justify-center gap-4 text-sm">
          <Link to="/pacientes" className="text-primary-600 hover:text-primary-700 hover:underline">
            Pacientes
          </Link>
          <Link to="/citas" className="text-primary-600 hover:text-primary-700 hover:underline">
            Citas
          </Link>
          <Link to="/medicos" className="text-primary-600 hover:text-primary-700 hover:underline">
            Médicos
          </Link>
          <Link to="/farmacia" className="text-primary-600 hover:text-primary-700 hover:underline">
            Farmacia
          </Link>
        </div>
      </div>
    </div>
  </div>
)

export default Error404

