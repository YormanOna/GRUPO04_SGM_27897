from sqlalchemy import Column, Integer, ForeignKey, DateTime, String
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base, SoftDeleteMixin

class Asistencia(Base, SoftDeleteMixin):
    """
    Modelo para registro de asistencia de empleados
    Permite controlar entrada/salida del personal
    """
    __tablename__ = "asistencias"

    id = Column(Integer, primary_key=True, index=True)
    empleado_id = Column(Integer, ForeignKey("empleados.id"), nullable=False)
    fecha_entrada = Column(DateTime, default=datetime.utcnow, nullable=False)
    fecha_salida = Column(DateTime, nullable=True)
    tipo_registro = Column(String(20), default="entrada")  # entrada, salida
    observaciones = Column(String(255), nullable=True)

    # Relación con Empleado
    empleado = relationship("Empleado", back_populates="asistencias", foreign_keys=[empleado_id])

    def __repr__(self):
        return f"<Asistencia {self.empleado_id} - {self.fecha_entrada}>"
