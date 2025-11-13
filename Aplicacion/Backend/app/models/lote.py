from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Date, Numeric
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base, SoftDeleteMixin

class Lote(Base, SoftDeleteMixin):
    """
    RF-004: Modelo para gestión de lotes de medicamentos
    Permite trazabilidad completa, control de vencimientos y ubicación física
    """
    __tablename__ = "lotes"

    id = Column(Integer, primary_key=True, index=True)
    medicamento_id = Column(Integer, ForeignKey("medicamentos.id", ondelete="CASCADE"), nullable=False)
    numero_lote = Column(String(50), unique=True, nullable=False, index=True)
    fecha_ingreso = Column(Date, default=datetime.utcnow, nullable=False)
    fecha_vencimiento = Column(Date, nullable=False)
    cantidad_inicial = Column(Integer, nullable=False)  # Cantidad al ingresar
    cantidad_disponible = Column(Integer, nullable=False)  # Cantidad actual
    ubicacion_fisica = Column(String(100), nullable=True)  # Ej: "Estantería A, Nivel 2"
    proveedor = Column(String(150), nullable=True)
    numero_factura = Column(String(50), nullable=True)
    costo_unitario = Column(Numeric(10, 2), nullable=True)  # Precio por unidad
    estado = Column(String(30), default="disponible")  # disponible, proximo_a_vencer, vencido, agotado
    observaciones = Column(String(255), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relaciones
    medicamento = relationship("Medicamento", back_populates="lotes")
    recetas = relationship("Receta", back_populates="lote_obj", foreign_keys="Receta.lote_id")

    def __repr__(self):
        return f"<Lote {self.numero_lote} - {self.medicamento_id}>"
    
    def calcular_estado(self):
        """
        Calcula el estado del lote basado en fecha de vencimiento y cantidad
        """
        from datetime import date, timedelta
        
        hoy = date.today()
        dias_para_vencer = (self.fecha_vencimiento - hoy).days
        
        if self.cantidad_disponible <= 0:
            return "agotado"
        elif self.fecha_vencimiento < hoy:
            return "vencido"
        elif dias_para_vencer <= 30:  # Menos de 30 días para vencer
            return "proximo_a_vencer"
        else:
            return "disponible"
