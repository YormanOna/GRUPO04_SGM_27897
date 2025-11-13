from sqlalchemy import Column, Integer, String, BigInteger, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.core.database import Base, SoftDeleteMixin
import enum

class EstadoEmpleado(enum.Enum):
    """Estados posibles para un empleado"""
    ACTIVO = "Activo"
    INACTIVO = "Inactivo"
    SUSPENDIDO = "Suspendido"
    VACACIONES = "Vacaciones"
    LICENCIA_MEDICA = "Licencia Médica"

class Empleado(Base, SoftDeleteMixin):
    """
    Modelo base para empleados del sistema médico.
    Tipos de cargo: 'Admin General', 'Administrador', 'Médico', 'Enfermera', 'Farmacéutico'
    
    - Admin General: Acceso total al sistema, gestión de usuarios y configuración
    - Administrador: Recepcionista, gestión de citas y pacientes
    - Médico: Consultas médicas y recetas
    - Enfermera: Signos vitales y asistencia
    - Farmacéutico: Gestión de medicamentos y recetas
    """
    __tablename__ = "empleados"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    apellido = Column(String(100), nullable=False)
    cedula = Column(BigInteger, unique=True, nullable=False)
    cargo = Column(String(50), nullable=False)  # Admin General, Administrador, Médico, Enfermera, Farmacéutico
    email = Column(String(150), unique=True, nullable=True)
    telefono = Column(String(20), nullable=True)
    hashed_password = Column(String(255), nullable=True)
    
    # Estado del empleado (diferente del borrado lógico)
    estado = Column(SQLEnum(EstadoEmpleado), default=EstadoEmpleado.ACTIVO, nullable=False, index=True)

    # Relaciones
    # Consultas donde el empleado actúa como médico
    consultas = relationship("Consulta", back_populates="medico_empleado", foreign_keys="Consulta.medico_id", cascade="all, delete-orphan")
    
    # Citas donde el empleado es el encargado administrativo
    citas = relationship("Cita", back_populates="encargado", foreign_keys="Cita.encargado_id", cascade="all, delete-orphan")
    
    # Recetas emitidas como médico
    recetas_emitidas = relationship("Receta", back_populates="medico", foreign_keys="Receta.medico_id")
    
    # Recetas dispensadas como farmacéutico
    recetas_dispensadas = relationship("Receta", back_populates="farmaceutico", foreign_keys="Receta.dispensada_por")
    
    # Asistencias del empleado
    asistencias = relationship("Asistencia", back_populates="empleado", cascade="all, delete-orphan")
    
    # Auditorías realizadas por el empleado
    auditorias = relationship("Auditoria", back_populates="usuario", foreign_keys="Auditoria.usuario_id")
    
    # Signos vitales registrados (cuando es enfermera)
    signos_vitales_registrados = relationship("SignosVitales", back_populates="enfermera", foreign_keys="SignosVitales.enfermera_id")
    
    # Relaciones con tablas que referencian a empleado
    farmacias_a_cargo = relationship("Farmacia", back_populates="farmaceutico", foreign_keys="Farmacia.farmaceutico_id")
    perfil_medico = relationship("Medico", back_populates="empleado", foreign_keys="Medico.empleado_id", uselist=False)
