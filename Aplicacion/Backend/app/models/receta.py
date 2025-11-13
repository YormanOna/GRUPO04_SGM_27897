from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Boolean, Date
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base, SoftDeleteMixin

class Receta(Base, SoftDeleteMixin):
    """
    Modelo para prescripciones médicas (recetas)
    Permite gestionar medicamentos prescritos por el médico
    """
    __tablename__ = "recetas"

    id = Column(Integer, primary_key=True, index=True)
    consulta_id = Column(Integer, ForeignKey("consultas.id"), nullable=False)
    medico_id = Column(Integer, ForeignKey("empleados.id"), nullable=False)
    paciente_id = Column(Integer, ForeignKey("pacientes.id"), nullable=False)
    fecha_emision = Column(DateTime, default=datetime.utcnow, nullable=False)
    medicamentos = Column(Text, nullable=False)  # Lista de medicamentos en formato JSON o texto
    indicaciones = Column(Text, nullable=True)
    estado = Column(String(50), default="pendiente")  # pendiente, dispensada, parcial, cancelada
    dispensada_por = Column(Integer, ForeignKey("empleados.id"), nullable=True)  # Farmacéutico
    fecha_dispensacion = Column(DateTime, nullable=True)
    observaciones = Column(Text, nullable=True)
    # Información detallada de dispensación (RF-002 y RF-004)
    lote = Column(String(50), nullable=True)  # Número de lote del medicamento (legacy)
    lote_id = Column(Integer, ForeignKey("lotes.id", ondelete="SET NULL"), nullable=True)  # RF-004: Relación con lote
    fecha_vencimiento = Column(Date, nullable=True)  # Fecha de vencimiento del medicamento

    # Relaciones
    consulta = relationship("Consulta", back_populates="recetas", foreign_keys=[consulta_id])
    medico = relationship("Empleado", back_populates="recetas_emitidas", foreign_keys=[medico_id])
    paciente = relationship("Paciente", back_populates="recetas", foreign_keys=[paciente_id])
    farmaceutico = relationship("Empleado", back_populates="recetas_dispensadas", foreign_keys=[dispensada_por])
    lote_obj = relationship("Lote", back_populates="recetas", foreign_keys=[lote_id])

    def __repr__(self):
        return f"<Receta {self.id} - Paciente: {self.paciente_id}>"
