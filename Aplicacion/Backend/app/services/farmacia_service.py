from sqlalchemy.orm import Session
from app.models.farmacia import Farmacia
from app.schemas.farmacia_schema import FarmaciaCreate

def create_farmacia(db: Session, payload: FarmaciaCreate):
    farmacia_dict = payload.dict()
    farmacia_dict['activo'] = True  # Asegurar que se crea como activa
    f = Farmacia(**farmacia_dict)
    db.add(f)
    db.commit()
    db.refresh(f)
    return f

def list_farmacias(db: Session):
    from sqlalchemy import or_
    # Incluir farmacias activas y NULL (migración automática)
    farmacias = db.query(Farmacia).filter(
        or_(Farmacia.activo == True, Farmacia.activo.is_(None))
    ).all()
    
    # Corregir registros con activo=NULL
    for farmacia in farmacias:
        if farmacia.activo is None:
            farmacia.activo = True
    
    if any(f.activo is None for f in farmacias):
        db.commit()
    
    return farmacias

def get_farmacia(db: Session, farmacia_id: int):
    farmacia = db.query(Farmacia).filter(Farmacia.id == farmacia_id).first()
    
    # Corregir activo=NULL si existe
    if farmacia and farmacia.activo is None:
        farmacia.activo = True
        db.commit()
        db.refresh(farmacia)
    
    return farmacia
