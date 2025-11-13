from sqlalchemy import Column, Integer, String, BigInteger, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base, SoftDeleteMixin

class Medico(Base, SoftDeleteMixin):
    """
    Modelo para Médico que hereda de Empleado.
    Según el diagrama, Médico es una especialización de Empleado.
    """
    __tablename__ = "medicos"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    apellido = Column(String(100), nullable=False)
    cedula = Column(BigInteger, unique=True, nullable=False)
    especialidad = Column(String(100), nullable=True)
    email = Column(String(150), unique=True, nullable=True)
    
    # Si se quiere relacionar con Empleado (herencia)
    empleado_id = Column(Integer, ForeignKey("empleados.id"), nullable=True)
    
    # Relación con Empleado (bidireccional)
    empleado = relationship("Empleado", back_populates="perfil_medico", foreign_keys=[empleado_id])
    
    # Relación con Citas (1 Médico -> N Citas)
    citas = relationship("Cita", back_populates="medico", cascade="all, delete-orphan")
