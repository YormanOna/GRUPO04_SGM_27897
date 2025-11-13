from pydantic import BaseModel
from typing import Optional

class MedicamentoBase(BaseModel):
    nombre: str
    stock: int
    contenido: Optional[str] = None  # Cambiado a string para aceptar "500mg", "100ml", etc.

class MedicamentoCreate(MedicamentoBase):
    farmacia_id: Optional[int] = None  # Opcional, se asignará automáticamente si existe

class MedicamentoOut(MedicamentoBase):
    id: int
    farmacia_id: Optional[int]

    class Config:
        orm_mode = True
