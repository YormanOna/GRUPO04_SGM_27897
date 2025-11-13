from sqlalchemy import Column, Integer, Float, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base, SoftDeleteMixin

class SignosVitales(Base, SoftDeleteMixin):
    """
    Modelo de signos vitales con relaciones a paciente, consulta y enfermera.
    NOTA: Los signos vitales también se pueden almacenar como JSON en consultas.
    Esta tabla permite un registro más estructurado y trazable.
    """
    __tablename__ = "signos_vitales"

    id = Column(Integer, primary_key=True, index=True)
    
    # Relaciones con otras entidades
    paciente_id = Column(Integer, ForeignKey("pacientes.id"), nullable=False, index=True)
    consulta_id = Column(Integer, ForeignKey("consultas.id"), nullable=True, index=True)
    enfermera_id = Column(Integer, ForeignKey("empleados.id"), nullable=True, index=True)
    
    # Signos vitales básicos
    presion_arterial = Column(String(20), nullable=True)  # Ej: "120/80"
    presion = Column(Float, nullable=True)  # Mantener por compatibilidad
    frecuencia_cardiaca = Column(Integer, nullable=True)  # Pulso (latidos por minuto)
    frecuencia_respiratoria = Column(Integer, nullable=True)  # Respiraciones por minuto
    temperatura = Column(Float, nullable=True)  # En grados Celsius
    saturacion_oxigeno = Column(Float, nullable=True)  # Porcentaje de SpO2
    peso = Column(Float, nullable=True)  # En kilogramos
    talla = Column(Float, nullable=True)  # En metros o centímetros
    imc = Column(Float, nullable=True)  # Índice de masa corporal (calculado)
    
    # Campos adicionales
    observaciones = Column(String(500), nullable=True)  # Observaciones de enfermería
    fecha_registro = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relaciones
    paciente = relationship("Paciente", back_populates="signos_vitales")
    consulta = relationship("Consulta", back_populates="signos_vitales_registro")
    enfermera = relationship("Empleado", back_populates="signos_vitales_registrados", foreign_keys=[enfermera_id])
