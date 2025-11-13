import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Dashboard from '../pages/Dashboard'
import Login from '../pages/Login'
import PacienteList from '../pages/Pacientes/PacienteList'
import PacienteForm from '../pages/Pacientes/PacienteForm'
import CitaList from '../pages/Citas/CitaList'
import CitaForm from '../pages/Citas/CitaForm'
import CitaView from '../pages/Citas/CitaView'
import CitaEdit from '../pages/Citas/CitaEdit'
import CitaCalendar from '../pages/Citas/CitaCalendar'
import MedicoList from '../pages/Medicos/MedicoList'
import MedicamentoList from '../pages/Farmacia/MedicamentoList'
import Asistencia from '../pages/Asistencia/Asistencia'
import RecetaList from '../pages/Recetas/RecetaList'
import SignosVitales from '../pages/Enfermeria/SignosVitales'
import ConsultaMedica from '../pages/Consulta/ConsultaMedica'
import ExpedienteClinico from '../pages/Expediente/ExpedienteClinico'
import MiPerfil from '../pages/Perfil/MiPerfil'
import Empleados from '../pages/Admin/Empleados'
import Auditoria from '../pages/Admin/Auditoria'
import Error404 from '../pages/Error404'

// Componente para proteger rutas
const PrivateRoute = ({ children }) => {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" replace />
}

const AppRouter = () => {
  const { user } = useAuth()

  return (
    <Routes>
      {/* Ruta de login - sin redirect automático */}
      <Route path="/login" element={<Login />} />
      
      <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/perfil" element={<PrivateRoute><MiPerfil /></PrivateRoute>} />
      <Route path="/asistencia" element={<PrivateRoute><Asistencia /></PrivateRoute>} />
      
      {/* Rutas de Pacientes */}
      <Route path="/pacientes" element={<PrivateRoute><PacienteList /></PrivateRoute>} />
      <Route path="/pacientes/nuevo" element={<PrivateRoute><PacienteForm /></PrivateRoute>} />
      <Route path="/pacientes/editar/:id" element={<PrivateRoute><PacienteForm /></PrivateRoute>} />
      <Route path="/pacientes/:id" element={<PrivateRoute><PacienteForm mode="view" /></PrivateRoute>} />
      
      {/* Rutas de Citas */}
      <Route path="/citas" element={<PrivateRoute><CitaList /></PrivateRoute>} />
      <Route path="/citas/nueva" element={<PrivateRoute><CitaForm /></PrivateRoute>} />
      <Route path="/citas/editar/:id" element={<PrivateRoute><CitaEdit /></PrivateRoute>} />
      <Route path="/citas/:id" element={<PrivateRoute><CitaView /></PrivateRoute>} />
      <Route path="/citas/calendario" element={<PrivateRoute><CitaCalendar /></PrivateRoute>} />
      
      <Route path="/medicos" element={<PrivateRoute><MedicoList /></PrivateRoute>} />
      <Route path="/enfermeria/signos-vitales" element={<PrivateRoute><SignosVitales /></PrivateRoute>} />
      <Route path="/consulta-medica" element={<PrivateRoute><ConsultaMedica /></PrivateRoute>} />
      <Route path="/recetas" element={<PrivateRoute><RecetaList /></PrivateRoute>} />
      <Route path="/farmacia" element={<PrivateRoute><MedicamentoList /></PrivateRoute>} />
      
      {/* RF-002: Expediente Clínico Electrónico */}
      <Route path="/expediente" element={<PrivateRoute><ExpedienteClinico /></PrivateRoute>} />
      
      {/* Rutas de Admin General (Superadmin) */}
      <Route path="/admin/empleados" element={<PrivateRoute><Empleados /></PrivateRoute>} />
      <Route path="/admin/auditoria" element={<PrivateRoute><Auditoria /></PrivateRoute>} />
      
      <Route path="*" element={<Error404 />} />
    </Routes>
  )
}

export default AppRouter
