from sqlalchemy.orm import Session, joinedload
from app.models.receta import Receta
from app.models.paciente import Paciente
from app.models.empleado import Empleado
from app.schemas.receta_schema import RecetaCreate, RecetaDispensar
from app.core.websocket import manager
from datetime import datetime
from typing import Optional
import pytz
import asyncio

ECUADOR_TZ = pytz.timezone('America/Guayaquil')

def crear_receta(db: Session, payload: RecetaCreate):
    """
    Crea una nueva receta médica
    """
    receta = Receta(
        consulta_id=payload.consulta_id,
        medico_id=payload.medico_id,
        paciente_id=payload.paciente_id,
        medicamentos=payload.medicamentos,
        indicaciones=payload.indicaciones,
        estado="pendiente"
    )
    db.add(receta)
    db.commit()
    db.refresh(receta)
    
    # Notificar a farmacéuticos sobre nueva receta
    try:
        paciente = db.query(Paciente).filter(Paciente.id == receta.paciente_id).first()
        asyncio.create_task(manager.send_to_role({
            "type": "receta_creada",
            "title": "Nueva receta",
            "message": f"Nueva receta para {paciente.nombre if paciente else 'un paciente'}",
            "data": {"receta_id": receta.id}
        }, "Farmaceutico"))
    except Exception as e:
        print(f"Error enviando notificación WebSocket: {e}")
    
    return receta

def listar_recetas(db: Session, paciente_id: Optional[int] = None, estado: Optional[str] = None):
    """
    Lista recetas con filtros opcionales incluyendo información de paciente, médico y farmacéutico
    """
    query = db.query(Receta).options(
        joinedload(Receta.paciente),
        joinedload(Receta.medico),
        joinedload(Receta.farmaceutico)
    )
    
    if paciente_id:
        query = query.filter(Receta.paciente_id == paciente_id)
    
    if estado:
        query = query.filter(Receta.estado == estado)
    
    recetas = query.order_by(Receta.fecha_emision.desc()).all()
    
    # Convertir a lista de diccionarios con información adicional
    resultado = []
    for receta in recetas:
        receta_dict = {
            'id': receta.id,
            'consulta_id': receta.consulta_id,
            'medico_id': receta.medico_id,
            'paciente_id': receta.paciente_id,
            'fecha_emision': receta.fecha_emision,
            'medicamentos': receta.medicamentos,
            'indicaciones': receta.indicaciones,
            'estado': receta.estado,
            'dispensada_por': receta.dispensada_por,
            'fecha_dispensacion': receta.fecha_dispensacion,
            'observaciones': receta.observaciones,
            'lote': receta.lote,
            'fecha_vencimiento': receta.fecha_vencimiento,
            # Información adicional para farmacéuticos
            'paciente_nombre': f"{receta.paciente.nombre} {receta.paciente.apellido}" if receta.paciente else None,
            'paciente_cedula': receta.paciente.cedula if receta.paciente else None,
            'medico_nombre': f"{receta.medico.nombre} {receta.medico.apellido}" if receta.medico else None,
            'farmaceutico_nombre': f"{receta.farmaceutico.nombre} {receta.farmaceutico.apellido}" if receta.farmaceutico else None
        }
        
        resultado.append(receta_dict)
    
    return resultado

def obtener_receta(db: Session, receta_id: int):
    """
    Obtiene una receta por ID
    """
    return db.query(Receta).filter(Receta.id == receta_id).first()

def dispensar_receta(db: Session, receta_id: int, farmaceutico_id: int, payload: RecetaDispensar):
    """
    Marca una receta como dispensada (RF-002: con lote y fecha de vencimiento)
    """
    receta = obtener_receta(db, receta_id)
    if not receta:
        return None
    
    receta.estado = payload.estado
    receta.dispensada_por = farmaceutico_id
    receta.fecha_dispensacion = datetime.now(ECUADOR_TZ)
    
    if payload.observaciones:
        receta.observaciones = payload.observaciones
    
    # RF-002: Registrar lote y fecha de vencimiento
    if payload.lote:
        receta.lote = payload.lote
    
    if payload.fecha_vencimiento:
        # Convertir string a date si es necesario
        from datetime import datetime as dt
        if isinstance(payload.fecha_vencimiento, str):
            receta.fecha_vencimiento = dt.strptime(payload.fecha_vencimiento, '%Y-%m-%d').date()
        else:
            receta.fecha_vencimiento = payload.fecha_vencimiento
    
    db.commit()
    db.refresh(receta)
    return receta

def cancelar_receta(db: Session, receta_id: int, observaciones: Optional[str] = None):
    """
    Cancela una receta
    """
    receta = obtener_receta(db, receta_id)
    if not receta:
        return None
    
    receta.estado = "cancelada"
    if observaciones:
        receta.observaciones = observaciones
    
    db.commit()
    db.refresh(receta)
    return receta
