from sqlalchemy.orm import Session
from app.models.asistencia import Asistencia
from app.schemas.asistencia_schema import AsistenciaCreate
from datetime import datetime
from typing import Optional
import pytz

# Zona horaria de Ecuador
ECUADOR_TZ = pytz.timezone('America/Guayaquil')

def registrar_entrada(db: Session, empleado_id: int, observaciones: Optional[str] = None):
    """
    Registra la entrada de un empleado
    """
    # Obtener hora actual de Ecuador
    fecha_actual = datetime.now(ECUADOR_TZ)
    
    asistencia = Asistencia(
        empleado_id=empleado_id,
        tipo_registro="entrada",
        fecha_entrada=fecha_actual,
        observaciones=observaciones
    )
    db.add(asistencia)
    db.commit()
    db.refresh(asistencia)
    return asistencia

def registrar_salida(db: Session, empleado_id: int, observaciones: Optional[str] = None):
    """
    Registra la salida de un empleado
    Busca el último registro de entrada sin salida
    """
    # Obtener hora actual de Ecuador
    fecha_actual = datetime.now(ECUADOR_TZ)
    
    # Buscar última entrada sin salida
    ultima_entrada = db.query(Asistencia).filter(
        Asistencia.empleado_id == empleado_id,
        Asistencia.fecha_salida == None
    ).order_by(Asistencia.fecha_entrada.desc()).first()
    
    if ultima_entrada:
        ultima_entrada.fecha_salida = fecha_actual
        if observaciones:
            ultima_entrada.observaciones = observaciones
        db.commit()
        db.refresh(ultima_entrada)
        return ultima_entrada
    
    # Si no hay entrada previa, crear un registro de salida
    asistencia = Asistencia(
        empleado_id=empleado_id,
        tipo_registro="salida",
        fecha_entrada=fecha_actual,
        fecha_salida=fecha_actual,
        observaciones=observaciones or "Salida sin entrada registrada"
    )
    db.add(asistencia)
    db.commit()
    db.refresh(asistencia)
    return asistencia

def listar_asistencias(db: Session, empleado_id: Optional[int] = None, fecha: Optional[datetime] = None):
    """
    Lista las asistencias con filtros opcionales
    """
    query = db.query(Asistencia)
    
    if empleado_id:
        query = query.filter(Asistencia.empleado_id == empleado_id)
    
    if fecha:
        # Filtrar por día específico
        inicio_dia = fecha.replace(hour=0, minute=0, second=0, microsecond=0)
        fin_dia = fecha.replace(hour=23, minute=59, second=59, microsecond=999999)
        query = query.filter(Asistencia.fecha_entrada >= inicio_dia, Asistencia.fecha_entrada <= fin_dia)
    
    return query.order_by(Asistencia.fecha_entrada.desc()).all()

def obtener_asistencia(db: Session, asistencia_id: int):
    """
    Obtiene una asistencia por ID
    """
    return db.query(Asistencia).filter(Asistencia.id == asistencia_id).first()
