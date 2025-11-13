from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.core.database import SessionLocal
from app.schemas.asistencia_schema import AsistenciaCreate, AsistenciaOut, AsistenciaRegistroSalida
from app.services.asistencia_service import (
    registrar_entrada, 
    registrar_salida, 
    listar_asistencias, 
    obtener_asistencia
)
from app.core.permissions import get_current_user, admin_only

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/entrada", response_model=AsistenciaOut)
def marcar_entrada(
    observaciones: Optional[str] = None,
    db: Session = Depends(get_db), 
    current_user: dict = Depends(get_current_user)
):
    """
    Registra la entrada del empleado autenticado
    """
    return registrar_entrada(db, current_user["id"], observaciones)

@router.post("/salida", response_model=AsistenciaOut)
def marcar_salida(
    payload: AsistenciaRegistroSalida,
    db: Session = Depends(get_db), 
    current_user: dict = Depends(get_current_user)
):
    """
    Registra la salida del empleado autenticado
    """
    return registrar_salida(db, current_user["id"], payload.observaciones)

@router.get("/", response_model=List[AsistenciaOut])
def listar(
    empleado_id: Optional[int] = Query(None, description="ID del empleado"),
    fecha: Optional[str] = Query(None, description="Fecha en formato YYYY-MM-DD"),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Lista asistencias. Los empleados solo ven sus registros, los admins ven todos.
    """
    # Si no es admin, solo puede ver sus propias asistencias
    if current_user["cargo"] != "Administrador":
        empleado_id = current_user["id"]
    
    fecha_obj = None
    if fecha:
        try:
            fecha_obj = datetime.strptime(fecha, "%Y-%m-%d")
        except ValueError:
            raise HTTPException(400, "Formato de fecha inválido. Use YYYY-MM-DD")
    
    return listar_asistencias(db, empleado_id, fecha_obj)

@router.get("/{asistencia_id}", response_model=AsistenciaOut)
def obtener(
    asistencia_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Obtiene una asistencia por ID
    """
    asistencia = obtener_asistencia(db, asistencia_id)
    if not asistencia:
        raise HTTPException(404, "Asistencia no encontrada")
    
    # Verificar permisos: solo el empleado o admin puede ver
    if current_user["cargo"] != "Administrador" and asistencia.empleado_id != current_user["id"]:
        raise HTTPException(403, "No tienes permiso para ver esta asistencia")
    
    return asistencia
