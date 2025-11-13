import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Stethoscope, User, Calendar, Activity, FileText, Pill, 
  Save, Send, AlertCircle, Clock, Heart, Thermometer,
  ArrowLeft, Plus, Trash2, Eye, Download, Mail
} from 'lucide-react';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import { useAuth } from '../../context/AuthContext';
import consultaService from '../../services/consultaService';
import citaService from '../../services/citaService';
import recetaService from '../../services/recetaService';
import { diagnosticoService } from '../../services/diagnosticoService';
import medicamentoService from '../../services/medicamentoService';
import { buscarMedicamentos } from '../../services/medicamentoService';

const ConsultaMedica = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [pacientesEnCola, setPacientesEnCola] = useState([]);
  const [citaSeleccionada, setCitaSeleccionada] = useState(null);
  const [consultaActual, setConsultaActual] = useState(null);
  const [loading, setLoading] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [generandoComprobante, setGenerandoComprobante] = useState(false);
  const [vistaActiva, setVistaActiva] = useState('cola'); // 'cola', 'consulta', 'historia'
  const [tabActiva, setTabActiva] = useState('consulta'); // 'consulta', 'prescripcion', 'seguimiento'

  // Función para formatear la edad según la edad del paciente
  const formatearEdad = (edad, fechaNacimiento) => {
    if (edad === null || edad === undefined) return 'N/A';
    
    // Si la edad es 0 o menor a 1 año, calculamos en meses o días
    if (edad === 0 && fechaNacimiento) {
      const hoy = new Date();
      const fechaNac = new Date(fechaNacimiento);
      
      // Calcular meses
      let meses = (hoy.getFullYear() - fechaNac.getFullYear()) * 12;
      meses += hoy.getMonth() - fechaNac.getMonth();
      
      if (meses > 0) {
        return `${meses} ${meses === 1 ? 'mes' : 'meses'}`;
      }
      
      // Si tiene menos de 1 mes, calcular en días
      const unDia = 24 * 60 * 60 * 1000; // milisegundos en un día
      const dias = Math.floor((hoy - fechaNac) / unDia);
      
      if (dias === 0) {
        return 'Recién nacido';
      }
      
      return `${dias} ${dias === 1 ? 'día' : 'días'}`;
    }
    
    // Para 1 año o más
    return `${edad} ${edad === 1 ? 'año' : 'años'}`;
  };

  // Datos de la consulta
  const [datosConsulta, setDatosConsulta] = useState({
    motivo_consulta: '',
    enfermedad_actual: '',
    examen_fisico: '',
    diagnostico: '',
    diagnostico_codigo: '', // RF-002: Código CIE-10
    diagnosticos_secundarios: '',
    tratamiento: '',
    indicaciones: '',
    examenes_solicitados: '',
    pronostico: '',
    observaciones: ''
  });

  // Medicamentos para prescripción
  const [medicamentos, setMedicamentos] = useState([
    { nombre: '', dosis: '', frecuencia: '', duracion: '', via: '' }
  ]);
  const [indicacionesReceta, setIndicacionesReceta] = useState('');

  // RF-003: Estados para autocomplete CIE-10
  const [sugerenciasCIE10, setSugerenciasCIE10] = useState([]);
  const [buscandoCIE10, setBuscandoCIE10] = useState(false);
  const [mostrarSugerenciasCIE10, setMostrarSugerenciasCIE10] = useState(false);

  // RF-003: Estados para autocomplete medicamentos
  const [sugerenciasMedicamentos, setSugerenciasMedicamentos] = useState({});
  const [buscandoMedicamentos, setBuscandoMedicamentos] = useState({});
  const [medicamentoActivoIndex, setMedicamentoActivoIndex] = useState(null);
  const [mostrarSugerenciasMedicamentos, setMostrarSugerenciasMedicamentos] = useState({});

  // RF-003: Estados para programación de seguimiento
  const [seguimiento, setSeguimiento] = useState({
    programar: false,
    especialidad: '',
    fecha: '',
    hora: '',
    observaciones: ''
  });
  const [mostrarSeguimiento, setMostrarSeguimiento] = useState(false);

  useEffect(() => {
    cargarPacientesEnCola();
  }, []);

  // RF-003: Cerrar dropdown de CIE-10 al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      const dropdown = event.target.closest('[data-autocomplete-cie10]');
      if (!dropdown) {
        setMostrarSugerenciasCIE10(false);
      }
    };

    if (mostrarSugerenciasCIE10) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [mostrarSugerenciasCIE10]);

  // RF-003: Cerrar dropdown de medicamentos al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      const dropdown = event.target.closest('[data-autocomplete-medicamento]');
      if (!dropdown) {
        setMostrarSugerenciasMedicamentos({});
      }
    };

    const hayDropdownsAbiertos = Object.values(mostrarSugerenciasMedicamentos).some(val => val);
    if (hayDropdownsAbiertos) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [mostrarSugerenciasMedicamentos]);

  // RF-003: Cerrar dropdown de medicamentos al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      const dropdown = event.target.closest('[data-autocomplete-medicamento]');
      if (!dropdown) {
        setMostrarSugerenciasMedicamentos({});
      }
    };

    const hayAlgunDropdownAbierto = Object.values(mostrarSugerenciasMedicamentos).some(Boolean);
    if (hayAlgunDropdownAbierto) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [mostrarSugerenciasMedicamentos]);



  const cargarPacientesEnCola = async () => {
    setLoading(true);
    try {
      const hoy = new Date().toISOString().split('T')[0];
      const response = await citaService.listar({
        fecha: hoy,
        medico_id: user.id,
        estado: 'en_consulta'
      });
      setPacientesEnCola(response.data || []);
    } catch (error) {
      console.error('Error al cargar pacientes:', error);
      toast.error('Error al cargar la cola de pacientes');
    } finally {
      setLoading(false);
    }
  };

  const seleccionarPaciente = async (cita) => {
    setCitaSeleccionada(cita);
    setVistaActiva('consulta');
    
    // Buscar si ya existe una consulta iniciada (puede ser creada por enfermera o médico)
    try {
      const response = await consultaService.listar({
        paciente_id: cita.paciente_id
        // NO filtrar por medico_id porque la consulta puede haber sido creada por la enfermera
      });
      
      const consultasHoy = response.data.filter(c => {
        const fechaConsulta = new Date(c.fecha_consulta).toDateString();
        const hoy = new Date().toDateString();
        return fechaConsulta === hoy;
      });

      // Validar que exista consulta con signos vitales
      if (consultasHoy.length === 0 || !consultasHoy.some(c => c.signos_vitales)) {
        await Swal.fire({
          icon: 'warning',
          title: 'Signos Vitales Requeridos',
          text: 'Este paciente aún no tiene signos vitales registrados. La enfermera debe registrarlos antes de que pueda atender la consulta.',
          confirmButtonColor: '#f59e0b',
          confirmButtonText: 'Entendido'
        });
        setVistaActiva('lista'); // Volver a la lista
        return; // No permitir acceso a la consulta
      }

      if (consultasHoy.length > 0) {
        // Tomar la consulta más reciente (la última creada)
        const consulta = consultasHoy[consultasHoy.length - 1];
        setConsultaActual(consulta);
        
        // Cargar datos de la consulta existente
        setDatosConsulta({
          motivo_consulta: consulta.motivo_consulta || '',
          enfermedad_actual: consulta.enfermedad_actual || '',
          examen_fisico: consulta.examen_fisico || '',
          diagnostico: consulta.diagnostico || '',
          diagnostico_codigo: consulta.diagnostico_codigo || '',
          diagnosticos_secundarios: consulta.diagnosticos_secundarios || '',
          tratamiento: consulta.tratamiento || '',
          indicaciones: consulta.indicaciones || '',
          examenes_solicitados: consulta.examenes_solicitados || '',
          pronostico: consulta.pronostico || '',
          observaciones: consulta.observaciones || ''
        });
      } else {
        setConsultaActual(null);
      }
    } catch (error) {
      console.error('Error al buscar consulta:', error);
      toast.error('Error al cargar los datos de la consulta');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setDatosConsulta(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const agregarMedicamento = () => {
    setMedicamentos([...medicamentos, { nombre: '', dosis: '', frecuencia: '', duracion: '', via: '' }]);
  };

  const eliminarMedicamento = (index) => {
    setMedicamentos(medicamentos.filter((_, i) => i !== index));
  };

  const handleMedicamentoChange = (index, field, value) => {
    const nuevosMedicamentos = [...medicamentos];
    nuevosMedicamentos[index][field] = value;
    setMedicamentos(nuevosMedicamentos);
  };

  // RF-003: Buscar diagnósticos CIE-10
  const buscarDiagnosticosCIE10 = async (query) => {
    if (!query || query.length < 2) {
      setSugerenciasCIE10([]);
      setMostrarSugerenciasCIE10(false);
      return;
    }

    setBuscandoCIE10(true);
    try {
      const resultados = await diagnosticoService.buscar(query, 10);
      setSugerenciasCIE10(resultados);
      setMostrarSugerenciasCIE10(true);
    } catch (error) {
      console.error('Error al buscar CIE-10:', error);
      setSugerenciasCIE10([]);
    } finally {
      setBuscandoCIE10(false);
    }
  };

  // RF-003: Seleccionar diagnóstico CIE-10
  const seleccionarDiagnosticoCIE10 = (diagnostico) => {
    setDatosConsulta(prev => ({
      ...prev,
      diagnostico_codigo: diagnostico.codigo,
      diagnostico: diagnostico.descripcion
    }));
    setMostrarSugerenciasCIE10(false);
    setSugerenciasCIE10([]);
  };

  // RF-003: Buscar medicamentos
  const buscarMedicamentosAutocomplete = async (query, index) => {
    if (!query || query.length < 2) {
      setSugerenciasMedicamentos(prev => ({ ...prev, [index]: [] }));
      setMostrarSugerenciasMedicamentos(prev => ({ ...prev, [index]: false }));
      return;
    }

    setBuscandoMedicamentos(prev => ({ ...prev, [index]: true }));
    try {
      const resultados = await medicamentoService.buscarMedicamentos(query, 10);
      setSugerenciasMedicamentos(prev => ({ ...prev, [index]: resultados }));
      setMostrarSugerenciasMedicamentos(prev => ({ ...prev, [index]: true }));
    } catch (error) {
      console.error('Error al buscar medicamentos:', error);
      setSugerenciasMedicamentos(prev => ({ ...prev, [index]: [] }));
    } finally {
      setBuscandoMedicamentos(prev => ({ ...prev, [index]: false }));
    }
  };

  // RF-003: Seleccionar medicamento
  const seleccionarMedicamento = (medicamento, index) => {
    const nuevosMedicamentos = [...medicamentos];
    nuevosMedicamentos[index].nombre = medicamento.nombre;
    setMedicamentos(nuevosMedicamentos);
    setMostrarSugerenciasMedicamentos(prev => ({ ...prev, [index]: false }));
    setSugerenciasMedicamentos(prev => ({ ...prev, [index]: [] }));
  };

  const validarConsulta = () => {
    const errores = [];
    
    if (!datosConsulta.motivo_consulta.trim()) {
      errores.push('El motivo de consulta es obligatorio');
    }
    if (!datosConsulta.enfermedad_actual.trim()) {
      errores.push('La enfermedad actual es obligatoria');
    }
    if (!datosConsulta.examen_fisico.trim()) {
      errores.push('El examen físico es obligatorio');
    }
    if (!datosConsulta.diagnostico.trim()) {
      errores.push('El diagnóstico es obligatorio');
    }
    if (!datosConsulta.tratamiento.trim()) {
      errores.push('El tratamiento es obligatorio');
    }

    return errores;
  };

  const guardarConsulta = async () => {
    const errores = validarConsulta();
    if (errores.length > 0) {
      errores.forEach(error => toast.error(error));
      return false; // Retornar false si hay errores de validación
    }

    // Validar que exista paciente_id
    if (!citaSeleccionada?.paciente_id) {
      toast.error('Error: No se puede guardar consulta sin paciente asociado');
      return false;
    }

    setGuardando(true);
    try {
      if (consultaActual) {
        // Actualizar consulta existente
        await consultaService.actualizar(consultaActual.id, datosConsulta);
        toast.success('Consulta actualizada correctamente');
      } else {
        // Crear nueva consulta (no debería llegar aquí si la enfermera ya la creó)
        const payload = {
          cita_id: citaSeleccionada.id,
          paciente_id: citaSeleccionada.paciente_id,
          medico_id: user.id,
          ...datosConsulta
        };
        const response = await consultaService.crear(payload);
        setConsultaActual(response.data);
        toast.success('Consulta guardada correctamente');
      }
      return true; // Retornar true si se guardó correctamente
    } catch (error) {
      console.error('Error al guardar consulta:', error);
      const errorMsg = error.response?.data?.detail || 'Error al guardar la consulta';
      if (typeof errorMsg === 'object') {
        const errores = Object.values(errorMsg).flat();
        errores.forEach(err => toast.error(err));
      } else {
        toast.error(errorMsg);
      }
      return false; // Retornar false si hubo error
    } finally {
      setGuardando(false);
    }
  };

  const finalizarYPrescribir = async () => {
    // Primero guardar la consulta
    await guardarConsulta();

    // Validar que haya al menos un medicamento
    const medicamentosValidos = medicamentos.filter(m => m.nombre.trim() !== '');
    if (medicamentosValidos.length === 0) {
      toast.error('Debe agregar al menos un medicamento para prescribir');
      return;
    }

    // Validar que cada medicamento tenga todos los campos necesarios
    for (let i = 0; i < medicamentosValidos.length; i++) {
      const med = medicamentosValidos[i];
      if (!med.dosis || !med.frecuencia || !med.duracion || !med.via) {
        toast.error(`Medicamento ${i + 1}: Complete todos los campos (dosis, frecuencia, duración, vía)`);
        return;
      }
    }

    if (!consultaActual?.id) {
      toast.error('Error: Debe guardar la consulta antes de prescribir');
      return;
    }

    setGuardando(true);
    try {
      // Formatear medicamentos para la receta
      const medicamentosTexto = medicamentosValidos.map((m, i) => 
        `${i + 1}. ${m.nombre}\n   Dosis: ${m.dosis}\n   Frecuencia: ${m.frecuencia}\n   Duración: ${m.duracion}\n   Vía: ${m.via}`
      ).join('\n\n');

      // Crear receta
      const recetaPayload = {
        consulta_id: consultaActual.id,
        medico_id: user.id,
        paciente_id: citaSeleccionada.paciente_id,
        medicamentos: medicamentosTexto,
        indicaciones: indicacionesReceta || datosConsulta.indicaciones,
        estado: 'pendiente'
      };

      await recetaService.crearReceta(recetaPayload);

      // Actualizar estado de la cita a "completada"
      await citaService.actualizar(citaSeleccionada.id, {
        estado: 'completada'
      });

      // RF-003: Crear cita de seguimiento si está programada
      if (seguimiento.programar) {
        if (!seguimiento.especialidad || !seguimiento.fecha || !seguimiento.hora) {
          toast.error('Complete todos los campos de la cita de seguimiento');
          return;
        }

        try {
          // Combinar fecha y hora en un datetime ISO
          const fechaHoraISO = `${seguimiento.fecha}T${seguimiento.hora}:00`;
          
          const citaSeguimiento = {
            paciente_id: citaSeleccionada.paciente_id,
            medico_id: user.id,
            fecha: fechaHoraISO,
            hora_inicio: seguimiento.hora,
            motivo: `Seguimiento - ${seguimiento.observaciones || 'Control de progreso'}`,
            estado: 'programada',
            tipo_cita: 'seguimiento'
          };

          await citaService.crear(citaSeguimiento);
          toast.success(`📅 Cita de seguimiento agendada para ${seguimiento.fecha}`);
          
          // Resetear formulario de seguimiento
          setSeguimiento({
            programar: false,
            especialidad: '',
            fecha: '',
            hora: '',
            observaciones: ''
          });
        } catch (error) {
          console.error('Error al crear cita de seguimiento:', error);
          toast.error('No se pudo agendar la cita de seguimiento');
        }
      }

      toast.success('✅ Consulta finalizada y receta enviada a farmacia');
      
      // Volver a la cola
      volverACola();
      cargarPacientesEnCola();
    } catch (error) {
      console.error('Error al finalizar consulta:', error);
      const errorMsg = error.response?.data?.detail || 'Error al finalizar la consulta';
      if (typeof errorMsg === 'object') {
        const errores = Object.values(errorMsg).flat();
        errores.forEach(err => toast.error(err));
      } else {
        toast.error(errorMsg);
      }
    } finally {
      setGuardando(false);
    }
  };

  const finalizarSinReceta = async () => {
    const result = await Swal.fire({
      title: '¿Finalizar sin receta?',
      text: 'Se finalizará la consulta sin prescribir medicamentos',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#6b7280',
      confirmButtonText: '✅ Sí, finalizar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    })

    if (!result.isConfirmed) return

    await guardarConsulta();

    try {
      // Actualizar estado de la cita a "completada"
      await citaService.actualizar(citaSeleccionada.id, {
        estado: 'completada'
      });

      // RF-003: Limpiar draft del localStorage
      if (consultaActual?.id) {
        localStorage.removeItem(`draft_consulta_${consultaActual.id}`);
      }

      // RF-003: Crear cita de seguimiento si está programada
      if (seguimiento.programar) {
        if (!seguimiento.especialidad || !seguimiento.fecha || !seguimiento.hora) {
          toast.error('Complete todos los campos de la cita de seguimiento');
          return;
        }

        try {
          // Construir fecha ISO correctamente con zona horaria
          const [year, month, day] = seguimiento.fecha.split('-');
          const [hours, minutes] = seguimiento.hora.split(':');
          
          const fechaCompleta = new Date(
            parseInt(year),
            parseInt(month) - 1,
            parseInt(day),
            parseInt(hours),
            parseInt(minutes || 0),
            0
          );
          
          // Calcular hora_fin (30 minutos después por defecto)
          const fechaFin = new Date(fechaCompleta.getTime() + 30 * 60000);
          const horaFin = `${String(fechaFin.getHours()).padStart(2, '0')}:${String(fechaFin.getMinutes()).padStart(2, '0')}:00`;
          
          const citaSeguimiento = {
            paciente_id: citaSeleccionada.paciente_id,
            medico_id: user.id,
            fecha: fechaCompleta.toISOString(),
            hora_inicio: `${seguimiento.hora}${seguimiento.hora.split(':').length === 2 ? ':00' : ''}`,
            hora_fin: horaFin,
            motivo: `Seguimiento - ${seguimiento.observaciones || 'Control de progreso'}`,
            estado: 'programada',
            tipo_cita: 'seguimiento'
          };

        console.log('📅 Creando cita de seguimiento:', citaSeguimiento);
        console.log('📝 Validación de campos:');
        console.log('  - paciente_id:', citaSeguimiento.paciente_id, typeof citaSeguimiento.paciente_id);
        console.log('  - medico_id:', citaSeguimiento.medico_id, typeof citaSeguimiento.medico_id);
        console.log('  - fecha:', citaSeguimiento.fecha, typeof citaSeguimiento.fecha);
        console.log('  - hora_inicio:', citaSeguimiento.hora_inicio, typeof citaSeguimiento.hora_inicio);
        console.log('  - hora_fin:', citaSeguimiento.hora_fin, typeof citaSeguimiento.hora_fin);
        console.log('  - tipo_cita:', citaSeguimiento.tipo_cita, typeof citaSeguimiento.tipo_cita);
        console.log('📡 VITE_API_URL:', import.meta.env.VITE_API_URL);
        console.log('📡 Token presente:', !!localStorage.getItem('token'));
        
        const response = await citaService.createCita(citaSeguimiento);
        console.log('✅ Respuesta del servidor:', response);
        toast.success(`📅 Cita de seguimiento agendada para ${seguimiento.fecha}`);          // Resetear formulario de seguimiento
          setSeguimiento({
            programar: false,
            especialidad: '',
            fecha: '',
            hora: '',
            observaciones: ''
          });
        } catch (error) {
          console.error('❌ Error al crear cita de seguimiento:', error);
          console.error('📋 Código de estado:', error.response?.status);
          console.error('📋 Mensaje del servidor:', error.response?.data);
          console.error('📋 URL que falló:', error.config?.url);
          
          const errorMsg = error.response?.data?.detail || 'No se pudo agendar la cita de seguimiento';
          toast.error(errorMsg);
        }
      }

      toast.success('✅ Consulta finalizada exitosamente');
      volverACola();
      cargarPacientesEnCola();
    } catch (error) {
      console.error('Error al finalizar consulta:', error);
      toast.error('Error al finalizar la consulta');
    }
  };

  // RF-003: Generar comprobante de asistencia
  const generarComprobante = async (consultaId, enviarEmail = false) => {
    setGenerandoComprobante(true);
    try {
      const response = await consultaService.generarComprobante(consultaId, enviarEmail);
      
      // Si la respuesta es un objeto con mensaje (email enviado)
      if (response.data && typeof response.data === 'object' && response.data.mensaje) {
        toast.success(response.data.mensaje);
        return;
      }
      
      // Si es un blob (PDF), descargarlo
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Comprobante_Consulta_${consultaId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      if (enviarEmail) {
        toast.success('📧 Comprobante descargado y enviado por email');
      } else {
        toast.success('✅ Comprobante descargado exitosamente');
      }
    } catch (error) {
      console.error('Error al generar comprobante:', error);
      toast.error('Error al generar el comprobante de asistencia');
    } finally {
      setGenerandoComprobante(false);
    }
  };

  const volverACola = () => {
    setVistaActiva('cola');
    setCitaSeleccionada(null);
    setConsultaActual(null);
    setDatosConsulta({
      motivo_consulta: '',
      enfermedad_actual: '',
      examen_fisico: '',
      diagnostico: '',
      diagnostico_codigo: '',
      diagnosticos_secundarios: '',
      tratamiento: '',
      indicaciones: '',
      examenes_solicitados: '',
      pronostico: '',
      observaciones: ''
    });
    setMedicamentos([{ nombre: '', dosis: '', frecuencia: '', duracion: '', via: '' }]);
    setIndicacionesReceta('');
    setSeguimiento({
      programar: false,
      especialidad: '',
      fecha: '',
      hora: '',
      observaciones: ''
    });
  };

  const formatearSignosVitales = (consulta) => {
    if (!consulta?.signos_vitales) {
      return <p className="text-gray-500 text-sm">No disponible</p>;
    }
    
    const sv = consulta.signos_vitales;
    
    // Funciones de validación de rangos normales
    const validarRango = (valor, min, max) => {
      if (!valor || valor === 'N/A') return { valido: true, valor };
      const num = parseFloat(valor);
      return { valido: num >= min && num <= max, valor };
    };

    const validarPA = (pa) => {
      if (!pa || pa === 'N/A') return { valido: true, valor: pa };
      const match = pa.match(/^(\d+)\/(\d+)$/);
      if (!match) return { valido: false, valor: pa };
      const sistolica = parseInt(match[1]);
      const diastolica = parseInt(match[2]);
      const valido = sistolica >= 90 && sistolica <= 140 && diastolica >= 60 && diastolica <= 90;
      return { valido, valor: pa };
    };

    // Validar todos los signos vitales
    const validaciones = {
      pa: validarPA(sv.presion_arterial),
      fc: validarRango(sv.frecuencia_cardiaca, 60, 100),
      fr: validarRango(sv.frecuencia_respiratoria, 12, 20),
      temp: validarRango(sv.temperatura, 36.0, 37.5),
      spo2: validarRango(sv.saturacion_oxigeno, 95, 100)
    };

    const alertas = [];
    if (!validaciones.pa.valido) alertas.push('Presión Arterial');
    if (!validaciones.fc.valido) alertas.push('Frecuencia Cardíaca');
    if (!validaciones.fr.valido) alertas.push('Frecuencia Respiratoria');
    if (!validaciones.temp.valido) alertas.push('Temperatura');
    if (!validaciones.spo2.valido) alertas.push('SpO₂');

    return (
      <div className="space-y-3">
        {/* Alerta general si hay valores fuera de rango */}
        {alertas.length > 0 && (
          <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-500 rounded-lg p-3 animate-pulse">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
              <AlertCircle className="w-5 h-5" />
              <p className="font-semibold text-sm">
                ⚠️ Signos vitales fuera de rango normal: {alertas.join(', ')}
              </p>
            </div>
          </div>
        )}

        {/* Grid de signos vitales con indicadores de alerta */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className={`p-2 rounded ${!validaciones.pa.valido ? 'bg-red-100 dark:bg-red-900/30 border-2 border-red-500' : 'bg-red-50 dark:bg-red-900/10'}`}>
            <div className="flex items-center gap-1">
              <p className="text-red-600 dark:text-red-400 font-semibold">PA</p>
              {!validaciones.pa.valido && <AlertCircle className="w-3 h-3 text-red-600" />}
            </div>
            <p className="text-gray-800 dark:text-gray-200">{sv.presion_arterial || 'N/A'}</p>
            {!validaciones.pa.valido && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">Rango: 90-140/60-90</p>
            )}
          </div>

          <div className={`p-2 rounded ${!validaciones.fc.valido ? 'bg-red-100 dark:bg-red-900/30 border-2 border-red-500' : 'bg-green-50 dark:bg-green-900/10'}`}>
            <div className="flex items-center gap-1">
              <p className="text-green-600 dark:text-green-400 font-semibold">FC</p>
              {!validaciones.fc.valido && <AlertCircle className="w-3 h-3 text-red-600" />}
            </div>
            <p className="text-gray-800 dark:text-gray-200">{sv.frecuencia_cardiaca || 'N/A'} lpm</p>
            {!validaciones.fc.valido && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">Rango: 60-100</p>
            )}
          </div>

          <div className={`p-2 rounded ${!validaciones.fr.valido ? 'bg-red-100 dark:bg-red-900/30 border-2 border-red-500' : 'bg-blue-50 dark:bg-blue-900/10'}`}>
            <div className="flex items-center gap-1">
              <p className="text-blue-600 dark:text-blue-400 font-semibold">FR</p>
              {!validaciones.fr.valido && <AlertCircle className="w-3 h-3 text-red-600" />}
            </div>
            <p className="text-gray-800 dark:text-gray-200">{sv.frecuencia_respiratoria || 'N/A'} rpm</p>
            {!validaciones.fr.valido && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">Rango: 12-20</p>
            )}
          </div>

          <div className={`p-2 rounded ${!validaciones.temp.valido ? 'bg-red-100 dark:bg-red-900/30 border-2 border-red-500' : 'bg-orange-50 dark:bg-orange-900/10'}`}>
            <div className="flex items-center gap-1">
              <p className="text-orange-600 dark:text-orange-400 font-semibold">Temp</p>
              {!validaciones.temp.valido && <AlertCircle className="w-3 h-3 text-red-600" />}
            </div>
            <p className="text-gray-800 dark:text-gray-200">{sv.temperatura || 'N/A'} °C</p>
            {!validaciones.temp.valido && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">Rango: 36-37.5</p>
            )}
          </div>

          <div className={`p-2 rounded ${!validaciones.spo2.valido ? 'bg-red-100 dark:bg-red-900/30 border-2 border-red-500' : 'bg-cyan-50 dark:bg-cyan-900/10'}`}>
            <div className="flex items-center gap-1">
              <p className="text-cyan-600 dark:text-cyan-400 font-semibold">SpO₂</p>
              {!validaciones.spo2.valido && <AlertCircle className="w-3 h-3 text-red-600" />}
            </div>
            <p className="text-gray-800 dark:text-gray-200">{sv.saturacion_oxigeno || 'N/A'}%</p>
            {!validaciones.spo2.valido && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">Rango: 95-100</p>
            )}
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/10 p-2 rounded">
            <p className="text-purple-600 dark:text-purple-400 font-semibold">Peso</p>
            <p className="text-gray-800 dark:text-gray-200">{sv.peso || 'N/A'} kg</p>
          </div>

          <div className="bg-indigo-50 dark:bg-indigo-900/10 p-2 rounded">
            <p className="text-indigo-600 dark:text-indigo-400 font-semibold">Talla</p>
            <p className="text-gray-800 dark:text-gray-200">{sv.talla || 'N/A'} m</p>
          </div>

          <div className="bg-teal-50 dark:bg-teal-900/10 p-2 rounded">
            <p className="text-teal-600 dark:text-teal-400 font-semibold">IMC</p>
            <p className="text-gray-800 dark:text-gray-200">{sv.imc || 'N/A'}</p>
          </div>
        </div>
      </div>
    );
  };

  // Vista de Cola de Pacientes
  if (vistaActiva === 'cola') {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <Stethoscope className="w-8 h-8 text-blue-600" />
            Consulta Médica
          </h1>
          <p className="text-gray-600 mt-2">
            Pacientes en espera con signos vitales registrados
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              Cola de Pacientes ({pacientesEnCola.length})
            </h2>
            <button
              onClick={cargarPacientesEnCola}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Actualizar
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Cargando pacientes...</p>
            </div>
          ) : pacientesEnCola.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">No hay pacientes en cola</p>
              <p className="text-gray-500 text-sm mt-2">
                Los pacientes aparecerán aquí después de que enfermería registre sus signos vitales
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {pacientesEnCola.map((cita) => (
                <div
                  key={cita.id}
                  className="border-2 border-gray-200 rounded-lg p-5 hover:border-blue-400 hover:shadow-lg transition-all cursor-pointer"
                  onClick={() => seleccionarPaciente(cita)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-gray-800">
                          {cita.paciente?.nombre} {cita.paciente?.apellido}
                        </h3>
                        <p className="text-gray-600 text-sm">
                          Cédula: {cita.paciente?.cedula} | Edad: {formatearEdad(cita.paciente?.edad, cita.paciente?.fecha_nacimiento)}
                        </p>
                        {cita.paciente?.alergias && (
                          <p className="text-red-600 text-sm font-semibold flex items-center gap-1 mt-1">
                            <AlertCircle className="w-4 h-4" />
                            Alergias: {cita.paciente.alergias}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Hora de cita</p>
                      <p className="font-semibold text-gray-800">{cita.hora_inicio}</p>
                    </div>
                  </div>

                  {/* Signos Vitales */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-emerald-600" />
                      Signos Vitales
                    </p>
                    <p className="text-gray-500 text-sm">
                      ✅ Registrados - Haga clic para ver detalles
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Vista de Consulta
  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <button
            onClick={volverACola}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Volver a la cola
          </button>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <Stethoscope className="w-8 h-8 text-blue-600" />
            Consulta Médica
          </h1>
        </div>
      </div>

      {/* Información del Paciente */}
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg shadow-md p-6 mb-6 border border-blue-200">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {citaSeleccionada?.paciente?.nombre} {citaSeleccionada?.paciente?.apellido}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Cédula</p>
                <p className="font-semibold text-gray-800">{citaSeleccionada?.paciente?.cedula}</p>
              </div>
              <div>
                <p className="text-gray-600">Edad</p>
                <p className="font-semibold text-gray-800">
                  {formatearEdad(citaSeleccionada?.paciente?.edad, citaSeleccionada?.paciente?.fecha_nacimiento)}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Género</p>
                <p className="font-semibold text-gray-800">{citaSeleccionada?.paciente?.genero || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-600">Grupo Sanguíneo</p>
                <p className="font-semibold text-gray-800">{citaSeleccionada?.paciente?.grupo_sanguineo || 'N/A'}</p>
              </div>
            </div>
            {citaSeleccionada?.paciente?.alergias && (
              <div className="mt-3 bg-red-100 border border-red-300 rounded-lg p-3">
                <p className="text-red-800 font-semibold flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  ALERGIAS: {citaSeleccionada.paciente.alergias}
                </p>
              </div>
            )}
            {citaSeleccionada?.paciente?.antecedentes_medicos && (
              <div className="mt-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-amber-800 text-sm">
                  <strong>Antecedentes:</strong> {citaSeleccionada.paciente.antecedentes_medicos}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Signos Vitales */}
        <div className="mt-4 pt-4 border-t border-blue-200">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-600" />
            Signos Vitales Registrados
          </h3>
          {formatearSignosVitales(consultaActual)}
        </div>
      </div>

      {/* Sistema de Pestañas (Tabs) */}
      <div className="bg-white rounded-lg shadow-md mb-6 overflow-hidden">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setTabActiva('consulta')}
            className={`flex-1 px-6 py-4 font-semibold text-sm md:text-base flex items-center justify-center gap-2 transition-all ${
              tabActiva === 'consulta'
                ? 'bg-blue-600 text-white border-b-4 border-blue-700'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-800'
            }`}
          >
            <FileText className="w-5 h-5" />
            <span className="hidden sm:inline">1. Consulta Médica</span>
            <span className="sm:hidden">Consulta</span>
          </button>
          <button
            onClick={() => setTabActiva('prescripcion')}
            className={`flex-1 px-6 py-4 font-semibold text-sm md:text-base flex items-center justify-center gap-2 transition-all ${
              tabActiva === 'prescripcion'
                ? 'bg-orange-600 text-white border-b-4 border-orange-700'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-800'
            }`}
          >
            <Pill className="w-5 h-5" />
            <span className="hidden sm:inline">2. Prescripción</span>
            <span className="sm:hidden">Receta</span>
          </button>
          <button
            onClick={() => setTabActiva('finalizacion')}
            className={`flex-1 px-6 py-4 font-semibold text-sm md:text-base flex items-center justify-center gap-2 transition-all ${
              tabActiva === 'finalizacion'
                ? 'bg-green-600 text-white border-b-4 border-green-700'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-800'
            }`}
          >
            <Send className="w-5 h-5" />
            <span className="hidden sm:inline">3. Finalizar</span>
            <span className="sm:hidden">Finalizar</span>
          </button>
        </div>

        {/* Contenido de la pestaña activa */}
        <div className="p-6">
          {/* TAB 1: Formulario de Consulta */}
          {tabActiva === 'consulta' && (
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <FileText className="w-6 h-6 text-blue-600" />
                Registro de Consulta Médica
              </h3>

        <div className="grid grid-cols-1 gap-6">
          {/* Motivo de Consulta */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Motivo de Consulta *
            </label>
            <input
              type="text"
              name="motivo_consulta"
              value={datosConsulta.motivo_consulta}
              onChange={handleInputChange}
              placeholder="¿Por qué acude el paciente?"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Enfermedad Actual */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enfermedad Actual *
            </label>
            <textarea
              name="enfermedad_actual"
              value={datosConsulta.enfermedad_actual}
              onChange={handleInputChange}
              rows="4"
              placeholder="Descripción detallada de la enfermedad actual, inicio, evolución, síntomas..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Examen Físico */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Examen Físico *
            </label>
            <textarea
              name="examen_fisico"
              value={datosConsulta.examen_fisico}
              onChange={handleInputChange}
              rows="4"
              placeholder="Hallazgos del examen físico completo..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Diagnóstico Principal */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Diagnóstico Principal *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* RF-003: Autocomplete CIE-10 */}
                <div className="md:col-span-1 relative" data-autocomplete-cie10>
                  <input
                    type="text"
                    name="diagnostico_codigo"
                    value={datosConsulta.diagnostico_codigo}
                    onChange={(e) => {
                      handleInputChange(e);
                      buscarDiagnosticosCIE10(e.target.value);
                    }}
                    onFocus={() => {
                      if (sugerenciasCIE10.length > 0) {
                        setMostrarSugerenciasCIE10(true);
                      }
                    }}
                    placeholder="Buscar código CIE-10..."
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {buscandoCIE10 ? '🔍 Buscando...' : 'Búsqueda CIE-10'}
                  </p>
                  
                  {/* Dropdown de sugerencias */}
                  {mostrarSugerenciasCIE10 && sugerenciasCIE10.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl max-h-64 overflow-y-auto">
                      {sugerenciasCIE10.map((diag) => (
                        <button
                          key={diag.id}
                          type="button"
                          onClick={() => seleccionarDiagnosticoCIE10(diag)}
                          className="w-full text-left px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/30 border-b border-gray-200 dark:border-gray-700 last:border-0 transition-colors"
                        >
                          <div className="flex items-start gap-2">
                            <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-sm">
                              {diag.codigo}
                            </span>
                            <div className="flex-1">
                              <p className="text-sm text-gray-800 dark:text-gray-200">
                                {diag.descripcion}
                              </p>
                              {diag.categoria && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  {diag.categoria}
                                </p>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="md:col-span-2">
                  <input
                    type="text"
                    name="diagnostico"
                    value={datosConsulta.diagnostico}
                    onChange={handleInputChange}
                    placeholder="Descripción del diagnóstico"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Se autocompletará al seleccionar código CIE-10
                  </p>
                </div>
              </div>
            </div>

            {/* Diagnósticos Secundarios */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Diagnósticos Secundarios
              </label>
              <input
                type="text"
                name="diagnosticos_secundarios"
                value={datosConsulta.diagnosticos_secundarios}
                onChange={handleInputChange}
                placeholder="Diagnósticos adicionales"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Tratamiento */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tratamiento *
            </label>
            <textarea
              name="tratamiento"
              value={datosConsulta.tratamiento}
              onChange={handleInputChange}
              rows="3"
              placeholder="Plan de tratamiento, medidas generales..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Indicaciones */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Indicaciones
            </label>
            <textarea
              name="indicaciones"
              value={datosConsulta.indicaciones}
              onChange={handleInputChange}
              rows="3"
              placeholder="Indicaciones al paciente, recomendaciones..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Exámenes Solicitados */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Exámenes Solicitados
              </label>
              <textarea
                name="examenes_solicitados"
                value={datosConsulta.examenes_solicitados}
                onChange={handleInputChange}
                rows="2"
                placeholder="Laboratorios, imágenes, otros estudios..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Pronóstico */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pronóstico
              </label>
              <select
                name="pronostico"
                value={datosConsulta.pronostico}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Seleccionar...</option>
                <option value="Excelente">Excelente</option>
                <option value="Bueno">Bueno</option>
                <option value="Regular">Regular</option>
                <option value="Reservado">Reservado</option>
                <option value="Grave">Grave</option>
              </select>
            </div>
          </div>

          {/* Observaciones */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observaciones Adicionales
            </label>
            <textarea
              name="observaciones"
              value={datosConsulta.observaciones}
              onChange={handleInputChange}
              rows="2"
              placeholder="Cualquier observación adicional..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Botones de navegación entre tabs */}
        <div className="mt-6 flex gap-3 justify-end items-center">
          <button
            onClick={async () => {
              const guardadoExitoso = await guardarConsulta();
              if (guardadoExitoso) {
                setTabActiva('prescripcion');
              }
            }}
            disabled={guardando}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 font-semibold transition-all shadow-md"
          >
            <Save className="w-5 h-5" />
            {guardando ? 'Guardando...' : 'Guardar y Siguiente'}
          </button>
        </div>
            </div>
          )}

          {/* TAB 2: Prescripción de Medicamentos */}
          {tabActiva === 'prescripcion' && (
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Pill className="w-6 h-6 text-orange-600" />
                Prescripción de Medicamentos
              </h3>

        <div className="space-y-4 mb-6">
          {medicamentos.map((med, index) => (
            <div key={index} className="border-2 border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-700">Medicamento {index + 1}</h4>
                {medicamentos.length > 1 && (
                  <button
                    onClick={() => eliminarMedicamento(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* RF-003: Autocomplete medicamentos */}
                <div className="lg:col-span-2 relative" data-autocomplete-medicamento={index}>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Nombre del Medicamento * {buscandoMedicamentos[index] && '🔍'}
                  </label>
                  <input
                    type="text"
                    value={med.nombre}
                    onChange={(e) => {
                      handleMedicamentoChange(index, 'nombre', e.target.value);
                      buscarMedicamentosAutocomplete(e.target.value, index);
                    }}
                    onFocus={() => {
                      if (sugerenciasMedicamentos[index]?.length > 0) {
                        setMostrarSugerenciasMedicamentos(prev => ({ ...prev, [index]: true }));
                      }
                    }}
                    placeholder="Buscar medicamento..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                  
                  {/* Dropdown de sugerencias */}
                  {mostrarSugerenciasMedicamentos[index] && sugerenciasMedicamentos[index]?.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                      {sugerenciasMedicamentos[index].map((medicamento) => (
                        <button
                          key={medicamento.id}
                          type="button"
                          onClick={() => seleccionarMedicamento(medicamento, index)}
                          className="w-full text-left px-4 py-2 hover:bg-orange-50 dark:hover:bg-orange-900/30 border-b border-gray-200 dark:border-gray-700 last:border-0 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-800 dark:text-gray-200 font-medium">
                              {medicamento.nombre}
                            </span>
                            <span className="text-xs text-green-600 dark:text-green-400">
                              Stock: {medicamento.stock}
                            </span>
                          </div>
                          {medicamento.contenido && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {medicamento.contenido}
                            </p>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Dosis
                  </label>
                  <input
                    type="text"
                    value={med.dosis}
                    onChange={(e) => handleMedicamentoChange(index, 'dosis', e.target.value)}
                    placeholder="Ej: 1 tableta"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Frecuencia
                  </label>
                  <input
                    type="text"
                    value={med.frecuencia}
                    onChange={(e) => handleMedicamentoChange(index, 'frecuencia', e.target.value)}
                    placeholder="Ej: Cada 8 horas"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Duración
                  </label>
                  <input
                    type="text"
                    value={med.duracion}
                    onChange={(e) => handleMedicamentoChange(index, 'duracion', e.target.value)}
                    placeholder="Ej: 7 días"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
                <div className="md:col-span-2 lg:col-span-5">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Vía de Administración
                  </label>
                  <select
                    value={med.via}
                    onChange={(e) => handleMedicamentoChange(index, 'via', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="">Seleccionar vía...</option>
                    <option value="Oral">Oral</option>
                    <option value="Sublingual">Sublingual</option>
                    <option value="Intravenosa">Intravenosa</option>
                    <option value="Intramuscular">Intramuscular</option>
                    <option value="Subcutánea">Subcutánea</option>
                    <option value="Tópica">Tópica</option>
                    <option value="Inhalatoria">Inhalatoria</option>
                    <option value="Oftálmica">Oftálmica</option>
                    <option value="Ótica">Ótica</option>
                    <option value="Rectal">Rectal</option>
                    <option value="Vaginal">Vaginal</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={agregarMedicamento}
          className="mb-6 px-4 py-2 border-2 border-dashed border-orange-300 text-orange-600 rounded-lg hover:bg-orange-50 transition-colors flex items-center gap-2 font-semibold"
        >
          <Plus className="w-5 h-5" />
          Agregar Otro Medicamento
        </button>

        {/* Indicaciones de la Receta */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Indicaciones para la Receta
          </label>
          <textarea
            value={indicacionesReceta}
            onChange={(e) => setIndicacionesReceta(e.target.value)}
            rows="3"
            placeholder="Indicaciones específicas para la toma de medicamentos..."
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>

        {/* RF-003: Programación de Seguimiento */}
        <div className="mt-6 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-5 bg-blue-50 dark:bg-blue-900/20">
          <div className="flex items-center gap-2 mb-4">
            <input
              type="checkbox"
              id="programar-seguimiento"
              checked={seguimiento.programar}
              onChange={(e) => setSeguimiento(prev => ({ ...prev, programar: e.target.checked }))}
              className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <label htmlFor="programar-seguimiento" className="text-lg font-semibold text-blue-700 dark:text-blue-400 cursor-pointer flex items-center gap-2">
              <Calendar className="w-6 h-6" />
              Programar Cita de Seguimiento
            </label>
          </div>

          {seguimiento.programar && (
            <div className="mt-4 space-y-4 pl-7">
              <p className="text-sm text-blue-600 dark:text-blue-400 mb-3">
                Se agendará automáticamente una cita de control para evaluar el progreso del paciente
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Especialidad *
                  </label>
                  <select
                    value={seguimiento.especialidad}
                    onChange={(e) => setSeguimiento(prev => ({ ...prev, especialidad: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Seleccionar especialidad...</option>
                    <option value="Medicina General">Medicina General</option>
                    <option value="Cardiología">Cardiología</option>
                    <option value="Pediatría">Pediatría</option>
                    <option value="Ginecología">Ginecología</option>
                    <option value="Traumatología">Traumatología</option>
                    <option value="Dermatología">Dermatología</option>
                    <option value="Oftalmología">Oftalmología</option>
                    <option value="Otorrinolaringología">Otorrinolaringología</option>
                    <option value="Neurología">Neurología</option>
                    <option value="Psiquiatría">Psiquiatría</option>
                    <option value="Urología">Urología</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Fecha Propuesta *
                  </label>
                  <input
                    type="date"
                    value={seguimiento.fecha}
                    onChange={(e) => setSeguimiento(prev => ({ ...prev, fecha: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Hora *
                  </label>
                  <input
                    type="time"
                    value={seguimiento.hora}
                    onChange={(e) => setSeguimiento(prev => ({ ...prev, hora: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Observaciones para Seguimiento
                  </label>
                  <textarea
                    value={seguimiento.observaciones}
                    onChange={(e) => setSeguimiento(prev => ({ ...prev, observaciones: e.target.value }))}
                    rows="2"
                    placeholder="Motivo de la cita de control..."
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RF-003: Botones de Comprobante de Asistencia */}
        {consultaActual && (
          <div className="mt-6 border-t-2 border-gray-200 dark:border-gray-700 pt-6">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <FileText className="w-5 h-5 text-green-600" />
              Comprobante de Asistencia
            </h4>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => generarComprobante(consultaActual.id, false)}
                disabled={generandoComprobante}
                className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold transition-colors shadow-md"
              >
                {generandoComprobante ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Generando...
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    Descargar Comprobante PDF
                  </>
                )}
              </button>

              <button
                onClick={() => generarComprobante(consultaActual.id, true)}
                disabled={generandoComprobante}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 font-semibold transition-colors shadow-md"
              >
                <Mail className="w-5 h-5" />
                Enviar por Email
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              * El comprobante incluye datos de la consulta, paciente y médico tratante
            </p>
          </div>
        )}

        {/* Navegación entre tabs */}
        <div className="mt-6 flex gap-3 justify-between">
          <button
            onClick={() => setTabActiva('consulta')}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2 font-semibold transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Volver a Consulta
          </button>
          
          <button
            onClick={() => setTabActiva('finalizacion')}
            className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 flex items-center gap-2 font-semibold transition-all shadow-md"
          >
            Siguiente: Finalizar
            <Send className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 text-center">
          * Complete todos los medicamentos antes de continuar
        </p>
            </div>
          )}

          {/* TAB 3: Finalización y Acciones */}
          {tabActiva === 'finalizacion' && (
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Send className="w-6 h-6 text-green-600" />
                Finalizar Consulta
              </h3>

              <div className="space-y-6">
                {/* Resumen de la consulta */}
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-6 border-2 border-blue-200">
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    Resumen de la Consulta
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600 font-medium">Diagnóstico:</p>
                      <p className="text-gray-800">{datosConsulta.diagnostico || 'No especificado'}</p>
                    </div>
                    {datosConsulta.diagnostico_codigo && (
                      <div>
                        <p className="text-gray-600 font-medium">Código CIE-10:</p>
                        <p className="text-gray-800 font-mono">{datosConsulta.diagnostico_codigo}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-gray-600 font-medium">Tratamiento:</p>
                      <p className="text-gray-800">{datosConsulta.tratamiento || 'No especificado'}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 font-medium">Pronóstico:</p>
                      <p className="text-gray-800">{datosConsulta.pronostico || 'No especificado'}</p>
                    </div>
                  </div>
                </div>

                {/* Resumen de medicamentos */}
                {medicamentos.some(m => m.nombre.trim() !== '') && (
                  <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-6 border-2 border-orange-200">
                    <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <Pill className="w-5 h-5 text-orange-600" />
                      Medicamentos Prescritos ({medicamentos.filter(m => m.nombre.trim() !== '').length})
                    </h4>
                    <div className="space-y-2">
                      {medicamentos.filter(m => m.nombre.trim() !== '').map((med, index) => (
                        <div key={index} className="bg-white rounded-lg p-3 border border-orange-200">
                          <p className="font-semibold text-gray-800">{index + 1}. {med.nombre}</p>
                          <p className="text-sm text-gray-600">
                            {med.dosis} | {med.frecuencia} | {med.duracion} | Vía: {med.via}
                          </p>
                        </div>
                      ))}
                    </div>
                    {indicacionesReceta && (
                      <div className="mt-3 p-3 bg-white rounded-lg border border-orange-200">
                        <p className="text-sm font-medium text-gray-700">Indicaciones:</p>
                        <p className="text-sm text-gray-600">{indicacionesReceta}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* RF-003: Seguimiento programado */}
                {seguimiento.programar && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border-2 border-blue-200">
                    <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      Cita de Seguimiento Programada
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-gray-600 font-medium">Especialidad:</p>
                        <p className="text-gray-800">{seguimiento.especialidad}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 font-medium">Fecha:</p>
                        <p className="text-gray-800">{new Date(seguimiento.fecha).toLocaleDateString('es-ES')}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 font-medium">Hora:</p>
                        <p className="text-gray-800">{seguimiento.hora}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 font-medium">Observaciones:</p>
                        <p className="text-gray-800">{seguimiento.observaciones || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Botones de finalización */}
                <div className="bg-white rounded-lg p-6 border-2 border-gray-200">
                  <h4 className="font-semibold text-gray-800 mb-4">Acciones de Finalización</h4>
                  
                  <div className="space-y-3">
                    <button
                      onClick={finalizarYPrescribir}
                      disabled={guardando || medicamentos.filter(m => m.nombre.trim() !== '').length === 0}
                      className="w-full bg-gradient-to-r from-orange-600 to-orange-700 text-white px-6 py-4 rounded-lg hover:from-orange-700 hover:to-orange-800 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold transition-all shadow-lg"
                    >
                      {guardando ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          Procesando...
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          Finalizar y Enviar Receta a Farmacia
                        </>
                      )}
                    </button>

                    <button
                      onClick={finalizarSinReceta}
                      disabled={guardando}
                      className="w-full px-6 py-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold transition-colors"
                    >
                      <Save className="w-5 h-5" />
                      Finalizar Sin Prescribir Medicamentos
                    </button>
                  </div>

                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 text-center">
                    * Al finalizar, la consulta se guardará y la cita se marcará como completada
                  </p>
                </div>

                {/* RF-003: Comprobante de asistencia */}
                {consultaActual && (
                  <div className="bg-green-50 rounded-lg p-6 border-2 border-green-200">
                    <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-green-600" />
                      Comprobante de Asistencia
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <button
                        onClick={() => generarComprobante(consultaActual.id, false)}
                        disabled={generandoComprobante}
                        className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold transition-colors shadow-md"
                      >
                        {generandoComprobante ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            Generando...
                          </>
                        ) : (
                          <>
                            <Download className="w-5 h-5" />
                            Descargar PDF
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => generarComprobante(consultaActual.id, true)}
                        disabled={generandoComprobante}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold transition-colors shadow-md"
                      >
                        <Mail className="w-5 h-5" />
                        Enviar por Email
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-3 text-center">
                      El comprobante incluye datos de la consulta, paciente y médico tratante
                    </p>
                  </div>
                )}

                {/* Navegación */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setTabActiva('prescripcion')}
                    className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2 font-semibold transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    Volver a Prescripción
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConsultaMedica;
