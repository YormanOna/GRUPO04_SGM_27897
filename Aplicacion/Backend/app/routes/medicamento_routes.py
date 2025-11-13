from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import SessionLocal
from app.schemas.medicamento_schema import MedicamentoCreate, MedicamentoOut
from app.services.medicamento_service import create_medicamento, list_medicamentos, get_medicamento, buscar_medicamentos

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=MedicamentoOut)
def create(payload: MedicamentoCreate, db: Session = Depends(get_db)):
    return create_medicamento(db, payload)

@router.get("/", response_model=List[MedicamentoOut])
def all(db: Session = Depends(get_db)):
    return list_medicamentos(db)

@router.get("/buscar", response_model=List[MedicamentoOut])
def buscar(query: str, limit: int = 20, db: Session = Depends(get_db)):
    """
    RF-003: Busca medicamentos por nombre con stock disponible
    """
    return buscar_medicamentos(db, query, limit)

@router.get("/{med_id}", response_model=MedicamentoOut)
def one(med_id: int, db: Session = Depends(get_db)):
    m = get_medicamento(db, med_id)
    if not m:
        raise HTTPException(404, "Medicamento no encontrado")
    return m
