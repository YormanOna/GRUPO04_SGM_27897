from pydantic import BaseModel, EmailStr, validator
from typing import Optional, Union
from datetime import datetime
from enum import Enum

class EstadoEmpleadoEnum(str, Enum):
    """Estados posibles para un empleado"""
    ACTIVO = "Activo"
    INACTIVO = "Inactivo"
    SUSPENDIDO = "Suspendido"
    VACACIONES = "Vacaciones"
    LICENCIA_MEDICA = "Licencia Médica"

class EmpleadoBase(BaseModel):
    nombre: str
    apellido: str
    cedula: int
    cargo: str  # Médico, Enfermera, Farmacéutico, Administrador
    email: Optional[EmailStr] = None
    telefono: Optional[str] = None

class EmpleadoCreate(EmpleadoBase):
    password: str
    activo: Optional[bool] = True  # Por defecto los nuevos empleados están activos (no eliminados)
    estado: Optional[EstadoEmpleadoEnum] = EstadoEmpleadoEnum.ACTIVO  # Estado por defecto: Activos

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class EmpleadoUpdate(BaseModel):
    nombre: Optional[str] = None
    apellido: Optional[str] = None
    cedula: Optional[int] = None
    cargo: Optional[str] = None
    email: Optional[EmailStr] = None
    telefono: Optional[str] = None
    password: Optional[str] = None  # Permitir cambiar contraseña
    activo: Optional[bool] = None  # Permitir activar/desactivar empleados (borrado lógico)
    estado: Optional[EstadoEmpleadoEnum] = None  # Cambiar estado de acceso

class EmpleadoOut(EmpleadoBase):
    id: int
    activo: bool
    estado: Union[EstadoEmpleadoEnum, str]
    fecha_eliminacion: Optional[datetime] = None

    @validator('estado', pre=True)
    def convert_estado(cls, v):
        """Convierte el enum de SQLAlchemy a string si es necesario"""
        if v is None:
            return EstadoEmpleadoEnum.ACTIVO.value
        # Si es un enum de SQLAlchemy, obtener su valor
        if hasattr(v, 'value'):
            return v.value
        # Si ya es un string, devolverlo
        return v

    class Config:
        orm_mode = True
        use_enum_values = True
