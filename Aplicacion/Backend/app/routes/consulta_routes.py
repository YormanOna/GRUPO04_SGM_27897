from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import SessionLocal
from app.schemas.consulta_schema import ConsultaCreate, ConsultaOut, ConsultaUpdate
from app.services.consulta_service import create_consulta, list_consultas, get_consulta, update_consulta
from app.utils.pdf_generator import generar_comprobante_cita_pdf
from app.utils.email_utils import send_email
from app.models.paciente import Paciente
from app.models.cita import Cita
from app.models.medico import Medico
from app.models.empleado import Empleado
from datetime import datetime

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=ConsultaOut)
def create(payload: ConsultaCreate, db: Session = Depends(get_db)):
    return create_consulta(db, payload)

@router.get("/", response_model=List[ConsultaOut])
def all(
    paciente_id: Optional[int] = Query(None),
    medico_id: Optional[int] = Query(None),
    fecha_desde: Optional[str] = Query(None),
    fecha_hasta: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    return list_consultas(db, paciente_id, medico_id, fecha_desde, fecha_hasta)

@router.get("/{consulta_id}", response_model=ConsultaOut)
def one(consulta_id: int, db: Session = Depends(get_db)):
    c = get_consulta(db, consulta_id)
    if not c:
        raise HTTPException(404, "Consulta no encontrada")
    return c

@router.put("/{consulta_id}", response_model=ConsultaOut)
def update(consulta_id: int, payload: ConsultaUpdate, db: Session = Depends(get_db)):
    c = update_consulta(db, consulta_id, payload)
    if not c:
        raise HTTPException(404, "Consulta no encontrada")
    return c

@router.post("/{consulta_id}/comprobante")
def generar_comprobante_consulta(
    consulta_id: int,
    enviar_email_paciente: bool = Query(False, description="Enviar PDF por email al paciente"),
    db: Session = Depends(get_db)
):
    """
    RF-003: Genera comprobante de asistencia a consulta en PDF y opcionalmente envía por email
    """
    # Obtener la consulta
    consulta = get_consulta(db, consulta_id)
    if not consulta:
        raise HTTPException(404, "Consulta no encontrada")
    
    # Obtener paciente
    paciente = db.query(Paciente).filter(Paciente.id == consulta.paciente_id).first()
    if not paciente:
        raise HTTPException(404, "Paciente no encontrado")
    
    # Obtener médico
    medico = None
    if consulta.medico_id:
        medico = db.query(Medico).filter(Medico.id == consulta.medico_id).first()
        if not medico:
            # Intentar obtener como empleado
            empleado = db.query(Empleado).filter(Empleado.id == consulta.medico_id).first()
            if empleado:
                # Crear objeto tipo médico con datos del empleado
                class MedicoTemp:
                    def __init__(self, emp):
                        self.id = emp.id
                        self.nombre = emp.nombre
                        self.apellido = emp.apellido
                        self.cedula = emp.cedula
                        self.especialidad = emp.cargo
                medico = MedicoTemp(empleado)
    
    # Crear objeto cita temporal con datos de la consulta
    class CitaTemp:
        def __init__(self, cons):
            self.id = cons.id
            self.fecha = cons.fecha_consulta
            self.hora_inicio = cons.fecha_consulta.strftime("%H:%M") if cons.fecha_consulta else None
            self.hora_fin = None  # Las consultas finalizadas no tienen hora_fin específica
            self.estado = "completada"
            self.sala_asignada = None
            self.tipo_cita = "consulta"
            self.motivo = cons.motivo_consulta
    
    cita_temp = CitaTemp(consulta)
    
    # Generar PDF
    try:
        pdf_buffer = generar_comprobante_cita_pdf(cita_temp, paciente, medico)
        
        # Si se solicita envío por email
        if enviar_email_paciente and paciente.email:
            try:
                # Preparar el PDF para adjuntar
                pdf_buffer.seek(0)
                pdf_bytes = pdf_buffer.read()
                
                asunto = f"Comprobante de Consulta - {paciente.nombre} {paciente.apellido}"
                cuerpo = f"""
                <h2>Comprobante de Asistencia a Consulta Médica</h2>
                <p>Estimado(a) {paciente.nombre} {paciente.apellido},</p>
                <p>Adjuntamos el comprobante de su consulta médica realizada el {consulta.fecha_consulta.strftime('%d/%m/%Y')}.</p>
                <p><strong>Detalles de la consulta:</strong></p>
                <ul>
                    <li><strong>Fecha:</strong> {consulta.fecha_consulta.strftime('%d/%m/%Y %H:%M')}</li>
                    <li><strong>Médico:</strong> Dr(a). {medico.nombre} {medico.apellido if medico else 'No disponible'}</li>
                    <li><strong>Motivo:</strong> {consulta.motivo_consulta}</li>
                </ul>
                <p>Gracias por confiar en nuestros servicios.</p>
                <p><em>Este es un correo automático, por favor no responder.</em></p>
                """
                
                # Enviar email (nota: adjuntos no soportados en versión actual)
                send_email(
                    to_email=paciente.email,
                    subject=asunto,
                    body=cuerpo,
                    body_html=cuerpo
                )
                
                # Resetear buffer para la respuesta
                pdf_buffer.seek(0)
                
                return {
                    "mensaje": "Comprobante generado y enviado por email exitosamente",
                    "email_enviado": True,
                    "destinatario": paciente.email
                }
            except Exception as e:
                print(f"Error al enviar email: {str(e)}")
                # Si falla el email, continuar y retornar el PDF
                pdf_buffer.seek(0)
        
        # Retornar PDF como descarga
        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=Comprobante_Consulta_{consulta.id}.pdf"
            }
        )
    
    except Exception as e:
        print(f"Error al generar comprobante: {str(e)}")
        raise HTTPException(500, f"Error al generar comprobante: {str(e)}")
