from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base, SoftDeleteMixin

class Historia(Base, SoftDeleteMixin):
    __tablename__ = "historias"

    id = Column(Integer, primary_key=True, index=True)
    identificador = Column(String(50), unique=True, nullable=False)
    fecha_creacion = Column(DateTime, default=datetime.utcnow)

    # Relación 1:N con Consultas
    consultas = relationship("Consulta", back_populates="historia", cascade="all, delete-orphan")
    
    # Relación 1:1 con Paciente
    paciente = relationship("Paciente", back_populates="historia", uselist=False)
