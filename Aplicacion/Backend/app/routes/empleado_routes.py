from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.permissions import super_admin_only, admin_only
from app.schemas.empleado_schema import EmpleadoCreate, EmpleadoOut, EmpleadoUpdate
from app.services.empleado_service import create_empleado, get_empleado, list_empleados, update_empleado, delete_empleado
from app.services.auditoria_service import auditoria_service

router = APIRouter()

@router.post("/", response_model=EmpleadoOut)
def create(
    request: Request,
    payload: EmpleadoCreate, 
    db: Session = Depends(get_db),
    current_user: dict = Depends(super_admin_only)
):
    """
    Crea un nuevo empleado/usuario del sistema.
    Solo accesible para Admin General.
    """
    nuevo_empleado = create_empleado(db, payload)
    
    # Registrar en auditoría
    from app.models.empleado import Empleado
    usuario_actual_db = db.query(Empleado).filter(Empleado.id == current_user["id"]).first()
    auditoria_service.registrar_accion(
        db=db,
        usuario_id=current_user["id"],
        usuario_nombre=f"{usuario_actual_db.nombre} {usuario_actual_db.apellido}" if usuario_actual_db else "Sistema",
        usuario_cargo=current_user["cargo"],
        accion="CREATE",
        modulo="Empleados",
        descripcion=f"Creó nuevo empleado: {nuevo_empleado.nombre} {nuevo_empleado.apellido} ({nuevo_empleado.cargo})",
        tabla_afectada="empleados",
        registro_id=nuevo_empleado.id,
        datos_nuevos={
            "nombre": nuevo_empleado.nombre,
            "apellido": nuevo_empleado.apellido,
            "email": nuevo_empleado.email,
            "cargo": nuevo_empleado.cargo,
            "cedula": nuevo_empleado.cedula
        },
        ip_address=request.client.host if request.client else None
    )
    
    return nuevo_empleado

@router.get("/", response_model=List[EmpleadoOut])
def all_empleados(
    request: Request,
    db: Session = Depends(get_db),
    current_user: dict = Depends(admin_only)
):
    """
    Lista todos los empleados del sistema.
    Accesible para Admin General y Administrador.
    """
    return list_empleados(db)

@router.get("/{empleado_id}", response_model=EmpleadoOut)
def one(
    request: Request,
    empleado_id: int, 
    db: Session = Depends(get_db),
    current_user: dict = Depends(admin_only)
):
    """
    Obtiene un empleado específico por ID.
    Accesible para Admin General y Administrador.
    """
    empleado = get_empleado(db, empleado_id)
    if not empleado:
        raise HTTPException(404, "Empleado no encontrado")
    return empleado

@router.put("/{empleado_id}", response_model=EmpleadoOut)
def modify(
    request: Request,
    empleado_id: int, 
    payload: EmpleadoUpdate, 
    db: Session = Depends(get_db),
    current_user: dict = Depends(super_admin_only)
):
    """
    Actualiza un empleado existente.
    Solo accesible para Admin General.
    """
    # Obtener datos anteriores
    empleado_anterior = get_empleado(db, empleado_id)
    if not empleado_anterior:
        raise HTTPException(404, "Empleado no encontrado")
    
    datos_anteriores = {
        "nombre": empleado_anterior.nombre,
        "apellido": empleado_anterior.apellido,
        "email": empleado_anterior.email,
        "cargo": empleado_anterior.cargo,
        "cedula": empleado_anterior.cedula
    }
    
    # Actualizar
    empleado_actualizado = update_empleado(db, empleado_id, payload)
    
    # Registrar en auditoría
    from app.models.empleado import Empleado
    usuario_actual_db = db.query(Empleado).filter(Empleado.id == current_user["id"]).first()
    auditoria_service.registrar_accion(
        db=db,
        usuario_id=current_user["id"],
        usuario_nombre=f"{usuario_actual_db.nombre} {usuario_actual_db.apellido}" if usuario_actual_db else "Sistema",
        usuario_cargo=current_user["cargo"],
        accion="UPDATE",
        modulo="Empleados",
        descripcion=f"Actualizó empleado: {empleado_actualizado.nombre} {empleado_actualizado.apellido}",
        tabla_afectada="empleados",
        registro_id=empleado_id,
        datos_anteriores=datos_anteriores,
        datos_nuevos={
            "nombre": empleado_actualizado.nombre,
            "apellido": empleado_actualizado.apellido,
            "email": empleado_actualizado.email,
            "cargo": empleado_actualizado.cargo,
            "cedula": empleado_actualizado.cedula
        },
        ip_address=request.client.host if request.client else None
    )
    
    return empleado_actualizado

@router.delete("/{empleado_id}")
def remove(
    request: Request,
    empleado_id: int, 
    db: Session = Depends(get_db),
    current_user: dict = Depends(super_admin_only)
):
    """
    Elimina un empleado del sistema.
    Solo accesible para Admin General.
    """
    # Obtener datos antes de eliminar
    empleado = get_empleado(db, empleado_id)
    if not empleado:
        raise HTTPException(404, "Empleado no encontrado")
    
    datos_eliminados = {
        "nombre": empleado.nombre,
        "apellido": empleado.apellido,
        "email": empleado.email,
        "cargo": empleado.cargo,
        "cedula": empleado.cedula
    }
    
    # Eliminar
    delete_empleado(db, empleado_id)
    
    # Registrar en auditoría
    from app.models.empleado import Empleado
    usuario_actual_db = db.query(Empleado).filter(Empleado.id == current_user["id"]).first()
    auditoria_service.registrar_accion(
        db=db,
        usuario_id=current_user["id"],
        usuario_nombre=f"{usuario_actual_db.nombre} {usuario_actual_db.apellido}" if usuario_actual_db else "Sistema",
        usuario_cargo=current_user["cargo"],
        accion="DELETE",
        modulo="Empleados",
        descripcion=f"Eliminó empleado: {datos_eliminados['nombre']} {datos_eliminados['apellido']} ({datos_eliminados['cargo']})",
        tabla_afectada="empleados",
        registro_id=empleado_id,
        datos_anteriores=datos_eliminados,
        ip_address=request.client.host if request.client else None
    )
    
    return {"detail": "Empleado eliminado exitosamente"}
