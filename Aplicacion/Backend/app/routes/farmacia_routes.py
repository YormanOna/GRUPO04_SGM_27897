from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import SessionLocal
from app.schemas.farmacia_schema import FarmaciaCreate, FarmaciaOut
from app.services.farmacia_service import create_farmacia, list_farmacias, get_farmacia

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=FarmaciaOut)
def create(payload: FarmaciaCreate, db: Session = Depends(get_db)):
    return create_farmacia(db, payload)

@router.get("/", response_model=List[FarmaciaOut])
def all(db: Session = Depends(get_db)):
    return list_farmacias(db)

@router.get("/{farmacia_id}", response_model=FarmaciaOut)
def one(farmacia_id: int, db: Session = Depends(get_db)):
    f = get_farmacia(db, farmacia_id)
    if not f:
        raise HTTPException(404, "Farmacia no encontrada")
    return f
