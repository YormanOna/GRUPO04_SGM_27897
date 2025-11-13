from sqlalchemy.orm import Session
from sqlalchemy import JSON
from typing import Optional
from datetime import datetime
from app.models.consulta import Consulta
from app.models.cita import Cita
from app.models.historia import Historia
from app.schemas.consulta_schema import ConsultaCreate, ConsultaUpdate
import json

def create_consulta(db: Session, payload: ConsultaCreate):
    from app.models.paciente import Paciente
    from fastapi import HTTPException
    
    # Validar que el paciente exista
    paciente = db.query(Paciente).filter(Paciente.id == payload.paciente_id).first()
    if not paciente:
        raise HTTPException(status_code=404, detail=f"Paciente con ID {payload.paciente_id} no encontrado")
    
    # Obtener cita para extraer paciente_id e historia_id
    historia_id = payload.historia_id
    paciente_id = payload.paciente_id
    
    if payload.cita_id:
        cita = db.query(Cita).filter(Cita.id == payload.cita_id).first()
        if cita:
            paciente_id = cita.paciente_id
            # Buscar paciente y su historia clínica
            paciente = db.query(Paciente).filter(Paciente.id == paciente_id).first()
            if paciente:
                # Buscar o crear historia clínica
                if not paciente.historia_id:
                    # Crear nueva historia clínica
                    historia = Historia(identificador=f"H-{paciente.cedula}")
                    db.add(historia)
                    db.flush()
                    paciente.historia_id = historia.id
                    db.flush()
                historia_id = paciente.historia_id
    
    # Convertir signos_vitales dict a JSON
    signos_vitales_json = None
    if payload.signos_vitales:
        signos_vitales_json = payload.signos_vitales

    consulta = Consulta(
        cita_id=payload.cita_id,
        historia_id=historia_id,
        paciente_id=paciente_id,
        medico_id=payload.medico_id,
        motivo_consulta=payload.motivo_consulta,
        enfermedad_actual=payload.enfermedad_actual,
        examen_fisico=payload.examen_fisico,
        diagnostico=payload.diagnostico,
        diagnosticos_secundarios=payload.diagnosticos_secundarios,
        tratamiento=payload.tratamiento,
        indicaciones=payload.indicaciones,
        examenes_solicitados=payload.examenes_solicitados,
        pronostico=payload.pronostico,
        observaciones=payload.observaciones,
        signos_vitales=signos_vitales_json
    )
    db.add(consulta)
    
    # Asignar sala a la cita cuando se registran signos vitales
    if payload.cita_id and signos_vitales_json:
        cita = db.query(Cita).filter(Cita.id == payload.cita_id).first()
        if cita and not cita.sala_asignada:
            # Asignar sala basado en el médico (puedes personalizar la lógica)
            from app.models.medico import Medico
            sala = "Consultorio General"
            if cita.medico_id:
                medico = db.query(Medico).filter(Medico.id == cita.medico_id).first()
                if medico:
                    # Asignar sala según especialidad
                    especialidad_salas = {
                        "Cardiología": "Consultorio 1 - Cardiología",
                        "Pediatría": "Consultorio 2 - Pediatría",
                        "Medicina General": "Consultorio 3 - Medicina General",
                        "Ginecología": "Consultorio 4 - Ginecología",
                        "Traumatología": "Consultorio 5 - Traumatología"
                    }
                    sala = especialidad_salas.get(medico.especialidad, f"Consultorio {cita.medico_id}")
            
            cita.sala_asignada = sala
            cita.estado = "en_consulta"  # Cambiar estado a en consulta
            print(f"✅ Sala asignada a cita #{cita.id}: {sala}")
    
    db.commit()
    db.refresh(consulta)
    return consulta

def list_consultas(
    db: Session, 
    paciente_id: Optional[int] = None,
    medico_id: Optional[int] = None,
    fecha_desde: Optional[str] = None,
    fecha_hasta: Optional[str] = None
):
    query = db.query(Consulta)
    
    if paciente_id:
        query = query.filter(Consulta.paciente_id == paciente_id)
    if medico_id:
        query = query.filter(Consulta.medico_id == medico_id)
    if fecha_desde:
        query = query.filter(Consulta.fecha_consulta >= fecha_desde)
    if fecha_hasta:
        query = query.filter(Consulta.fecha_consulta <= fecha_hasta)
    
    return query.all()

def get_consulta(db: Session, consulta_id: int):
    return db.query(Consulta).filter(Consulta.id == consulta_id).first()

def update_consulta(db: Session, consulta_id: int, payload: ConsultaUpdate):
    consulta = db.query(Consulta).filter(Consulta.id == consulta_id).first()
    if not consulta:
        return None
    
    update_data = payload.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(consulta, field, value)
    
    db.commit()
    db.refresh(consulta)
    return consulta
