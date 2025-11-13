from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date

class RecetaBase(BaseModel):
    medicamentos: str
    indicaciones: Optional[str] = None

class RecetaCreate(RecetaBase):
    consulta_id: int
    paciente_id: int
    medico_id: int

class RecetaOut(RecetaBase):
    id: int
    consulta_id: int
    medico_id: int
    paciente_id: int
    fecha_emision: datetime
    estado: str
    dispensada_por: Optional[int]
    fecha_dispensacion: Optional[datetime]
    observaciones: Optional[str]
    lote: Optional[str]
    fecha_vencimiento: Optional[date]  # Corregido: debe ser date, no datetime
    
    # Campos adicionales para farmacéuticos
    paciente_nombre: Optional[str] = None
    paciente_cedula: Optional[int] = None
    medico_nombre: Optional[str] = None
    farmaceutico_nombre: Optional[str] = None

    class Config:
        orm_mode = True

class RecetaDispensar(BaseModel):
    """Schema para dispensar receta"""
    observaciones: Optional[str] = None
    estado: str = "dispensada"  # dispensada, parcial
    lote: Optional[str] = None  # Número de lote del medicamento
    fecha_vencimiento: Optional[str] = None  # Fecha de vencimiento (YYYY-MM-DD)
