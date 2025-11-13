from pydantic import BaseModel, EmailStr
from typing import Optional

class MedicoBase(BaseModel):
    nombre: str
    apellido: str
    cedula: int
    especialidad: Optional[str] = None
    email: Optional[EmailStr] = None

class MedicoCreate(MedicoBase):
    pass

class MedicoUpdate(BaseModel):
    nombre: Optional[str] = None
    apellido: Optional[str] = None
    especialidad: Optional[str] = None
    email: Optional[EmailStr] = None

class MedicoOut(MedicoBase):
    id: int
    empleado_id: Optional[int] = None

    class Config:
        orm_mode = True
