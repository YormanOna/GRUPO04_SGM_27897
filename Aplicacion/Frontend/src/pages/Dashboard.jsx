import React, { useState, useEffect } from 'react'
import { 
  Users, 
  Calendar, 
  UserCheck, 
  Pill, 
  TrendingUp,
  Activity,
  Clock,
  AlertCircle,
  ArrowUpRight,
  CheckCircle2,
  Stethoscope,
  ClipboardList,
  FileText,
  Heart,
  UserPlus,
  CalendarCheck,
  CalendarClock,
  XCircle,
  Building2,
  Package,
  AlertTriangle,
  ShieldCheck,
  Clipboard
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getPacientes } from '../services/pacienteService'
import { getCitas } from '../services/citaService'
import { getMedicos } from '../services/medicoService'
import { getMedicamentos } from '../services/medicamentoService'
import { getRecetas } from '../services/recetaService'

const Dashboard = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    pacientes: 0,
    citas: 0,
    citasHoy: 0,
    medicos: 0,
    medicamentos: 0,
    recetas: 0
  })
  const [upcomingCitas, setUpcomingCitas] = useState([])
  const [loading, setLoading] = useState(true)

  const isSuperAdmin = user?.cargo === 'Admin General'
  const isAdmin = user?.cargo === 'Administrador' || user?.cargo === 'Admin General'
  const isMedic = user?.cargo === 'Medico'
  const isNurse = user?.cargo === 'Enfermera'
  const isPharmacist = user?.cargo === 'Farmaceutico'

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      // Cargar datos según el rol
      let pacientes = [], citas = [], medicos = [], medicamentos = [], recetas = []

      if (isAdmin || isMedic || isNurse) {
        pacientes = await getPacientes()
        citas = await getCitas()
      }

      if (isSuperAdmin || isAdmin) {
        medicos = await getMedicos()
      }

      if (isSuperAdmin || isPharmacist) {
        medicamentos = await getMedicamentos()
      }

      // Cargar recetas para médicos, farmacéuticos y admins
      if (isMedic || isPharmacist || isAdmin || isSuperAdmin) {
        recetas = await getRecetas()
        console.log('📋 Recetas cargadas:', recetas.length)
      }

      // Filtrar citas de hoy
      const hoy = new Date().toISOString().split('T')[0]
      const citasHoy = citas.filter(cita => {
        if (!cita.fecha) return false
        const citaFecha = cita.fecha.split('T')[0]
        return citaFecha === hoy
      })

      // Citas pendientes de hoy
      const citasPendientesHoy = citasHoy.filter(c => {
        const estado = (c.estado || '').toLowerCase()
        return estado === 'pendiente' || estado === 'programada' || estado === 'confirmada'
      })
      
      // Citas completadas de hoy
      const citasCompletadasHoy = citasHoy.filter(c => (c.estado || '').toLowerCase() === 'completada')
      
      // Citas canceladas
      const citasCanceladas = citas.filter(c => (c.estado || '').toLowerCase() === 'cancelada')
      
      // Pacientes con póliza vigente
      const pacientesConPoliza = pacientes.filter(p => p.estado_poliza === 'vigente')
      
      // Pacientes con póliza próxima a vencer
      const polizasPorVencer = pacientes.filter(p => p.estado_poliza === 'proxima_a_vencer')

      // Medicamentos con stock bajo (menos de 10 unidades)
      const stockBajo = medicamentos.filter(m => (m.stock || 0) < 10 && (m.stock || 0) > 0)
      
      // Medicamentos agotados
      const medicamentosAgotados = medicamentos.filter(m => (m.stock || 0) === 0)

      // Obtener próximas citas (ordenadas por fecha)
      const proximasCitas = citas
        .filter(c => {
          const estado = (c.estado || '').toLowerCase()
          return (estado === 'pendiente' || estado === 'programada' || estado === 'confirmada') && new Date(c.fecha) >= new Date()
        })
        .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
        .slice(0, 5)

      setStats({
        pacientes: pacientes.length,
        citas: citas.length,
        citasHoy: citasHoy.length,
        citasPendientesHoy: citasPendientesHoy.length,
        citasCompletadasHoy: citasCompletadasHoy.length,
        citasCanceladas: citasCanceladas.length,
        medicos: medicos.length,
        medicamentos: medicamentos.length,
        recetas: recetas.length,
        stockBajo: stockBajo.length,
        medicamentosAgotados: medicamentosAgotados.length,
        pacientesConPoliza: pacientesConPoliza.length,
        polizasPorVencer: polizasPorVencer.length
      })
      setUpcomingCitas(proximasCitas)
    } catch (error) {
      console.error('Error cargando estadísticas:', error)
    } finally {
      setLoading(false)
    }
  }

  const StatCard = ({ icon: Icon, title, value, change, gradient, link }) => (
    <Link to={link} className="block group">
      <div className={`bg-gradient-to-br ${gradient} rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer relative overflow-hidden border border-gray-100`}>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="w-14 h-14 bg-white/30 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/40 shadow-sm">
              <Icon className="w-7 h-7 text-white" />
            </div>
            {change && (
              <div className="flex items-center space-x-1 bg-white/30 backdrop-blur-sm px-3 py-1 rounded-full border border-white/40">
                <TrendingUp className="w-4 h-4 text-white" />
                <span className="text-sm font-bold text-white">{change}%</span>
              </div>
            )}
          </div>
          <h3 className="text-white/90 text-sm font-medium mb-2">{title}</h3>
          <p className="text-4xl font-bold text-white mb-2">{value}</p>
          <div className="flex items-center text-white/70 text-xs">
            <span>Ver detalles</span>
            <ArrowUpRight className="w-4 h-4 ml-1 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
          </div>
        </div>
      </div>
    </Link>
  )



  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-purple-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Cargando dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in bg-gradient-to-br from-slate-100 via-blue-50 to-purple-50 min-h-screen -m-8 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-bold text-gray-800 mb-2">Panel de Control</h2>
          <p className="text-gray-600 text-lg">Bienvenido, {user?.nombre} {user?.apellido}</p>
          <span className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
            {user?.cargo}
          </span>
        </div>
        <div className="flex items-center space-x-3 bg-white px-5 py-3 rounded-xl shadow-md border border-gray-200">
          <Clock className="w-5 h-5 text-blue-600" />
          <div>
            <p className="text-xs text-gray-500">Fecha actual</p>
            <p className="text-sm font-semibold text-gray-700">
              {new Date().toLocaleDateString('es-ES', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
        </div>
      </div>

      {/* ========== VISTA PARA SUPER ADMIN ========== */}
      {isSuperAdmin && (
        <>
          {/* Estadísticas principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard icon={Users} title="Total Pacientes" value={stats.pacientes} gradient="from-blue-600 via-blue-700 to-blue-800" link="/pacientes" />
            <StatCard icon={Calendar} title="Citas Totales" value={stats.citas} gradient="from-purple-600 via-purple-700 to-purple-800" link="/citas" />
            <StatCard icon={Stethoscope} title="Médicos Activos" value={stats.medicos} gradient="from-green-600 via-green-700 to-green-800" link="/medicos" />
            <StatCard icon={Pill} title="Medicamentos" value={stats.medicamentos} gradient="from-orange-600 via-orange-700 to-orange-800" link="/farmacia" />
          </div>

          {/* Accesos rápidos administrativos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link to="/asistencia" className="bg-white rounded-xl p-4 shadow-md hover:shadow-xl transition-all border border-gray-200 group">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center">
                  <ClipboardList className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Control</p>
                  <p className="font-bold text-gray-800 group-hover:text-cyan-600 transition-colors">Asistencia</p>
                </div>
              </div>
            </Link>

            <Link to="/medicos" className="bg-white rounded-xl p-4 shadow-md hover:shadow-xl transition-all border border-gray-200 group">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                  <Stethoscope className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Gestión</p>
                  <p className="font-bold text-gray-800 group-hover:text-green-600 transition-colors">Médicos</p>
                </div>
              </div>
            </Link>

            <Link to="/farmacia" className="bg-white rounded-xl p-4 shadow-md hover:shadow-xl transition-all border border-gray-200 group">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                  <Package className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Inventario</p>
                  <p className="font-bold text-gray-800 group-hover:text-orange-600 transition-colors">Farmacia</p>
                </div>
              </div>
            </Link>

            <Link to="/recetas" className="bg-white rounded-xl p-4 shadow-md hover:shadow-xl transition-all border border-gray-200 group">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Gestión</p>
                  <p className="font-bold text-gray-800 group-hover:text-purple-600 transition-colors">Recetas</p>
                </div>
              </div>
            </Link>
          </div>
        </>
      )}

      {/* ========== VISTA PARA ADMINISTRADOR (RECEPCIONISTA) ========== */}
      {isAdmin && !isSuperAdmin && (
        <>
          {/* Estadísticas de recepción */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard icon={Calendar} title="Citas de Hoy" value={stats.citasHoy} gradient="from-blue-600 via-blue-700 to-blue-800" link="/citas" />
            <StatCard icon={CalendarCheck} title="Citas Pendientes" value={stats.citasPendientesHoy} gradient="from-yellow-600 via-yellow-700 to-orange-600" link="/citas" />
            <StatCard icon={Users} title="Total Pacientes" value={stats.pacientes} gradient="from-purple-600 via-purple-700 to-purple-800" link="/pacientes" />
            <StatCard icon={ShieldCheck} title="Pólizas Vigentes" value={stats.pacientesConPoliza} gradient="from-green-600 via-green-700 to-green-800" link="/pacientes" />
          </div>

          {/* Accesos rápidos para recepcionista */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link to="/citas/nueva" className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/90 text-sm mb-1">Acción Rápida</p>
                  <p className="text-white font-bold text-xl">Agendar Cita</p>
                </div>
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <CalendarClock className="w-7 h-7 text-white" />
                </div>
              </div>
            </Link>

            <Link to="/pacientes/nuevo" className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/90 text-sm mb-1">Acción Rápida</p>
                  <p className="text-white font-bold text-xl">Nuevo Paciente</p>
                </div>
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <UserPlus className="w-7 h-7 text-white" />
                </div>
              </div>
            </Link>

            <Link to="/citas/calendario" className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/90 text-sm mb-1">Visualizar</p>
                  <p className="text-white font-bold text-xl">Calendario</p>
                </div>
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Calendar className="w-7 h-7 text-white" />
                </div>
              </div>
            </Link>
          </div>

          {/* Alertas para recepción */}
          {stats.polizasPorVencer > 0 && (
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-500 rounded-xl p-5 shadow-md">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
                <div>
                  <p className="font-bold text-yellow-900">Atención: Pólizas por Vencer</p>
                  <p className="text-sm text-yellow-700">Hay {stats.polizasPorVencer} pacientes con pólizas próximas a vencer. Notifíqueles para su renovación.</p>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ========== VISTA PARA MÉDICOS ========== */}
      {isMedic && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard icon={Calendar} title="Mis Citas Hoy" value={stats.citasHoy} gradient="from-blue-600 via-blue-700 to-blue-800" link="/citas" />
            <StatCard icon={CheckCircle2} title="Completadas Hoy" value={stats.citasCompletadasHoy} gradient="from-green-600 via-green-700 to-green-800" link="/citas" />
            <StatCard icon={Users} title="Mis Pacientes" value={stats.pacientes} gradient="from-purple-600 via-purple-700 to-purple-800" link="/pacientes" />
            <StatCard icon={Heart} title="Consultas" value={stats.citas} gradient="from-pink-600 via-pink-700 to-red-600" link="/consulta-medica" />
          </div>

          {/* Accesos rápidos médicos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link to="/consulta-medica" className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/90 text-sm mb-1">Módulo</p>
                  <p className="text-white font-bold text-xl">Consulta Médica</p>
                </div>
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Stethoscope className="w-7 h-7 text-white" />
                </div>
              </div>
            </Link>

            <Link to="/recetas" className="bg-gradient-to-br from-green-500 to-teal-600 rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/90 text-sm mb-1">Módulo</p>
                  <p className="text-white font-bold text-xl">Recetas Médicas</p>
                </div>
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FileText className="w-7 h-7 text-white" />
                </div>
              </div>
            </Link>

            <Link to="/citas/calendario" className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/90 text-sm mb-1">Ver</p>
                  <p className="text-white font-bold text-xl">Mi Agenda</p>
                </div>
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Calendar className="w-7 h-7 text-white" />
                </div>
              </div>
            </Link>
          </div>
        </>
      )}

      {/* ========== VISTA PARA ENFERMERAS ========== */}
      {isNurse && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard icon={Calendar} title="Citas de Hoy" value={stats.citasHoy} gradient="from-purple-600 via-purple-700 to-purple-800" link="/citas" />
            <StatCard icon={Activity} title="Signos Vitales" value={stats.citasCompletadasHoy} gradient="from-pink-600 via-pink-700 to-red-600" link="/enfermeria/signos-vitales" />
            <StatCard icon={Users} title="Pacientes" value={stats.pacientes} gradient="from-blue-600 via-blue-700 to-blue-800" link="/pacientes" />
            <StatCard icon={ClipboardList} title="Total Citas" value={stats.citas} gradient="from-green-600 via-green-700 to-green-800" link="/citas" />
          </div>

          {/* Accesos rápidos enfermería */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link to="/enfermeria/signos-vitales" className="bg-gradient-to-br from-pink-500 to-red-500 rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/90 text-sm mb-1">Registro</p>
                  <p className="text-white font-bold text-xl">Signos Vitales</p>
                </div>
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Activity className="w-7 h-7 text-white" />
                </div>
              </div>
            </Link>

            <Link to="/citas" className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/90 text-sm mb-1">Gestión</p>
                  <p className="text-white font-bold text-xl">Citas Médicas</p>
                </div>
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Calendar className="w-7 h-7 text-white" />
                </div>
              </div>
            </Link>

            <Link to="/pacientes" className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/90 text-sm mb-1">Ver</p>
                  <p className="text-white font-bold text-xl">Pacientes</p>
                </div>
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Users className="w-7 h-7 text-white" />
                </div>
              </div>
            </Link>
          </div>
        </>
      )}

      {/* ========== VISTA PARA FARMACÉUTICOS ========== */}
      {isPharmacist && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard icon={Pill} title="Inventario Total" value={stats.medicamentos} gradient="from-orange-600 via-orange-700 to-orange-800" link="/farmacia" />
            <StatCard icon={Package} title="Medicamentos" value={stats.medicamentos} gradient="from-blue-600 via-blue-700 to-blue-800" link="/farmacia" />
            <StatCard icon={FileText} title="Recetas" value={stats.recetas} gradient="from-green-600 via-green-700 to-green-800" link="/recetas" />
            <StatCard icon={AlertCircle} title="Stock Bajo" value={stats.stockBajo || 0} gradient="from-red-600 via-red-700 to-red-800" link="/farmacia" />
          </div>

          {/* Accesos rápidos farmacia */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link to="/farmacia" className="bg-gradient-to-br from-orange-500 to-red-500 rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/90 text-sm mb-1">Gestión</p>
                  <p className="text-white font-bold text-xl">Inventario</p>
                </div>
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Package className="w-7 h-7 text-white" />
                </div>
              </div>
            </Link>

            <Link to="/recetas" className="bg-gradient-to-br from-green-500 to-teal-600 rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/90 text-sm mb-1">Despacho</p>
                  <p className="text-white font-bold text-xl">Recetas</p>
                </div>
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FileText className="w-7 h-7 text-white" />
                </div>
              </div>
            </Link>

            <Link to="/farmacia" className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/90 text-sm mb-1">Control</p>
                  <p className="text-white font-bold text-xl">Medicamentos</p>
                </div>
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Pill className="w-7 h-7 text-white" />
                </div>
              </div>
            </Link>
          </div>
        </>
      )}

      {/* ========== SECCIÓN DE PRÓXIMAS CITAS ========== */}
      {(isAdmin || isMedic || isNurse) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Panel de Próximas Citas */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-800">Próximas Citas</h3>
                  <p className="text-sm text-gray-500">Citas programadas próximamente</p>
                </div>
              </div>
              <Link to="/citas" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors flex items-center space-x-2">
                <span>Ver todas</span>
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
            
            <div className="space-y-3">
              {upcomingCitas.length > 0 ? (
                upcomingCitas.map((cita, index) => (
                  <Link 
                    key={cita.id} 
                    to={`/citas/${cita.id}`}
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl hover:shadow-lg transition-all duration-300 border border-gray-200 group cursor-pointer"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex items-center space-x-4">
                      {/* Avatar del Paciente */}
                      <div className="relative">
                        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md group-hover:scale-110 transition-transform">
                          {cita.paciente_nombre?.[0]}{cita.paciente_apellido?.[0]}
                        </div>
                        <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                          (cita.estado || '').toLowerCase() === 'confirmada' ? 'bg-green-500' : 
                          ((cita.estado || '').toLowerCase() === 'pendiente' || (cita.estado || '').toLowerCase() === 'programada') ? 'bg-yellow-500' : 
                          'bg-gray-400'
                        }`}></div>
                      </div>
                      
                      {/* Información de la Cita */}
                      <div className="flex-1">
                        <p className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors text-lg">
                          {cita.paciente_nombre} {cita.paciente_apellido}
                        </p>
                        <div className="flex items-center space-x-3 mt-1">
                          <div className="flex items-center space-x-1 text-gray-600">
                            <Stethoscope className="w-4 h-4" />
                            <p className="text-sm">
                              Dr(a). {cita.medico_nombre} {cita.medico_apellido}
                            </p>
                          </div>
                          <span className="text-gray-300">•</span>
                          <p className="text-sm text-gray-500">{cita.medico_especialidad || 'General'}</p>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                          {cita.motivo || 'Sin motivo especificado'}
                        </p>
                      </div>
                    </div>
                    
                    {/* Fecha y Hora */}
                    <div className="text-right">
                      <div className="flex items-center space-x-2 justify-end mb-1">
                        <Clock className="w-4 h-4 text-blue-600" />
                        <p className="font-bold text-gray-900 text-lg">
                          {cita.hora_inicio ? cita.hora_inicio.substring(0, 5) : 'N/A'}
                        </p>
                      </div>
                      <p className="text-sm text-gray-600 font-medium">
                        {new Date(cita.fecha).toLocaleDateString('es-ES', { 
                          day: 'numeric', 
                          month: 'short',
                          year: 'numeric'
                        })}
                      </p>
                      <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold ${
                        (cita.estado || '').toLowerCase() === 'confirmada' ? 'bg-green-100 text-green-700' :
                        ((cita.estado || '').toLowerCase() === 'pendiente' || (cita.estado || '').toLowerCase() === 'programada') ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {cita.estado?.charAt(0).toUpperCase() + cita.estado?.slice(1).replace('_', ' ') || 'Sin estado'}
                      </span>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-10 h-10 text-gray-400" />
                  </div>
                  <p className="text-gray-500 font-medium text-lg">No hay citas programadas</p>
                  <p className="text-gray-400 text-sm mt-2">Las próximas citas aparecerán aquí</p>
                </div>
              )}
            </div>
          </div>

          {/* Panel lateral de información rápida */}
          <div className="space-y-6">
            {/* Resumen de Citas del Día */}
            <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-6 shadow-lg text-white">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-bold">Citas de Hoy</h4>
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
              </div>
              <p className="text-5xl font-bold mb-2">{stats.citasHoy}</p>
              <p className="text-white/80 text-sm">Total de citas agendadas para hoy</p>
              
              <div className="mt-4 pt-4 border-t border-white/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-white/80 text-sm">Pendientes</span>
                  <span className="font-bold">{stats.citasPendientesHoy}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/80 text-sm">Completadas</span>
                  <span className="font-bold">{stats.citasCompletadasHoy}</span>
                </div>
              </div>
            </div>

            {/* Acceso Rápido al Calendario */}
            <Link to="/citas/calendario" className="block bg-white rounded-2xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all group">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-bold text-gray-800">Calendario</h4>
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                Visualiza todas las citas en vista de calendario
              </p>
              <div className="flex items-center text-green-600 font-semibold group-hover:translate-x-2 transition-transform">
                <span>Abrir calendario</span>
                <ArrowUpRight className="w-5 h-5 ml-2" />
              </div>
            </Link>

            {/* Estadística de Cancelaciones (solo si hay) */}
            {stats.citasCanceladas > 0 && (
              <div className="bg-gradient-to-br from-red-50 to-orange-50 border-l-4 border-red-500 rounded-xl p-5 shadow-md">
                <div className="flex items-center space-x-3 mb-2">
                  <XCircle className="w-6 h-6 text-red-600" />
                  <h4 className="font-bold text-red-900">Citas Canceladas</h4>
                </div>
                <p className="text-3xl font-bold text-red-700 mb-1">{stats.citasCanceladas}</p>
                <p className="text-sm text-red-600">Total de citas canceladas</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard
