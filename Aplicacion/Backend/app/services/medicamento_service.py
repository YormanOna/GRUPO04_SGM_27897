from sqlalchemy.orm import Session
from app.models.medicamento import Medicamento
from app.models.farmacia import Farmacia
from app.schemas.medicamento_schema import MedicamentoCreate

def create_medicamento(db: Session, payload: MedicamentoCreate):
    # Si no se proporciona farmacia_id, intentar obtener la primera farmacia disponible
    farmacia_id = payload.farmacia_id
    if farmacia_id is None:
        primera_farmacia = db.query(Farmacia).first()
        if primera_farmacia:
            farmacia_id = primera_farmacia.id
    
    m = Medicamento(
        nombre=payload.nombre, 
        stock=payload.stock, 
        contenido=payload.contenido, 
        farmacia_id=farmacia_id,
        activo=True  # Asegurar que se crea como activo
    )
    db.add(m)
    db.commit()
    db.refresh(m)
    return m

def list_medicamentos(db: Session):
    """
    Listar todos los medicamentos (sin filtrar por activo para permitir visualización completa)
    """
    medicamentos = db.query(Medicamento).all()
    
    # Corregir registros con activo=NULL o activo=0 para que sean activos
    for medicamento in medicamentos:
        if medicamento.activo is None or medicamento.activo == False:
            print(f"⚠️ Medicamento {medicamento.id} - {medicamento.nombre} tiene activo={medicamento.activo}, corrigiendo a True")
            medicamento.activo = True
    
    if any(m.activo is None or m.activo == False for m in medicamentos):
        db.commit()
        print(f"✅ Se actualizaron {len(medicamentos)} medicamentos a activo=True")
    
    return medicamentos

def get_medicamento(db: Session, med_id: int):
    medicamento = db.query(Medicamento).filter(Medicamento.id == med_id).first()
    
    # Corregir activo=NULL si existe
    if medicamento and medicamento.activo is None:
        medicamento.activo = True
        db.commit()
        db.refresh(medicamento)
    
    return medicamento

def buscar_medicamentos(db: Session, query: str, limit: int = 20):
    """
    Busca medicamentos por nombre con stock disponible
    RF-003: Autocomplete para prescripción
    """
    from sqlalchemy import or_
    if not query or len(query) < 2:
        return []
    
    search_pattern = f"%{query}%"
    
    medicamentos = db.query(Medicamento).filter(
        Medicamento.nombre.ilike(search_pattern),
        Medicamento.stock > 0,  # Solo medicamentos disponibles
        or_(Medicamento.activo == True, Medicamento.activo.is_(None))  # Activos o NULL
    ).limit(limit).all()
    
    # Corregir registros con activo=NULL
    for medicamento in medicamentos:
        if medicamento.activo is None:
            medicamento.activo = True
    
    if any(m.activo is None for m in medicamentos):
        db.commit()
    
    return medicamentos
