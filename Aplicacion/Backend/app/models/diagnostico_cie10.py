from sqlalchemy import Column, Integer, String, Text, ForeignKey, Table
from sqlalchemy.orm import relationship
from app.core.database import Base, SoftDeleteMixin

class ConsultaDiagnostico(Base):
    """
    Tabla intermedia para la relación N:M entre Consulta y DiagnosticoCIE10
    Permite que una consulta tenga múltiples diagnósticos
    """
    __tablename__ = "consulta_diagnosticos"
    
    id = Column(Integer, primary_key=True, index=True)
    consulta_id = Column(Integer, ForeignKey("consultas.id"), nullable=False)
    diagnostico_id = Column(Integer, ForeignKey("diagnosticos_cie10.id"), nullable=False)
    tipo = Column(String(20), default="secundario")  # principal, secundario, diferencial
    observaciones = Column(Text, nullable=True)
    
    # Relaciones
    consulta = relationship("Consulta", back_populates="diagnosticos_cie10")
    diagnostico = relationship("DiagnosticoCIE10", back_populates="consultas_asociadas")

class DiagnosticoCIE10(Base, SoftDeleteMixin):
    __tablename__ = "diagnosticos_cie10"

    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String(10), unique=True, index=True, nullable=False)
    descripcion = Column(Text, nullable=False)
    categoria = Column(String(100))  # Ej: "Enfermedades infecciosas", "Sistema respiratorio"
    
    # Relación N:M con Consultas a través de ConsultaDiagnostico
    consultas_asociadas = relationship("ConsultaDiagnostico", back_populates="diagnostico")
