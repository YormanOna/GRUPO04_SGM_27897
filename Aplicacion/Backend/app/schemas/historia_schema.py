from pydantic import BaseModel
from typing import List, Optional

class HistoriaBase(BaseModel):
    identificador: str

class HistoriaCreate(HistoriaBase):
    pass

class HistoriaOut(HistoriaBase):
    id: int
    class Config:
        orm_mode = True
