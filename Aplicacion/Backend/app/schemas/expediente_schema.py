from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import date, datetime
from app.schemas.paciente_schema import PacienteOut
from app.schemas.historia_schema import HistoriaOut

class MedicoExpedienteOut(BaseModel):
    nombre: Optional[str] = None
    apellido: Optional[str] = None
    
    class Config:
        orm_mode = True

class ConsultaExpedienteOut(BaseModel):
    id: int
    fecha_consulta: datetime
    motivo_consulta: Optional[str] = None
    anamnesis: Optional[str] = None
    examen_fisico: Optional[str] = None
    diagnostico: Optional[str] = None
    diagnostico_codigo: Optional[str] = None
    tratamiento: Optional[str] = None
    indicaciones: Optional[str] = None
    observaciones: Optional[str] = None
    signos_vitales: Optional[Dict[str, Any]] = None
    medico: Optional[MedicoExpedienteOut] = None
    
    class Config:
        orm_mode = True

class RecetaExpedienteOut(BaseModel):
    id: int
    fecha_emision: datetime
    medicamento_nombre: Optional[str] = None
    dosis: Optional[str] = None
    frecuencia: Optional[str] = None
    duracion: Optional[str] = None
    indicaciones: Optional[str] = None
    estado: Optional[str] = None
    
    class Config:
        orm_mode = True

class ExpedienteCompletoOut(BaseModel):
    paciente: PacienteOut
    historia: Optional[HistoriaOut] = None
    consultas: List[ConsultaExpedienteOut] = []
    recetas: List[RecetaExpedienteOut] = []
    total_consultas: int = 0
    total_recetas: int = 0
    mensaje: Optional[str] = None
    
    class Config:
        orm_mode = True
