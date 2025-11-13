from sqlalchemy import Column, Integer, String, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base, SoftDeleteMixin

class Medicamento(Base, SoftDeleteMixin):
    """
    RF-004: Modelo extendido de Medicamento con catálogo completo
    """
    __tablename__ = "medicamentos"

    id = Column(Integer, primary_key=True, index=True)
    
    # Campos básicos
    nombre = Column(String(150), nullable=False, index=True)
    stock = Column(Integer, default=0)
    contenido = Column(String(100), nullable=True)  # "500mg", "100ml", etc.
    
    # RF-004: Campos del catálogo extendido
    codigo_interno = Column(String(50), unique=True, nullable=True, index=True)  # Código interno del hospital
    principio_activo = Column(String(200), nullable=True)  # Componente activo
    nombre_comercial = Column(String(150), nullable=True)  # Nombre de marca
    concentracion = Column(String(50), nullable=True)  # "500mg", "10mg/ml"
    forma_farmaceutica = Column(String(50), nullable=True)  # "Tableta", "Jarabe", "Inyectable"
    categoria_terapeutica = Column(String(100), nullable=True)  # "Antibiótico", "Analgésico", etc.
    indicaciones = Column(Text, nullable=True)  # Usos principales
    contraindicaciones = Column(Text, nullable=True)  # Cuándo no usar
    efectos_secundarios = Column(Text, nullable=True)  # Efectos adversos comunes
    dosis_recomendada = Column(String(200), nullable=True)  # "1 tableta cada 8 horas"
    
    # Farmacia
    farmacia_id = Column(Integer, ForeignKey("farmacias.id", ondelete="SET NULL"), nullable=True)
    farmacia = relationship("Farmacia", back_populates="medicamentos")
    
    # RF-004: Relación con lotes
    lotes = relationship("Lote", back_populates="medicamento", cascade="all, delete-orphan")
