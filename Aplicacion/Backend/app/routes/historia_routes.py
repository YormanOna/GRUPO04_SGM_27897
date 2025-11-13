from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import SessionLocal
from app.core.permissions import any_authenticated, get_current_user
from app.schemas.historia_schema import HistoriaCreate, HistoriaOut
from app.schemas.expediente_schema import ExpedienteCompletoOut
from app.services.historia_service import (
    create_historia, 
    list_historias, 
    get_historia, 
    buscar_expediente_completo,
    get_expediente_por_paciente
)
from app.services.auditoria_service import auditoria_service
from app.models.empleado import Empleado

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=HistoriaOut)
def create(payload: HistoriaCreate, db: Session = Depends(get_db)):
    return create_historia(db, payload)

@router.get("/", response_model=List[HistoriaOut])
def all(db: Session = Depends(get_db)):
    return list_historias(db)

@router.get("/{historia_id}", response_model=HistoriaOut)
def one(historia_id: int, db: Session = Depends(get_db)):
    h = get_historia(db, historia_id)
    if not h:
        raise HTTPException(404, "Historia no encontrada")
    return h

@router.get("/expediente/buscar", response_model=ExpedienteCompletoOut)
def buscar_expediente(
    query: str = Query(..., description="Número de historia clínica o cédula del paciente"),
    db: Session = Depends(get_db),
    current_user: dict = Depends(any_authenticated)
):
    """
    RF-002: Búsqueda de expediente por número de HC o cédula
    Acceso controlado por rol con auditoría
    """
    expediente = buscar_expediente_completo(db, query)
    
    if not expediente:
        raise HTTPException(404, "No se encontró el expediente del paciente")
    
    # Registrar acceso al expediente en auditoría (RF-002)
    usuario = db.query(Empleado).filter(Empleado.id == current_user["id"]).first()
    if usuario:
        auditoria_service.registrar_accion(
            db=db,
            usuario_id=usuario.id,
            usuario_nombre=f"{usuario.nombre} {usuario.apellido}",
            usuario_cargo=usuario.cargo,
            accion="CONSULTA",
            modulo="Expediente Clínico",
            descripcion=f"Acceso al expediente del paciente {expediente['paciente'].nombre} {expediente['paciente'].apellido}",
            tabla_afectada="historias",
            registro_id=expediente['historia'].id if expediente['historia'] else None,
            estado="exitoso"
        )
    
    # Filtrar información según el rol (RF-002)
    cargo = current_user["cargo"]
    
    if cargo == "Administrador":
        # Personal administrativo: solo datos de identificación y afiliación
        return ExpedienteCompletoOut(
            paciente=expediente["paciente"],
            historia=expediente["historia"],
            consultas=[],
            recetas=[],
            total_consultas=0,
            total_recetas=0,
            mensaje="Acceso limitado: Personal administrativo"
        )
    
    elif cargo == "Enfermera":
        # Enfermería: identificación + alergias + antecedentes + signos vitales
        consultas_enfermera = []
        for c in expediente["consultas"]:
            consultas_enfermera.append({
                "id": c.id,
                "fecha_consulta": c.fecha_consulta,
                "signos_vitales": c.signos_vitales,
                "medico": {
                    "nombre": c.medico_empleado.nombre if c.medico_empleado else None,
                    "apellido": c.medico_empleado.apellido if c.medico_empleado else None
                }
            })
        
        return ExpedienteCompletoOut(
            paciente=expediente["paciente"],
            historia=expediente["historia"],
            consultas=consultas_enfermera,
            recetas=[],
            total_consultas=expediente["total_consultas"],
            total_recetas=0,
            mensaje="Acceso limitado: Personal de enfermería"
        )
    
    elif cargo == "Farmaceutico":
        # Farmacéutico: identificación + alergias + diagnósticos + prescripciones
        consultas_farmaceutico = []
        for c in expediente["consultas"]:
            consultas_farmaceutico.append({
                "id": c.id,
                "fecha_consulta": c.fecha_consulta,
                "diagnostico": c.diagnostico,
                "diagnostico_codigo": c.diagnostico_codigo
            })
        
        return ExpedienteCompletoOut(
            paciente=expediente["paciente"],
            historia=expediente["historia"],
            consultas=consultas_farmaceutico,
            recetas=expediente["recetas"],
            total_consultas=0,
            total_recetas=expediente["total_recetas"],
            mensaje="Acceso limitado: Personal farmacéutico"
        )
    
    else:
        # Médicos y Admin General: acceso completo
        consultas_completas = []
        for c in expediente["consultas"]:
            consultas_completas.append({
                "id": c.id,
                "fecha_consulta": c.fecha_consulta,
                "motivo_consulta": c.motivo_consulta,
                "enfermedad_actual": c.enfermedad_actual,
                "examen_fisico": c.examen_fisico,
                "diagnostico": c.diagnostico,
                "diagnostico_codigo": c.diagnostico_codigo,
                "tratamiento": c.tratamiento,
                "indicaciones": c.indicaciones,
                "observaciones": c.observaciones,
                "signos_vitales": c.signos_vitales,
                "medico": {
                    "nombre": c.medico_empleado.nombre if c.medico_empleado else None,
                    "apellido": c.medico_empleado.apellido if c.medico_empleado else None
                } if c.medico_empleado else None
            })
        
        return ExpedienteCompletoOut(
            paciente=expediente["paciente"],
            historia=expediente["historia"],
            consultas=consultas_completas,
            recetas=expediente["recetas"],
            total_consultas=expediente["total_consultas"],
            total_recetas=expediente["total_recetas"]
        )

@router.get("/expediente/paciente/{paciente_id}", response_model=ExpedienteCompletoOut)
def obtener_expediente(
    paciente_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(any_authenticated)
):
    """
    RF-002: Obtener expediente completo por ID del paciente
    """
    expediente = get_expediente_por_paciente(db, paciente_id)
    
    if not expediente:
        raise HTTPException(404, "No se encontró el expediente del paciente")
    
    # Registrar acceso en auditoría
    usuario = db.query(Empleado).filter(Empleado.id == current_user["id"]).first()
    if usuario:
        auditoria_service.registrar_accion(
            db=db,
            usuario_id=usuario.id,
            usuario_nombre=f"{usuario.nombre} {usuario.apellido}",
            usuario_cargo=usuario.cargo,
            accion="CONSULTA",
            modulo="Expediente Clínico",
            descripcion=f"Acceso al expediente del paciente {expediente['paciente'].nombre} {expediente['paciente'].apellido}",
            tabla_afectada="historias",
            registro_id=expediente['historia'].id if expediente['historia'] else None,
            estado="exitoso"
        )
    
    # Aplicar filtrado por rol igual que en buscar_expediente
    cargo = current_user["cargo"]
    
    if cargo == "Administrador":
        return ExpedienteCompletoOut(
            paciente=expediente["paciente"],
            historia=expediente["historia"],
            consultas=[],
            recetas=[],
            total_consultas=0,
            total_recetas=0,
            mensaje="Acceso limitado: Personal administrativo"
        )
    
    elif cargo == "Enfermera":
        consultas_enfermera = []
        for c in expediente["consultas"]:
            consultas_enfermera.append({
                "id": c.id,
                "fecha_consulta": c.fecha_consulta,
                "signos_vitales": c.signos_vitales,
                "medico": {
                    "nombre": c.medico_empleado.nombre if c.medico_empleado else None,
                    "apellido": c.medico_empleado.apellido if c.medico_empleado else None
                }
            })
        
        return ExpedienteCompletoOut(
            paciente=expediente["paciente"],
            historia=expediente["historia"],
            consultas=consultas_enfermera,
            recetas=[],
            total_consultas=expediente["total_consultas"],
            total_recetas=0,
            mensaje="Acceso limitado: Personal de enfermería"
        )
    
    elif cargo == "Farmaceutico":
        consultas_farmaceutico = []
        for c in expediente["consultas"]:
            consultas_farmaceutico.append({
                "id": c.id,
                "fecha_consulta": c.fecha_consulta,
                "diagnostico": c.diagnostico,
                "diagnostico_codigo": c.diagnostico_codigo
            })
        
        return ExpedienteCompletoOut(
            paciente=expediente["paciente"],
            historia=expediente["historia"],
            consultas=consultas_farmaceutico,
            recetas=expediente["recetas"],
            total_consultas=0,
            total_recetas=expediente["total_recetas"],
            mensaje="Acceso limitado: Personal farmacéutico"
        )
    
    else:
        # Médicos y Admin General: acceso completo
        consultas_completas = []
        for c in expediente["consultas"]:
            consultas_completas.append({
                "id": c.id,
                "fecha_consulta": c.fecha_consulta,
                "motivo_consulta": c.motivo_consulta,
                "enfermedad_actual": c.enfermedad_actual,
                "examen_fisico": c.examen_fisico,
                "diagnostico": c.diagnostico,
                "diagnostico_codigo": c.diagnostico_codigo,
                "tratamiento": c.tratamiento,
                "indicaciones": c.indicaciones,
                "observaciones": c.observaciones,
                "signos_vitales": c.signos_vitales,
                "medico": {
                    "nombre": c.medico_empleado.nombre if c.medico_empleado else None,
                    "apellido": c.medico_empleado.apellido if c.medico_empleado else None
                } if c.medico_empleado else None
            })
        
        return ExpedienteCompletoOut(
            paciente=expediente["paciente"],
            historia=expediente["historia"],
            consultas=consultas_completas,
            recetas=expediente["recetas"],
            total_consultas=expediente["total_consultas"],
            total_recetas=expediente["total_recetas"]
        )
