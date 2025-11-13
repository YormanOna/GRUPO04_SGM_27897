from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.core.permissions import get_current_user, verificar_permisos
from app.models.empleado import Empleado
from app.services.lote_service import LoteService
from app.schemas.lote_schema import LoteCreate, LoteUpdate, LoteResponse, LoteListItem, LoteStockInfo
from datetime import datetime, date

router = APIRouter(prefix="/lotes", tags=["Lotes"])

@router.post("/", response_model=LoteResponse, status_code=status.HTTP_201_CREATED)
def crear_lote(
    lote_data: LoteCreate,
    db: Session = Depends(get_db),
    current_user: Empleado = Depends(get_current_user)
):
    """
    RF-004: Crear un nuevo lote de medicamento
    Requiere rol: farmaceutico, admin, super_admin
    """
    verificar_permisos(current_user, ["farmaceutico", "admin", "super_admin"])
    
    try:
        lote = LoteService.crear_lote(db, lote_data)
        
        # Agregar nombre del medicamento a la respuesta
        response_data = LoteResponse.model_validate(lote)
        response_data.medicamento_nombre = lote.medicamento.nombre if lote.medicamento else None
        
        return response_data
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error al crear lote: {str(e)}")

@router.get("/", response_model=List[LoteResponse])
def listar_lotes(
    medicamento_id: Optional[int] = None,
    estado: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: Empleado = Depends(get_current_user)
):
    """
    RF-004: Listar lotes con filtros opcionales
    Requiere rol: farmaceutico, medico, admin, super_admin
    """
    verificar_permisos(current_user, ["farmaceutico", "medico", "admin", "super_admin"])
    
    lotes = LoteService.listar_lotes(db, medicamento_id, estado, skip, limit)
    
    # Agregar información del medicamento
    response = []
    for lote in lotes:
        lote_data = LoteResponse.model_validate(lote)
        lote_data.medicamento_nombre = lote.medicamento.nombre if lote.medicamento else None
        response.append(lote_data)
    
    return response

@router.get("/medicamento/{medicamento_id}/disponibles", response_model=List[LoteStockInfo])
def listar_lotes_disponibles(
    medicamento_id: int,
    db: Session = Depends(get_db),
    current_user: Empleado = Depends(get_current_user)
):
    """
    RF-004: Obtener lotes disponibles de un medicamento (FEFO)
    Usado para seleccionar lote al dispensar
    Requiere rol: farmaceutico, admin, super_admin
    """
    verificar_permisos(current_user, ["farmaceutico", "admin", "super_admin"])
    
    lotes = LoteService.listar_lotes_disponibles_medicamento(db, medicamento_id)
    return [LoteStockInfo.model_validate(lote) for lote in lotes]

@router.get("/proximos-vencer", response_model=List[LoteResponse])
def obtener_lotes_proximos_vencer(
    dias: int = 30,
    db: Session = Depends(get_db),
    current_user: Empleado = Depends(get_current_user)
):
    """
    RF-004: Obtener lotes que vencen en los próximos X días
    Para alertas en dashboard
    Requiere rol: farmaceutico, admin, super_admin
    """
    verificar_permisos(current_user, ["farmaceutico", "admin", "super_admin"])
    
    lotes = LoteService.obtener_lotes_proximos_vencer(db, dias)
    
    response = []
    for lote in lotes:
        lote_data = LoteResponse.model_validate(lote)
        lote_data.medicamento_nombre = lote.medicamento.nombre if lote.medicamento else None
        response.append(lote_data)
    
    return response

@router.get("/vencidos", response_model=List[LoteResponse])
def obtener_lotes_vencidos(
    db: Session = Depends(get_db),
    current_user: Empleado = Depends(get_current_user)
):
    """
    RF-004: Obtener lotes vencidos con stock
    Requiere rol: farmaceutico, admin, super_admin
    """
    verificar_permisos(current_user, ["farmaceutico", "admin", "super_admin"])
    
    lotes = LoteService.obtener_lotes_vencidos(db)
    
    response = []
    for lote in lotes:
        lote_data = LoteResponse.model_validate(lote)
        lote_data.medicamento_nombre = lote.medicamento.nombre if lote.medicamento else None
        response.append(lote_data)
    
    return response

@router.get("/{lote_id}", response_model=LoteResponse)
def obtener_lote(
    lote_id: int,
    db: Session = Depends(get_db),
    current_user: Empleado = Depends(get_current_user)
):
    """
    RF-004: Obtener detalles de un lote
    Requiere rol: farmaceutico, medico, admin, super_admin
    """
    verificar_permisos(current_user, ["farmaceutico", "medico", "admin", "super_admin"])
    
    lote = LoteService.obtener_lote(db, lote_id)
    if not lote:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lote no encontrado")
    
    lote_data = LoteResponse.model_validate(lote)
    lote_data.medicamento_nombre = lote.medicamento.nombre if lote.medicamento else None
    
    return lote_data

@router.put("/{lote_id}", response_model=LoteResponse)
def actualizar_lote(
    lote_id: int,
    lote_data: LoteUpdate,
    db: Session = Depends(get_db),
    current_user: Empleado = Depends(get_current_user)
):
    """
    RF-004: Actualizar un lote
    Requiere rol: farmaceutico, admin, super_admin
    """
    verificar_permisos(current_user, ["farmaceutico", "admin", "super_admin"])
    
    lote = LoteService.actualizar_lote(db, lote_id, lote_data)
    if not lote:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lote no encontrado")
    
    lote_response = LoteResponse.model_validate(lote)
    lote_response.medicamento_nombre = lote.medicamento.nombre if lote.medicamento else None
    
    return lote_response

@router.delete("/{lote_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_lote(
    lote_id: int,
    db: Session = Depends(get_db),
    current_user: Empleado = Depends(get_current_user)
):
    """
    RF-004: Eliminar un lote
    Requiere rol: admin, super_admin
    """
    verificar_permisos(current_user, ["admin", "super_admin"])
    
    if not LoteService.eliminar_lote(db, lote_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lote no encontrado")
    
    return None

@router.post("/actualizar-estados", status_code=status.HTTP_200_OK)
def actualizar_estados_lotes(
    db: Session = Depends(get_db),
    current_user: Empleado = Depends(get_current_user)
):
    """
    RF-004: Actualizar estados de todos los lotes
    (vencido, proximo_a_vencer, etc.)
    Requiere rol: farmaceutico, admin, super_admin
    """
    verificar_permisos(current_user, ["farmaceutico", "admin", "super_admin"])
    
    LoteService.actualizar_estados_lotes(db)
    return {"message": "Estados de lotes actualizados correctamente"}
