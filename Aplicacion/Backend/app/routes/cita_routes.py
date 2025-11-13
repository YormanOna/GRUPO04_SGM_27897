from fastapi import APIRouter, Depends, HTTPException, Query, Body
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, datetime
from app.core.database import SessionLocal
from app.schemas.cita_schema import CitaCreate, CitaOut, CitaUpdate
from app.services.cita_service import (
    create_cita, get_cita, list_citas, update_cita, delete_cita,
    obtener_disponibilidad_medicos, validar_cita_del_dia,
    obtener_citas_por_fecha, cancelar_cita, reprogramar_cita
)
from app.core.permissions import get_current_user, admin_only, medical_staff
from app.models.medico import Medico
from app.models.paciente import Paciente
from app.utils.pdf_generator import generar_comprobante_cita_pdf

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=CitaOut)
def create(payload: CitaCreate, db: Session = Depends(get_db), current_user: dict = Depends(medical_staff)):
    """Crear cita médica con validaciones (RF-001)"""
    return create_cita(db, payload, current_user["id"])

@router.get("/", response_model=List[CitaOut])
def all(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """Listar citas - Admin ve todas, médicos solo sus citas"""
    medico_id = None
    if current_user["cargo"] == "Medico":
        medico = db.query(Medico).filter(Medico.empleado_id == current_user["id"]).first()
        if medico:
            medico_id = medico.id
    return list_citas(db, medico_id)

@router.get("/fecha/{fecha}", response_model=List[CitaOut])
def citas_por_fecha(fecha: date, medico_id: Optional[int] = None, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """Obtener citas filtradas por fecha (RF-001)"""
    return obtener_citas_por_fecha(db, fecha, medico_id)

@router.get("/disponibilidad/medicos")
def disponibilidad_medicos(fecha: Optional[date] = Query(None), especialidad: Optional[str] = Query(None), db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """Obtener disponibilidad de médicos por especialidad (RF-001)"""
    return obtener_disponibilidad_medicos(db, especialidad, fecha)

@router.get("/{cita_id}", response_model=CitaOut)
def one(cita_id: int, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """Obtener una cita"""
    cita = get_cita(db, cita_id)
    if not cita:
        raise HTTPException(404, "Cita no encontrada")
    return cita

@router.get("/{cita_id}/qr")
def generar_qr_cita(cita_id: int, db: Session = Depends(get_db)):
    """Genera código QR con datos de la cita para escaneo rápido (acceso público)"""
    import qrcode
    import io
    import json
    from datetime import datetime as dt
    
    cita = get_cita(db, cita_id)
    if not cita:
        raise HTTPException(404, "Cita no encontrada")
    
    paciente = db.query(Paciente).filter(Paciente.id == cita.paciente_id).first()
    
    medico_nombre = "Por asignar"
    medico_especialidad = "General"
    if cita.medico_id:
        from app.models.medico import Medico
        medico_obj = db.query(Medico).filter(Medico.id == cita.medico_id).first()
        if medico_obj and medico_obj.empleado:
            medico_nombre = f"{medico_obj.empleado.nombre} {medico_obj.empleado.apellido}"
            medico_especialidad = medico_obj.especialidad or "General"
    
    # Formatear fecha y hora
    if isinstance(cita.fecha, dt):
        fecha_str = cita.fecha.strftime("%d/%m/%Y")
    else:
        fecha_str = cita.fecha.strftime("%d/%m/%Y")
    
    # Datos que se codificarán en el QR
    qr_data = {
        "tipo": "cita_medica",
        "id": cita.id,
        "codigo": f"CITA-{str(cita.id).zfill(6)}",
        "paciente": f"{paciente.nombre} {paciente.apellido}",
        "cedula": str(paciente.cedula),
        "fecha": fecha_str,
        "hora": cita.hora_inicio or "08:00",
        "medico": medico_nombre,
        "especialidad": medico_especialidad,
        "motivo": cita.motivo or "Consulta médica",
        "estado": cita.estado,
        "url": f"http://localhost:5173/citas/{cita.id}"  # URL para ver detalles
    }
    
    # Generar QR code
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(json.dumps(qr_data, ensure_ascii=False))
    qr.make(fit=True)
    
    # Crear imagen
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Guardar en buffer
    img_buffer = io.BytesIO()
    img.save(img_buffer, format='PNG')
    img_buffer.seek(0)
    
    return StreamingResponse(
        img_buffer,
        media_type="image/png",
        headers={
            "Content-Disposition": f"inline; filename=qr_cita_{cita.id}.png",
            "X-QR-Data": json.dumps(qr_data, ensure_ascii=False)
        }
    )

@router.get("/{cita_id}/comprobante/pdf")
def descargar_comprobante(cita_id: int, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """Genera comprobante de cita en PDF con código QR (RF-001)"""
    cita = get_cita(db, cita_id)
    if not cita:
        raise HTTPException(404, "Cita no encontrada")
    paciente = db.query(Paciente).filter(Paciente.id == cita.paciente_id).first()
    medico = None
    if cita.medico_id:
        from app.models.medico import Medico
        medico_obj = db.query(Medico).filter(Medico.id == cita.medico_id).first()
        if medico_obj:
            medico = medico_obj.empleado
    pdf_buffer = generar_comprobante_cita_pdf(cita, paciente, medico)
    return StreamingResponse(pdf_buffer, media_type="application/pdf", headers={"Content-Disposition": f"attachment; filename=comprobante_cita_{cita.id}.pdf"})

@router.put("/{cita_id}", response_model=CitaOut)
def update(cita_id: int, payload: CitaUpdate, db: Session = Depends(get_db), current_user: dict = Depends(medical_staff)):
    """Actualizar cita con notificaciones (RF-001)"""
    cita = update_cita(db, cita_id, payload, current_user["id"])
    if not cita:
        raise HTTPException(404, "Cita no encontrada")
    return cita

@router.post("/{cita_id}/cancelar", response_model=CitaOut)
def cancelar(cita_id: int, motivo: str = Body(..., embed=True, min_length=10), db: Session = Depends(get_db), current_user: dict = Depends(medical_staff)):
    """Cancela una cita con motivo obligatorio (RF-001)"""
    return cancelar_cita(db, cita_id, motivo, current_user["id"])

@router.post("/{cita_id}/reprogramar", response_model=CitaOut)
def reprogramar(cita_id: int, nueva_fecha: datetime = Body(...), nueva_hora_inicio: Optional[str] = Body(None), nueva_hora_fin: Optional[str] = Body(None), db: Session = Depends(get_db), current_user: dict = Depends(medical_staff)):
    """Reprograma una cita a nueva fecha/hora (RF-001)"""
    return reprogramar_cita(db, cita_id, nueva_fecha, nueva_hora_inicio, nueva_hora_fin, current_user["id"])

@router.post("/{cita_id}/validar", response_model=CitaOut)
def validar_cita(cita_id: int, db: Session = Depends(get_db), current_user: dict = Depends(medical_staff)):
    """Valida cita del día y notifica a enfermería (RF-001)"""
    return validar_cita_del_dia(db, cita_id)

@router.delete("/{cita_id}")
def remove(cita_id: int, db: Session = Depends(get_db), current_user: dict = Depends(admin_only)):
    """Eliminar cita - Solo administradores"""
    result = delete_cita(db, cita_id, current_user["id"])
    if not result:
        raise HTTPException(404, "Cita no encontrada")
    return {"detail": "Cita eliminada exitosamente"}
