from sqlalchemy.orm import Session
from app.models.medico import Medico
from app.models.empleado import Empleado
from app.schemas.medico_schema import MedicoCreate, MedicoUpdate

def list_medicos(db: Session):
    """Listar todos los médicos activos del sistema"""
    from sqlalchemy import or_
    # Incluir médicos con activo=True o activo=NULL (migración automática)
    medicos = db.query(Medico).filter(
        or_(Medico.activo == True, Medico.activo.is_(None))
    ).all()
    
    # Corregir registros con activo=NULL
    for medico in medicos:
        if medico.activo is None:
            medico.activo = True
    
    if any(m.activo is None for m in medicos):
        db.commit()
    
    return medicos

def get_medico(db: Session, medico_id: int):
    """Obtener un médico activo por ID"""
    from sqlalchemy import or_
    medico = db.query(Medico).filter(
        Medico.id == medico_id,
        or_(Medico.activo == True, Medico.activo.is_(None))
    ).first()
    
    # Corregir activo=NULL si existe
    if medico and medico.activo is None:
        medico.activo = True
        db.commit()
        db.refresh(medico)
    
    return medico

def get_medico_by_cedula(db: Session, cedula: int):
    """Obtener un médico activo por cédula"""
    return db.query(Medico).filter(Medico.cedula == cedula).first()

def create_medico(db: Session, medico_data: MedicoCreate):
    """Crear un nuevo médico"""
    # Verificar si ya existe un médico con esa cédula
    existing = get_medico_by_cedula(db, medico_data.cedula)
    if existing:
        raise ValueError("Ya existe un médico con esa cédula")
    
    medico_dict = medico_data.dict()
    medico_dict['activo'] = True  # Asegurar que se crea como activo
    medico = Medico(**medico_dict)
    db.add(medico)
    db.commit()
    db.refresh(medico)
    return medico

def update_medico(db: Session, medico_id: int, medico_data: MedicoUpdate):
    """Actualizar datos de un médico"""
    medico = get_medico(db, medico_id)
    if not medico:
        return None
    
    # Actualizar solo los campos proporcionados
    update_data = medico_data.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(medico, key, value)
    
    db.commit()
    db.refresh(medico)
    return medico

def delete_medico(db: Session, medico_id: int):
    """Borrado lógico de médico"""
    medico = get_medico(db, medico_id)
    if not medico:
        return False
    
    # Borrado lógico en lugar de físico
    medico.soft_delete()
    db.commit()
    return True

def list_medicos_empleados(db: Session):
    """Listar empleados activos que son médicos (basado en cargo)"""
    return db.query(Empleado).filter(
        Empleado.cargo.ilike("%medico%"),
        Empleado.activo == True
    ).all()
