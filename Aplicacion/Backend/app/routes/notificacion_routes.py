from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.permissions import get_current_user
from app.core.permissions import verificar_permisos
from app.models.empleado import Empleado
from app.services.notificacion_stock_service import NotificacionStockService

router = APIRouter(prefix="/notificaciones", tags=["Notificaciones"])

@router.get("/stock/alertas")
def obtener_alertas_stock(
    db: Session = Depends(get_db),
    current_user: Empleado = Depends(get_current_user)
):
    """
    RF-004: Obtener todas las alertas de stock para el dashboard
    Incluye: stock crítico, agotado, próximos a vencer, vencidos
    Acceso: farmaceutico, medico, admin, super_admin
    """
    verificar_permisos(current_user, ["farmaceutico", "medico", "admin", "super_admin"])
    
    alertas = NotificacionStockService.obtener_alertas_dashboard()
    return alertas

@router.get("/stock/resumen")
def obtener_resumen_alertas(
    db: Session = Depends(get_db),
    current_user: Empleado = Depends(get_current_user)
):
    """
    RF-004: Obtener resumen numérico de alertas
    Para badges en el navbar o sidebar
    Acceso: farmaceutico, medico, admin, super_admin
    """
    verificar_permisos(current_user, ["farmaceutico", "medico", "admin", "super_admin"])
    
    resumen = NotificacionStockService.obtener_resumen_alertas(db)
    return resumen

@router.post("/stock/verificar-disponibilidad")
def verificar_disponibilidad(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: Empleado = Depends(get_current_user)
):
    """
    RF-004: Verificar disponibilidad de un medicamento antes de prescribir
    Usado por médicos al crear recetas
    Acceso: medico, admin, super_admin
    """
    verificar_permisos(current_user, ["medico", "admin", "super_admin"])
    
    medicamento_id = payload.get("medicamento_id")
    cantidad = payload.get("cantidad", 1)
    
    if not medicamento_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Debe proporcionar medicamento_id"
        )
    
    resultado = NotificacionStockService.verificar_disponibilidad_para_prescripcion(
        db, medicamento_id, cantidad
    )
    
    return resultado
