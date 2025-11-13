from pydantic import BaseModel
from typing import Optional

class DiagnosticoCIE10Base(BaseModel):
    codigo: str
    descripcion: str
    categoria: Optional[str] = None

class DiagnosticoCIE10Response(DiagnosticoCIE10Base):
    id: int

    class Config:
        orm_mode = True
