from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from .signos_vitales_schema import SignosVitalesOut

class ConsultaBase(BaseModel):
    motivo_consulta: Optional[str] = None
    enfermedad_actual: Optional[str] = None
    examen_fisico: Optional[str] = None
    diagnostico: Optional[str] = None
    diagnostico_codigo: Optional[str] = None  # Código CIE-10
    diagnosticos_secundarios: Optional[str] = None
    tratamiento: Optional[str] = None
    indicaciones: Optional[str] = None
    examenes_solicitados: Optional[str] = None
    pronostico: Optional[str] = None
    observaciones: Optional[str] = None

class ConsultaCreate(ConsultaBase):
    cita_id: Optional[int] = None
    historia_id: Optional[int] = None
    paciente_id: int  # Ahora obligatorio para evitar inconsistencias
    medico_id: int
    signos_vitales: Optional[dict] = None

class ConsultaUpdate(ConsultaBase):
    pass

class ConsultaOut(ConsultaBase):
    id: int
    fecha_consulta: datetime
    cita_id: Optional[int]
    historia_id: Optional[int]
    medico_id: Optional[int]
    paciente_id: Optional[int]
    signos_vitales: Optional[dict]

    class Config:
        orm_mode = True
