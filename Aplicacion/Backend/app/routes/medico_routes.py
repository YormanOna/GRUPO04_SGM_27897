from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import SessionLocal
from app.schemas.medico_schema import MedicoOut, MedicoCreate, MedicoUpdate
from app.services import medico_service

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/", response_model=List[MedicoOut])
def get_all_medicos(db: Session = Depends(get_db)):
    """Listar todos los médicos"""
    return medico_service.list_medicos(db)

@router.get("/{medico_id}", response_model=MedicoOut)
def get_one_medico(medico_id: int, db: Session = Depends(get_db)):
    """Obtener un médico por ID"""
    medico = medico_service.get_medico(db, medico_id)
    if not medico:
        raise HTTPException(status_code=404, detail="Médico no encontrado")
    return medico

@router.post("/", response_model=MedicoOut, status_code=201)
def create_new_medico(medico: MedicoCreate, db: Session = Depends(get_db)):
    """Crear un nuevo médico"""
    try:
        return medico_service.create_medico(db, medico)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/{medico_id}", response_model=MedicoOut)
def update_existing_medico(medico_id: int, medico: MedicoUpdate, db: Session = Depends(get_db)):
    """Actualizar datos de un médico"""
    updated = medico_service.update_medico(db, medico_id, medico)
    if not updated:
        raise HTTPException(status_code=404, detail="Médico no encontrado")
    return updated

@router.delete("/{medico_id}", status_code=204)
def delete_existing_medico(medico_id: int, db: Session = Depends(get_db)):
    """Eliminar un médico"""
    deleted = medico_service.delete_medico(db, medico_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Médico no encontrado")
    return None
