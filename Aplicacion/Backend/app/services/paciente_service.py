from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from app.models.paciente import Paciente
from app.models.historia import Historia
from app.schemas.paciente_schema import PacienteCreate, PacienteUpdate
from app.utils.validators import (
    validar_cedula_ecuatoriana, 
    validar_vigencia_poliza,
    generar_numero_historia_clinica,
    validar_edad_coherente
)
from fastapi import HTTPException
from datetime import date


def create_paciente(db: Session, payload: PacienteCreate):
    """
    Crea un paciente con validaciones completas y genera automáticamente
    su número de historia clínica (RF-001)
    """
    # Validar cédula ecuatoriana
    cedula_valida, mensaje = validar_cedula_ecuatoriana(str(payload.cedula))
    if not cedula_valida:
        raise HTTPException(status_code=400, detail=f"Cédula inválida: {mensaje}")
    
    # Verificar unicidad de cédula
    paciente_existente = db.query(Paciente).filter(Paciente.cedula == payload.cedula).first()
    if paciente_existente:
        raise HTTPException(status_code=400, detail="Ya existe un paciente con esta cédula")
    
    # Validar fecha de nacimiento si se proporciona
    if payload.fecha_nacimiento:
        fecha_valida, mensaje_fecha = validar_edad_coherente(payload.fecha_nacimiento)
        if not fecha_valida:
            raise HTTPException(status_code=400, detail=mensaje_fecha)
    
    # Validar email único si se proporciona
    if payload.email:
        email_existente = db.query(Paciente).filter(Paciente.email == payload.email).first()
        if email_existente:
            raise HTTPException(status_code=400, detail="Ya existe un paciente con este email")
    
    # Generar número de historia clínica único
    # Obtener el último número del día actual
    hoy = date.today()
    fecha_str = hoy.strftime("%Y%m%d")
    patron_hc = f"HCL-{fecha_str}-%"
    
    ultima_historia = db.query(Historia).filter(
        Historia.identificador.like(patron_hc)
    ).order_by(Historia.identificador.desc()).first()
    
    ultimo_numero = 0
    if ultima_historia:
        # Extraer el número secuencial del último registro
        partes = ultima_historia.identificador.split('-')
        if len(partes) == 3:
            try:
                ultimo_numero = int(partes[2])
            except ValueError:
                ultimo_numero = 0
    
    numero_hc = generar_numero_historia_clinica(ultimo_numero)
    
    # Crear la historia clínica primero
    historia = Historia(identificador=numero_hc)
    db.add(historia)
    db.flush()  # Obtener el ID sin hacer commit
    
    # Crear el paciente con todos los campos
    p = Paciente(
        nombre=payload.nombre,
        apellido=payload.apellido,
        cedula=payload.cedula,
        email=payload.email,
        telefono=payload.telefono,
        direccion=payload.direccion,
        fecha_nacimiento=payload.fecha_nacimiento,
        genero=payload.genero,
        grupo_sanguineo=payload.grupo_sanguineo,
        alergias=payload.alergias,
        antecedentes_medicos=payload.antecedentes_medicos,
        contacto_emergencia_nombre=payload.contacto_emergencia_nombre,
        contacto_emergencia_telefono=payload.contacto_emergencia_telefono,
        contacto_emergencia_relacion=payload.contacto_emergencia_relacion,
        tipo_seguro=payload.tipo_seguro,
        aseguradora=payload.aseguradora,
        numero_poliza=payload.numero_poliza,
        fecha_vigencia_poliza=payload.fecha_vigencia_poliza,
        historia_id=historia.id,
        activo=True  # Asegurar que el paciente está activo (no eliminado)
    )
    
    db.add(p)
    db.commit()
    db.refresh(p)
    
    return p

def list_pacientes(db: Session, medico_id: int = None):
    """
    Lista pacientes. Si se proporciona medico_id, solo devuelve pacientes de ese médico.
    """
    if medico_id:
        # Obtener pacientes que tienen citas con este médico
        from app.models.cita import Cita
        pacientes_ids = db.query(Cita.paciente_id).filter(Cita.medico_id == medico_id).distinct().all()
        pacientes_ids = [pid[0] for pid in pacientes_ids]
        # Filtrar solo pacientes activos (no eliminados) - incluye NULL como activo
        pacientes = db.query(Paciente).filter(
            Paciente.id.in_(pacientes_ids),
            or_(Paciente.activo == True, Paciente.activo.is_(None))
        ).all()
    else:
        # Filtrar solo pacientes activos (no eliminados) - incluye NULL como activo
        pacientes = db.query(Paciente).filter(
            or_(Paciente.activo == True, Paciente.activo.is_(None))
        ).all()
    
    # Corregir registros con activo=NULL (migración automática)
    for paciente in pacientes:
        if paciente.activo is None:
            paciente.activo = True
    
    # Hacer commit si hubo cambios
    if any(p.activo is None for p in pacientes):
        db.commit()
    
    # Agregar estado de póliza a cada paciente
    for paciente in pacientes:
        if paciente.fecha_vigencia_poliza:
            estado, _ = validar_vigencia_poliza(paciente.fecha_vigencia_poliza)
            paciente.estado_poliza = estado
        else:
            paciente.estado_poliza = 'sin_informacion'
        
        # Agregar número de historia clínica
        if paciente.historia:
            paciente.numero_historia_clinica = paciente.historia.identificador
    
    return pacientes


def get_paciente(db: Session, paciente_id: int):
    """
    Obtiene un paciente con información adicional de estado de póliza
    """
    paciente = db.query(Paciente).filter(Paciente.id == paciente_id).first()
    
    if paciente:
        # Corregir activo=NULL si existe (migración automática)
        if paciente.activo is None:
            paciente.activo = True
            db.commit()
            db.refresh(paciente)
        
        # Agregar estado de póliza
        if paciente.fecha_vigencia_poliza:
            estado, _ = validar_vigencia_poliza(paciente.fecha_vigencia_poliza)
            paciente.estado_poliza = estado
        else:
            paciente.estado_poliza = 'sin_informacion'
        
        # Agregar número de historia clínica
        if paciente.historia:
            paciente.numero_historia_clinica = paciente.historia.identificador
    
    return paciente


def buscar_pacientes(db: Session, termino: str):
    """
    Busca pacientes por cédula o nombre (RF-001)
    Retorna resultados en tiempo real
    """
    if not termino or len(termino) < 2:
        return []
    
    # Buscar por cédula (número exacto o parcial) o nombre/apellido
    # Incluir pacientes activos o con activo=NULL
    pacientes = db.query(Paciente).filter(
        or_(
            Paciente.cedula.like(f"%{termino}%"),
            Paciente.nombre.ilike(f"%{termino}%"),
            Paciente.apellido.ilike(f"%{termino}%"),
            func.concat(Paciente.nombre, ' ', Paciente.apellido).ilike(f"%{termino}%")
        ),
        or_(Paciente.activo == True, Paciente.activo.is_(None))
    ).limit(20).all()
    
    # Agregar información adicional y corregir activo=NULL
    for paciente in pacientes:
        # Corregir activo=NULL (migración automática)
        if paciente.activo is None:
            paciente.activo = True
        
        if paciente.fecha_vigencia_poliza:
            estado, _ = validar_vigencia_poliza(paciente.fecha_vigencia_poliza)
            paciente.estado_poliza = estado
        else:
            paciente.estado_poliza = 'sin_informacion'
        
        if paciente.historia:
            paciente.numero_historia_clinica = paciente.historia.identificador
    
    # Hacer commit si hubo cambios
    if any(p.activo is None for p in pacientes):
        db.commit()
    
    return pacientes

def update_paciente(db: Session, paciente_id: int, payload: PacienteUpdate):
    paciente = get_paciente(db, paciente_id)
    if not paciente:
        return None
    
    # Actualizar solo los campos proporcionados
    for field, value in payload.dict(exclude_unset=True).items():
        setattr(paciente, field, value)
    
    db.commit()
    db.refresh(paciente)
    return paciente

def delete_paciente(db: Session, paciente_id: int):
    """Borrado lógico de paciente"""
    p = get_paciente(db, paciente_id)
    if not p:
        return None
    # Borrado lógico en lugar de físico
    p.soft_delete()
    db.commit()
    return True
