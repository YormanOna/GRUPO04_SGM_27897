from pydantic import BaseModel
from typing import List, Optional

class FarmaciaBase(BaseModel):
    nombre_farmacia: str
    direccion: Optional[str] = None
    telefono: Optional[str] = None

class FarmaciaCreate(FarmaciaBase):
    farmaceutico_id: Optional[int] = None

class FarmaciaUpdate(BaseModel):
    nombre_farmacia: Optional[str] = None
    direccion: Optional[str] = None
    telefono: Optional[str] = None
    farmaceutico_id: Optional[int] = None

class FarmaciaOut(FarmaciaBase):
    id: int
    farmaceutico_id: Optional[int] = None
    
    class Config:
        orm_mode = True
