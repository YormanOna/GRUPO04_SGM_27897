from sqlalchemy import Column, Integer, String, DateTime, Text, JSON, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base, SoftDeleteMixin

class Auditoria(Base, SoftDeleteMixin):
    __tablename__ = "auditoria"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("empleados.id", ondelete="SET NULL"), nullable=True)  # ID del empleado que realiza la acción
    usuario_nombre = Column(String(200), nullable=True)  # Nombre completo para referencia rápida
    usuario_cargo = Column(String(50), nullable=True)  # Cargo del usuario
    accion = Column(String(100), nullable=False)  # CREATE, UPDATE, DELETE, LOGIN, LOGOUT, etc.
    modulo = Column(String(100), nullable=False)  # Pacientes, Citas, Consultas, etc.
    descripcion = Column(Text, nullable=False)  # Descripción detallada de la acción
    tabla_afectada = Column(String(100), nullable=True)  # Nombre de la tabla afectada
    registro_id = Column(Integer, nullable=True)  # ID del registro afectado
    datos_anteriores = Column(JSON, nullable=True)  # Datos antes del cambio (para UPDATE/DELETE)
    datos_nuevos = Column(JSON, nullable=True)  # Datos después del cambio (para CREATE/UPDATE)
    ip_address = Column(String(50), nullable=True)  # IP desde donde se realizó la acción
    user_agent = Column(String(500), nullable=True)  # Navegador/dispositivo usado
    estado = Column(String(20), default='exitoso')  # exitoso, fallido, advertencia
    fecha_hora = Column(DateTime, default=datetime.utcnow, nullable=False)
    detalles_adicionales = Column(JSON, nullable=True)  # Información extra en formato JSON

    # Relaciones
    usuario = relationship("Empleado", back_populates="auditorias", foreign_keys=[usuario_id])

    def __repr__(self):
        return f"<Auditoria {self.id}: {self.usuario_nombre} - {self.accion} en {self.modulo}>"
