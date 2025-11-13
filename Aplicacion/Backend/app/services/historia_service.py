from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_
from app.models.historia import Historia
from app.models.paciente import Paciente
from app.models.consulta import Consulta
from app.models.receta import Receta
from app.models.empleado import Empleado
from app.schemas.historia_schema import HistoriaCreate

def create_historia(db: Session, payload: HistoriaCreate):
    h = Historia(identificador=payload.identificador, activo=True)
    db.add(h)
    db.commit()
    db.refresh(h)
    return h

def list_historias(db: Session):
    # Incluir historias activas y NULL (migración automática)
    historias = db.query(Historia).filter(
        or_(Historia.activo == True, Historia.activo.is_(None))
    ).all()
    
    # Corregir registros con activo=NULL
    for historia in historias:
        if historia.activo is None:
            historia.activo = True
    
    if any(h.activo is None for h in historias):
        db.commit()
    
    return historias

def get_historia(db: Session, historia_id: int):
    historia = db.query(Historia).filter(Historia.id == historia_id).first()
    
    # Corregir activo=NULL si existe
    if historia and historia.activo is None:
        historia.activo = True
        db.commit()
        db.refresh(historia)
    
    return historia

def buscar_expediente_completo(db: Session, termino: str):
    """
    Busca un paciente por número de historia clínica o cédula y retorna el expediente completo.
    RF-002: Acceso al expediente por número de HC o cédula
    """
    # Buscar primero el paciente por historia clínica o cédula
    paciente = db.query(Paciente).join(Historia).filter(
        or_(
            Historia.identificador.ilike(f"%{termino}%"),
            Paciente.cedula.like(f"%{termino}%")
        )
    ).first()
    
    if not paciente:
        return None
    
    # Obtener todas las consultas del paciente con relaciones
    consultas = db.query(Consulta).filter(
        Consulta.paciente_id == paciente.id
    ).options(
        joinedload(Consulta.medico_empleado)
    ).order_by(Consulta.fecha_consulta.desc()).all()
    
    # Obtener todas las recetas del paciente
    recetas = db.query(Receta).filter(
        Receta.paciente_id == paciente.id
    ).options(
        joinedload(Receta.medico),
        joinedload(Receta.farmaceutico)
    ).order_by(Receta.fecha_emision.desc()).all()
    
    # Construir el expediente completo
    expediente = {
        "paciente": paciente,
        "historia": paciente.historia,
        "consultas": consultas,
        "recetas": recetas,
        "total_consultas": len(consultas),
        "total_recetas": len(recetas)
    }
    
    return expediente

def get_expediente_por_paciente(db: Session, paciente_id: int):
    """
    Obtiene el expediente completo de un paciente por su ID.
    RF-002: Expediente clínico completo
    """
    paciente = db.query(Paciente).filter(Paciente.id == paciente_id).first()
    
    if not paciente:
        return None
    
    # Obtener todas las consultas del paciente con relaciones
    consultas = db.query(Consulta).filter(
        Consulta.paciente_id == paciente_id
    ).options(
        joinedload(Consulta.medico_empleado)
    ).order_by(Consulta.fecha_consulta.desc()).all()
    
    # Obtener todas las recetas del paciente
    recetas = db.query(Receta).filter(
        Receta.paciente_id == paciente_id
    ).options(
        joinedload(Receta.medico),
        joinedload(Receta.farmaceutico)
    ).order_by(Receta.fecha_emision.desc()).all()
    
    expediente = {
        "paciente": paciente,
        "historia": paciente.historia,
        "consultas": consultas,
        "recetas": recetas,
        "total_consultas": len(consultas),
        "total_recetas": len(recetas)
    }
    
    return expediente
