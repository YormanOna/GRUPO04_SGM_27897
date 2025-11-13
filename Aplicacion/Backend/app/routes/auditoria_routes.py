from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.core.permissions import super_admin_only
from app.schemas.auditoria_schema import AuditoriaResponse, AuditoriaFilter, AuditoriaCreate
from app.services.auditoria_service import auditoria_service
from app.models.empleado import Empleado

router = APIRouter(tags=["Auditoría"])

@router.get("/", response_model=List[AuditoriaResponse])
def listar_auditoria(
    request: Request,
    fecha_desde: Optional[str] = Query(None, description="Fecha desde (ISO format)"),
    fecha_hasta: Optional[str] = Query(None, description="Fecha hasta (ISO format)"),
    usuario_id: Optional[int] = Query(None, description="ID del usuario"),
    accion: Optional[str] = Query(None, description="Tipo de acción"),
    modulo: Optional[str] = Query(None, description="Módulo del sistema"),
    estado: Optional[str] = Query(None, description="Estado de la acción"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: dict = Depends(super_admin_only)
):
    """
    Lista todos los registros de auditoría con filtros opcionales.
    Solo accesible para Admin General.
    """
    filtros = AuditoriaFilter(
        fecha_desde=fecha_desde,
        fecha_hasta=fecha_hasta,
        usuario_id=usuario_id,
        accion=accion,
        modulo=modulo,
        estado=estado
    )
    
    registros = auditoria_service.listar(db, filtros=filtros, skip=skip, limit=limit)
    return registros

@router.get("/estadisticas")
def obtener_estadisticas_auditoria(
    request: Request,
    db: Session = Depends(get_db),
    current_user: dict = Depends(super_admin_only)
):
    """
    Obtiene estadísticas generales de la auditoría.
    Solo accesible para Admin General.
    """
    return auditoria_service.obtener_estadisticas(db)

@router.get("/count")
def contar_registros_auditoria(
    request: Request,
    fecha_desde: Optional[str] = Query(None),
    fecha_hasta: Optional[str] = Query(None),
    usuario_id: Optional[int] = Query(None),
    accion: Optional[str] = Query(None),
    modulo: Optional[str] = Query(None),
    estado: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: dict = Depends(super_admin_only)
):
    """
    Cuenta el total de registros de auditoría con filtros opcionales.
    Solo accesible para Admin General.
    """
    filtros = AuditoriaFilter(
        fecha_desde=fecha_desde,
        fecha_hasta=fecha_hasta,
        usuario_id=usuario_id,
        accion=accion,
        modulo=modulo,
        estado=estado
    )
    
    total = auditoria_service.contar_registros(db, filtros=filtros)
    return {"total": total}

@router.get("/usuario/{usuario_id}", response_model=List[AuditoriaResponse])
def obtener_auditoria_por_usuario(
    request: Request,
    usuario_id: int,
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: dict = Depends(super_admin_only)
):
    """
    Obtiene el historial de acciones de un usuario específico.
    Solo accesible para Admin General.
    """
    # Verificar que el usuario existe
    usuario = db.query(Empleado).filter(Empleado.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    registros = auditoria_service.obtener_por_usuario(db, usuario_id=usuario_id, limit=limit)
    return registros

@router.get("/modulo/{modulo}", response_model=List[AuditoriaResponse])
def obtener_auditoria_por_modulo(
    request: Request,
    modulo: str,
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: dict = Depends(super_admin_only)
):
    """
    Obtiene el historial de acciones de un módulo específico.
    Solo accesible para Admin General.
    """
    registros = auditoria_service.obtener_por_modulo(db, modulo=modulo, limit=limit)
    return registros

@router.get("/{auditoria_id}", response_model=AuditoriaResponse)
def obtener_auditoria_por_id(
    request: Request,
    auditoria_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(super_admin_only)
):
    """
    Obtiene un registro de auditoría específico por ID.
    Solo accesible para Admin General.
    """
    registro = auditoria_service.obtener_por_id(db, auditoria_id=auditoria_id)
    if not registro:
        raise HTTPException(status_code=404, detail="Registro de auditoría no encontrado")
    return registro

@router.post("/", response_model=AuditoriaResponse)
def crear_registro_auditoria(
    request: Request,
    auditoria: AuditoriaCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(super_admin_only)
):
    """
    Crea un nuevo registro de auditoría manualmente.
    Solo accesible para Admin General.
    (Normalmente los registros se crean automáticamente)
    """
    registro = auditoria_service.crear_registro(db, auditoria=auditoria)
    return registro
