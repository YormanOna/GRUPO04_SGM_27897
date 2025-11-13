from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import SessionLocal
from app.schemas.receta_schema import RecetaCreate, RecetaOut, RecetaDispensar
from app.services.receta_service import (
    crear_receta,
    listar_recetas,
    obtener_receta,
    dispensar_receta,
    cancelar_receta
)
from app.services.validacion_farmaceutica_service import ValidacionFarmaceuticaService
from app.core.permissions import get_current_user, admin_or_medic, admin_or_pharmacist
from app.utils.pdf_generator import generar_receta_pdf
from app.models.receta import Receta
from app.models.paciente import Paciente
from app.models.empleado import Empleado

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=RecetaOut)
def crear(
    payload: RecetaCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(admin_or_medic)
):
    """
    Crea una nueva receta médica - Solo médicos y administradores
    """
    return crear_receta(db, payload)

@router.get("/")
def listar(
    paciente_id: Optional[int] = Query(None, description="Filtrar por paciente"),
    estado: Optional[str] = Query(None, description="Filtrar por estado (pendiente, dispensada, parcial, cancelada)"),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Lista recetas con filtros opcionales incluyendo información del paciente, médico y farmacéutico
    """
    return listar_recetas(db, paciente_id, estado)

@router.get("/{receta_id}", response_model=RecetaOut)
def obtener(
    receta_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Obtiene una receta por ID
    """
    receta = obtener_receta(db, receta_id)
    if not receta:
        raise HTTPException(404, "Receta no encontrada")
    return receta

@router.post("/validar-prescripcion")
def validar_prescripcion(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: dict = Depends(admin_or_pharmacist)
):
    """
    RF-004: Validar una prescripción antes de dispensar
    Verifica: stock, alergias, interacciones, dosis
    Retorna alertas críticas, advertencias e info
    """
    paciente_id = payload.get("paciente_id")
    medicamentos = payload.get("medicamentos", [])
    
    if not paciente_id or not medicamentos:
        raise HTTPException(400, "Debe proporcionar paciente_id y medicamentos")
    
    resultado = ValidacionFarmaceuticaService.validar_prescripcion(
        db, paciente_id, medicamentos
    )
    
    return resultado

@router.post("/{receta_id}/dispensar", response_model=RecetaOut)
def dispensar(
    receta_id: int,
    payload: RecetaDispensar,
    db: Session = Depends(get_db),
    current_user: dict = Depends(admin_or_pharmacist)
):
    """
    Dispensa una receta - Solo farmacéuticos y administradores
    """
    receta = dispensar_receta(db, receta_id, current_user["id"], payload)
    if not receta:
        raise HTTPException(404, "Receta no encontrada")
    return receta

@router.put("/{receta_id}/cancelar", response_model=RecetaOut)
def cancelar(
    receta_id: int,
    observaciones: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(admin_or_medic)
):
    """
    Cancela una receta - Solo médicos y administradores
    """
    receta = cancelar_receta(db, receta_id, observaciones)
    if not receta:
        raise HTTPException(404, "Receta no encontrada")
    return receta

@router.get("/{receta_id}/pdf")
def descargar_pdf(
    receta_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Genera y descarga el PDF de una receta médica
    Accesible para todos los usuarios autenticados
    """
    # Obtener receta con sus relaciones
    receta = db.query(Receta).filter(Receta.id == receta_id).first()
    if not receta:
        raise HTTPException(404, "Receta no encontrada")
    
    # Obtener datos del paciente
    paciente = db.query(Paciente).filter(Paciente.id == receta.paciente_id).first()
    if not paciente:
        raise HTTPException(404, "Paciente no encontrado")
    
    # Obtener datos del médico
    medico = db.query(Empleado).filter(Empleado.id == receta.medico_id).first()
    if not medico:
        raise HTTPException(404, "Médico no encontrado")
    
    # Generar PDF
    try:
        pdf_buffer = generar_receta_pdf(receta, paciente, medico)
        
        # Retornar como respuesta streaming
        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=receta_{receta_id}.pdf"
            }
        )
    except Exception as e:
        raise HTTPException(500, f"Error al generar PDF: {str(e)}")
