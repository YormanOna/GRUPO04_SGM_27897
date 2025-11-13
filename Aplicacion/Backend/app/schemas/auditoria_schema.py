from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, Dict, Any

class AuditoriaBase(BaseModel):
    usuario_id: Optional[int] = None
    usuario_nombre: Optional[str] = None
    usuario_cargo: Optional[str] = None
    accion: str = Field(..., description="CREATE, UPDATE, DELETE, LOGIN, LOGOUT, etc.")
    modulo: str = Field(..., description="Módulo del sistema: Pacientes, Citas, etc.")
    descripcion: str = Field(..., description="Descripción detallada de la acción")
    tabla_afectada: Optional[str] = None
    registro_id: Optional[int] = None
    datos_anteriores: Optional[Dict[str, Any]] = None
    datos_nuevos: Optional[Dict[str, Any]] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    estado: str = Field(default="exitoso", description="exitoso, fallido, advertencia")
    detalles_adicionales: Optional[Dict[str, Any]] = None

class AuditoriaCreate(AuditoriaBase):
    pass

class AuditoriaResponse(AuditoriaBase):
    id: int
    fecha_hora: datetime

    class Config:
        orm_mode = True
        from_attributes = True

class AuditoriaFilter(BaseModel):
    fecha_desde: Optional[str] = None
    fecha_hasta: Optional[str] = None
    usuario_id: Optional[int] = None
    accion: Optional[str] = None
    modulo: Optional[str] = None
    estado: Optional[str] = None
