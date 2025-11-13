from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Time
from sqlalchemy.orm import relationship
from datetime import datetime, time
from app.core.database import Base, SoftDeleteMixin

class Cita(Base, SoftDeleteMixin):
    __tablename__ = "citas"

    id = Column(Integer, primary_key=True, index=True)
    fecha = Column(DateTime, nullable=False)
    hora_inicio = Column(String(10), nullable=True)  # Formato "09:00"
    hora_fin = Column(String(10), nullable=True)  # Formato "09:30"
    motivo = Column(String(255), nullable=True)
    estado = Column(String(50), default="programada")  # programada, confirmada, en_espera, en_consulta, completada, cancelada, no_asistio
    observaciones_cancelacion = Column(Text, nullable=True)  # Motivo de cancelación
    sala_asignada = Column(String(50), nullable=True)  # Sala o consultorio asignado
    tipo_cita = Column(String(50), default="consulta")  # consulta, seguimiento, emergencia

    # Relación con Paciente (N:1)
    paciente_id = Column(Integer, ForeignKey("pacientes.id"), nullable=False)
    paciente = relationship("Paciente", back_populates="citas")

    # Relación con Médico (N:1)
    medico_id = Column(Integer, ForeignKey("medicos.id"), nullable=True)
    medico = relationship("Medico", back_populates="citas")

    # Relación con Empleado encargado/administrativo (N:1)
    encargado_id = Column(Integer, ForeignKey("empleados.id"), nullable=True)
    encargado = relationship("Empleado", back_populates="citas", foreign_keys=[encargado_id])
    
    # Relación con Consultas (1:N)
    consultas = relationship("Consulta", back_populates="cita")
