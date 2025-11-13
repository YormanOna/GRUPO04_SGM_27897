from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import date

class PacienteBase(BaseModel):
    nombre: str
    apellido: str
    cedula: int
    email: Optional[EmailStr] = None
    telefono: Optional[str] = None
    direccion: Optional[str] = None
    fecha_nacimiento: Optional[date] = None
    genero: Optional[str] = None
    grupo_sanguineo: Optional[str] = None
    alergias: Optional[str] = None
    antecedentes_medicos: Optional[str] = None
    contacto_emergencia_nombre: Optional[str] = None
    contacto_emergencia_telefono: Optional[str] = None
    contacto_emergencia_relacion: Optional[str] = None
    # Campos de afiliación médica (RF-001)
    tipo_seguro: Optional[str] = None
    aseguradora: Optional[str] = None
    numero_poliza: Optional[str] = None
    fecha_vigencia_poliza: Optional[date] = None

class PacienteCreate(PacienteBase):
    pass

class PacienteUpdate(BaseModel):
    nombre: Optional[str] = None
    apellido: Optional[str] = None
    email: Optional[EmailStr] = None
    telefono: Optional[str] = None
    direccion: Optional[str] = None
    fecha_nacimiento: Optional[date] = None
    genero: Optional[str] = None
    grupo_sanguineo: Optional[str] = None
    alergias: Optional[str] = None
    antecedentes_medicos: Optional[str] = None
    contacto_emergencia_nombre: Optional[str] = None
    contacto_emergencia_telefono: Optional[str] = None
    contacto_emergencia_relacion: Optional[str] = None
    tipo_seguro: Optional[str] = None
    aseguradora: Optional[str] = None
    numero_poliza: Optional[str] = None
    fecha_vigencia_poliza: Optional[date] = None

class PacienteOut(PacienteBase):
    id: int
    historia_id: Optional[int] = None
    edad: Optional[int] = None  # Edad calculada desde fecha_nacimiento
    numero_historia_clinica: Optional[str] = None  # Número de HC generado automáticamente
    estado_poliza: Optional[str] = None  # Estado de vigencia: vigente, vencida, proxima_a_vencer

    class Config:
        orm_mode = True
