from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.permissions import get_current_user
from app.schemas.diagnostico_cie10_schema import DiagnosticoCIE10Response
from app.services.diagnostico_service import DiagnosticoService

router = APIRouter(prefix="/diagnosticos", tags=["Diagnósticos CIE-10"])

@router.get("/buscar", response_model=List[DiagnosticoCIE10Response])
def buscar_diagnosticos_cie10(
    query: str = Query(..., min_length=2, description="Término de búsqueda (código o descripción)"),
    limit: int = Query(20, ge=1, le=50, description="Cantidad máxima de resultados"),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Busca diagnósticos CIE-10 por código o descripción.
    Requiere autenticación. Disponible para todos los roles.
    """
    diagnosticos = DiagnosticoService.buscar_diagnosticos(db, query, limit)
    return diagnosticos

@router.get("/{codigo}", response_model=DiagnosticoCIE10Response)
def obtener_diagnostico_por_codigo(
    codigo: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Obtiene un diagnóstico específico por su código CIE-10.
    """
    diagnostico = DiagnosticoService.obtener_por_codigo(db, codigo)
    if not diagnostico:
        raise HTTPException(status_code=404, detail="Diagnóstico CIE-10 no encontrado")
    return diagnostico
