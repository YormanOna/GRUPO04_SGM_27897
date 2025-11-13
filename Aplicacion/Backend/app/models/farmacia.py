from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base, SoftDeleteMixin

class Farmacia(Base, SoftDeleteMixin):
    __tablename__ = "farmacias"

    id = Column(Integer, primary_key=True, index=True)
    nombre_farmacia = Column(String(150), nullable=False)  # Nombre del establecimiento
    direccion = Column(String(255), nullable=True)
    telefono = Column(String(20), nullable=True)

    # Relación con Empleado (Farmacéutico) - N:1
    farmaceutico_id = Column(Integer, ForeignKey("empleados.id"), nullable=True)
    farmaceutico = relationship("Empleado", back_populates="farmacias_a_cargo", foreign_keys=[farmaceutico_id])
    
    # Relación 1:N con medicamentos
    medicamentos = relationship("Medicamento", back_populates="farmacia", cascade="all, delete-orphan")
