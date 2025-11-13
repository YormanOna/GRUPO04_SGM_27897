from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base, SoftDeleteMixin

class Consulta(Base, SoftDeleteMixin):
    __tablename__ = "consultas"

    id = Column(Integer, primary_key=True, index=True)
    
    # Relaciones principales
    cita_id = Column(Integer, ForeignKey("citas.id"), nullable=True)
    historia_id = Column(Integer, ForeignKey("historias.id"), nullable=True)
    paciente_id = Column(Integer, ForeignKey("pacientes.id"), nullable=True)
    medico_id = Column(Integer, ForeignKey("empleados.id"), nullable=True)
    
    # Signos vitales como JSON
    signos_vitales = Column(JSON, nullable=True)
    
    # Datos de la consulta
    motivo_consulta = Column(Text, nullable=True)  # Por qué vino el paciente
    enfermedad_actual = Column(Text, nullable=True)  # Historia de enfermedad actual
    examen_fisico = Column(Text, nullable=True)  # Hallazgos del examen físico
    diagnostico = Column(String(255), nullable=True)  # Diagnóstico principal (descripción)
    diagnostico_codigo = Column(String(10), nullable=True)  # Código CIE-10 del diagnóstico principal
    diagnosticos_secundarios = Column(Text, nullable=True)  # Otros diagnósticos
    tratamiento = Column(Text, nullable=True)  # Plan de tratamiento
    indicaciones = Column(Text, nullable=True)  # Indicaciones médicas
    examenes_solicitados = Column(Text, nullable=True)  # Exámenes de laboratorio/imagen
    pronostico = Column(String(100), nullable=True)  # Pronóstico del paciente
    observaciones = Column(Text, nullable=True)  # Observaciones adicionales
    
    fecha_consulta = Column(DateTime, default=datetime.utcnow)

    # Relaciones
    cita = relationship("Cita", back_populates="consultas")
    medico_empleado = relationship("Empleado", back_populates="consultas", foreign_keys=[medico_id])
    historia = relationship("Historia", back_populates="consultas")
    paciente = relationship("Paciente", back_populates="consultas")
    recetas = relationship("Receta", back_populates="consulta", foreign_keys="Receta.consulta_id")
    signos_vitales_registro = relationship("SignosVitales", back_populates="consulta", cascade="all, delete-orphan")
    diagnosticos_cie10 = relationship("ConsultaDiagnostico", back_populates="consulta", cascade="all, delete-orphan")
