from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class AsistenciaBase(BaseModel):
    observaciones: Optional[str] = None

class AsistenciaCreate(AsistenciaBase):
    empleado_id: int
    tipo_registro: str = "entrada"  # entrada, salida

class AsistenciaOut(AsistenciaBase):
    id: int
    empleado_id: int
    fecha_entrada: datetime
    fecha_salida: Optional[datetime]
    tipo_registro: str

    class Config:
        orm_mode = True

class AsistenciaRegistroSalida(BaseModel):
    """Schema para registrar salida"""
    observaciones: Optional[str] = None
