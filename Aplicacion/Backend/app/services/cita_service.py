from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, func
from app.models.cita import Cita
from app.models.paciente import Paciente
from app.models.medico import Medico
from app.models.empleado import Empleado
from app.schemas.cita_schema import CitaCreate, CitaUpdate
from app.utils.email_utils import (
    enviar_confirmacion_cita,
    enviar_cancelacion_cita,
    enviar_reprogramacion_cita
)
from app.core.websocket import manager
from fastapi import HTTPException
import asyncio
from datetime import datetime, timedelta, date
from app.services.auditoria_service import auditoria_service


def create_cita(db: Session, payload: CitaCreate, empleado_id: int = None):
    """
    Crea una cita con validaciones y notificaciones (RF-001)
    """
    # Validar que el paciente existe
    paciente = db.query(Paciente).filter(Paciente.id == payload.paciente_id).first()
    if not paciente:
        raise HTTPException(status_code=404, detail="Paciente no encontrado")
    
    # Validar que el médico existe si se proporciona
    if payload.medico_id:
        medico = db.query(Medico).filter(Medico.id == payload.medico_id).first()
        if not medico:
            raise HTTPException(status_code=404, detail="Médico no encontrado")
    
    # Validar disponibilidad del bloque horario (RF-001)
    if payload.hora_inicio and payload.hora_fin:
        conflicto = db.query(Cita).filter(
            and_(
                Cita.medico_id == payload.medico_id,
                Cita.fecha == payload.fecha.date() if hasattr(payload.fecha, 'date') else payload.fecha,
                Cita.estado.in_(['programada', 'confirmada']),
                or_(
                    and_(
                        Cita.hora_inicio <= payload.hora_inicio,
                        Cita.hora_fin > payload.hora_inicio
                    ),
                    and_(
                        Cita.hora_inicio < payload.hora_fin,
                        Cita.hora_fin >= payload.hora_fin
                    )
                )
            )
        ).first()
        
        if conflicto:
            raise HTTPException(
                status_code=400,
                detail=f"El bloque horario no está disponible. Conflicto con cita #{conflicto.id}"
            )
    
    # Crear la cita
    c = Cita(
        fecha=payload.fecha,
        hora_inicio=payload.hora_inicio,
        hora_fin=payload.hora_fin,
        paciente_id=payload.paciente_id,
        medico_id=payload.medico_id,
        encargado_id=payload.encargado_id,
        motivo=payload.motivo,
        estado=payload.estado or "Pendiente",
        sala_asignada=payload.sala_asignada,
        tipo_cita=payload.tipo_cita,
        activo=True  # Asegurar que se crea como activa
    )
    db.add(c)
    db.commit()
    db.refresh(c)
    
    # Registrar en auditoría
    if empleado_id:
        try:
            empleado = db.query(Empleado).filter(Empleado.id == empleado_id).first()
            medico_nombre = "Por asignar"
            if payload.medico_id:
                medico_obj = db.query(Medico).filter(Medico.id == payload.medico_id).first()
                if medico_obj and medico_obj.empleado:
                    medico_nombre = f"{medico_obj.empleado.nombre} {medico_obj.empleado.apellido}"
            
            auditoria_service.registrar_accion(
                db=db,
                usuario_id=empleado_id,
                usuario_nombre=f"{empleado.nombre} {empleado.apellido}" if empleado else "Sistema",
                usuario_cargo=empleado.cargo if empleado else "Sistema",
                accion="CREAR",
                modulo="Citas",
                descripcion=f"Nueva cita creada para {paciente.nombre} {paciente.apellido}",
                tabla_afectada="citas",
                registro_id=c.id,
                datos_nuevos={
                    "paciente": f"{paciente.nombre} {paciente.apellido}",
                    "medico": medico_nombre,
                    "fecha": c.fecha.strftime('%d/%m/%Y'),
                    "estado": c.estado,
                    "tipo": c.tipo_cita
                }
            )
        except Exception as e:
            print(f"Error registrando auditoría: {e}")
    
    # Enviar notificación WebSocket a todos los usuarios
    try:
        asyncio.create_task(manager.broadcast({
            "type": "cita_creada",
            "title": "Nueva cita",
            "message": f"Nueva cita registrada: {paciente.nombre} {paciente.apellido}",
            "data": {"cita_id": c.id, "paciente_id": c.paciente_id}
        }))
    except Exception as e:
        print(f"Error enviando notificación WebSocket: {e}")
    
    # Enviar email de confirmación de forma ASÍNCRONA (no bloquear la respuesta)
    # Si falla el email, solo se loguea el error pero NO se hace rollback de la cita
    if paciente.email:
        try:
            medico_nombre = "Por asignar"
            if payload.medico_id:
                medico_obj = db.query(Medico).filter(Medico.id == payload.medico_id).first()
                if medico_obj and medico_obj.empleado:
                    medico_nombre = f"{medico_obj.empleado.nombre} {medico_obj.empleado.apellido}"
            
            # Construir fecha/hora completa combinando fecha + hora_inicio
            from datetime import datetime as dt, time
            if isinstance(c.fecha, dt):
                fecha_base = c.fecha.date()
            else:
                fecha_base = c.fecha
            
            # Parsear hora_inicio (formato "HH:MM:SS" o "HH:MM")
            if c.hora_inicio:
                hora_partes = c.hora_inicio.split(':')
                hora_obj = time(int(hora_partes[0]), int(hora_partes[1]))
                fecha_hora_completa = dt.combine(fecha_base, hora_obj)
            else:
                fecha_hora_completa = dt.combine(fecha_base, time(8, 0))
            
            # Intentar enviar email (sin bloquear ni hacer rollback si falla)
            enviar_confirmacion_cita(
                paciente.email,
                f"{paciente.nombre} {paciente.apellido}",
                fecha_hora_completa,
                medico_nombre,
                c.motivo or "Consulta médica",
                c.id
            )
            print(f"✅ Email de confirmación enviado a {paciente.email}")
        except Exception as e:
            # Solo loguear el error, no afectar la creación de la cita
            print(f"⚠️ No se pudo enviar email de confirmación: {e}")
            print(f"   Cita #{c.id} creada correctamente sin notificación por email")
    
    # Notificar via WebSocket (opcional - comentado para evitar error de event loop en contexto síncrono)
    # try:
    #     from app.core.websocket import notificar_cita_actualizada
    #     asyncio.create_task(
    #         notificar_cita_actualizada(
    #             c.id,
    #             c.paciente_id,
    #             c.estado,
    #             f"Cita agendada para {c.fecha.strftime('%d/%m/%Y %H:%M')}"
    #         )
    #     )
    # except Exception as e:
    #     print(f"No se pudo enviar notificación WebSocket: {e}")
    
    return c

def list_citas(db: Session, medico_id: int = None):
    """
    Lista citas. Si se proporciona medico_id, solo devuelve citas de ese médico.
    Carga relaciones con paciente y médico para incluir información adicional.
    """
    query = db.query(Cita).options(
        joinedload(Cita.paciente),
        joinedload(Cita.medico).joinedload(Medico.empleado)
    ).filter(
        or_(Cita.activo == True, Cita.activo.is_(None))  # Incluir activas y NULL
    )
    
    if medico_id:
        query = query.filter(Cita.medico_id == medico_id)
    
    citas = query.all()
    
    # Corregir registros con activo=NULL y agregar información adicional
    for cita in citas:
        # Corregir activo=NULL (migración automática)
        if cita.activo is None:
            cita.activo = True
        
        if cita.paciente:
            cita.paciente_nombre = cita.paciente.nombre
            cita.paciente_apellido = cita.paciente.apellido
            cita.paciente_cedula = str(cita.paciente.cedula)
            cita.paciente_edad = cita.paciente.edad  # Edad calculada desde fecha_nacimiento
            cita.paciente_genero = cita.paciente.genero
            cita.paciente_telefono = cita.paciente.telefono
        
        if cita.medico:
            if cita.medico.empleado:
                cita.medico_nombre = cita.medico.empleado.nombre
                cita.medico_apellido = cita.medico.empleado.apellido
            else:
                cita.medico_nombre = cita.medico.nombre
                cita.medico_apellido = cita.medico.apellido
            cita.medico_especialidad = cita.medico.especialidad
    
    # Hacer commit si hubo cambios
    if any(c.activo is None for c in citas):
        db.commit()
    
    return citas

def get_cita(db: Session, cita_id: int):
    cita = db.query(Cita).options(
        joinedload(Cita.paciente),
        joinedload(Cita.medico).joinedload(Medico.empleado)
    ).filter(Cita.id == cita_id).first()
    
    if cita:
        # Corregir activo=NULL si existe (migración automática)
        if cita.activo is None:
            cita.activo = True
            db.commit()
            db.refresh(cita)
        
        # Agregar información adicional
        if cita.paciente:
            cita.paciente_nombre = cita.paciente.nombre
            cita.paciente_apellido = cita.paciente.apellido
            cita.paciente_cedula = str(cita.paciente.cedula)
            cita.paciente_edad = cita.paciente.edad  # Edad calculada desde fecha_nacimiento
            cita.paciente_genero = cita.paciente.genero
            cita.paciente_telefono = cita.paciente.telefono
        
        if cita.medico:
            if cita.medico.empleado:
                cita.medico_nombre = cita.medico.empleado.nombre
                cita.medico_apellido = cita.medico.empleado.apellido
            else:
                cita.medico_nombre = cita.medico.nombre
                cita.medico_apellido = cita.medico.apellido
            cita.medico_especialidad = cita.medico.especialidad
    
    return cita

def update_cita(db: Session, cita_id: int, payload: CitaUpdate, empleado_id: int = None):
    """
    Actualiza una cita con notificaciones (RF-001)
    Maneja cancelaciones y reprogramaciones con envío de emails
    """
    cita = get_cita(db, cita_id)
    if not cita:
        return None
    
    # Obtener datos del paciente para notificaciones
    paciente = db.query(Paciente).filter(Paciente.id == cita.paciente_id).first()
    
    # Guardar datos anteriores para notificaciones y auditoría
    estado_anterior = cita.estado
    fecha_anterior = cita.fecha
    
    # Detectar si es cancelación
    es_cancelacion = (
        payload.estado == "cancelada" and 
        estado_anterior != "cancelada"
    )
    
    # Detectar si es reprogramación (cambio de fecha)
    es_reprogramacion = (
        payload.fecha is not None and 
        payload.fecha != fecha_anterior and
        estado_anterior not in ["cancelada", "completada"]
    )
    
    # Actualizar solo los campos proporcionados
    for field, value in payload.dict(exclude_unset=True).items():
        setattr(cita, field, value)
    
    db.commit()
    db.refresh(cita)
    
    # Registrar en auditoría
    if empleado_id:
        try:
            empleado = db.query(Empleado).filter(Empleado.id == empleado_id).first()
            cambios = []
            datos_anteriores = {}
            datos_nuevos = {}
            
            if es_cancelacion:
                cambios.append(f"Estado: {estado_anterior} → cancelada")
                datos_anteriores["estado"] = estado_anterior
                datos_nuevos["estado"] = "cancelada"
            elif es_reprogramacion:
                cambios.append(f"Fecha: {fecha_anterior.strftime('%d/%m/%Y')} → {cita.fecha.strftime('%d/%m/%Y')}")
                datos_anteriores["fecha"] = fecha_anterior.strftime('%d/%m/%Y')
                datos_nuevos["fecha"] = cita.fecha.strftime('%d/%m/%Y')
            elif estado_anterior != cita.estado:
                cambios.append(f"Estado: {estado_anterior} → {cita.estado}")
                datos_anteriores["estado"] = estado_anterior
                datos_nuevos["estado"] = cita.estado
            
            # Agregar otros cambios detectados
            if payload.medico_id is not None:
                cambios.append(f"Médico actualizado")
            if payload.hora_inicio is not None or payload.hora_fin is not None:
                cambios.append(f"Horario modificado")
            
            detalles_cambios = ", ".join(cambios) if cambios else "Actualización de cita"
            paciente_nombre = f"{paciente.nombre} {paciente.apellido}" if paciente else "Desconocido"
            
            auditoria_service.registrar_accion(
                db=db,
                usuario_id=empleado_id,
                usuario_nombre=f"{empleado.nombre} {empleado.apellido}" if empleado else "Sistema",
                usuario_cargo=empleado.cargo if empleado else "Sistema",
                accion="ACTUALIZAR",
                modulo="Citas",
                descripcion=f"Cita actualizada para {paciente_nombre}",
                tabla_afectada="citas",
                registro_id=cita_id,
                datos_anteriores=datos_anteriores if datos_anteriores else None,
                datos_nuevos=datos_nuevos if datos_nuevos else None,
                detalles_adicionales={"cambios": detalles_cambios}
            )
        except Exception as e:
            print(f"Error registrando auditoría: {e}")
    
    # Enviar notificación WebSocket sobre actualización
    try:
        asyncio.create_task(manager.broadcast({
            "type": "cita_actualizada",
            "title": "Cita actualizada",
            "message": f"La cita de {paciente.nombre if paciente else 'un paciente'} ha sido actualizada",
            "data": {"cita_id": cita.id, "nuevo_estado": cita.estado}
        }))
    except Exception as e:
        print(f"Error enviando notificación WebSocket: {e}")
    
    # Enviar notificaciones por email según el caso (RF-001)
    if paciente and paciente.email:
        try:
            if es_cancelacion:
                # Email de cancelación
                motivo = cita.observaciones_cancelacion or "No especificado"
                enviar_cancelacion_cita(
                    paciente.email,
                    f"{paciente.nombre} {paciente.apellido}",
                    fecha_anterior,
                    motivo
                )
            elif es_reprogramacion:
                # Email de reprogramación
                medico_nombre = "Por asignar"
                if cita.medico_id:
                    medico = db.query(Medico).filter(Medico.id == cita.medico_id).first()
                    if medico and medico.empleado:
                        medico_nombre = f"{medico.empleado.nombre} {medico.empleado.apellido}"
                
                enviar_reprogramacion_cita(
                    paciente.email,
                    f"{paciente.nombre} {paciente.apellido}",
                    fecha_anterior,
                    cita.fecha,
                    medico_nombre,
                    cita.id
                )
        except Exception as e:
            print(f"Error enviando notificación por email: {e}")
    
    # Notificar cambios vía WebSocket si cambió el estado (comentado - error de event loop)
    # if estado_anterior != cita.estado:
    #     try:
    #         from app.core.websocket import notificar_cita_actualizada
    #         mensajes = {
    #             "confirmada": "Su cita ha sido confirmada",
    #             "cancelada": "Su cita ha sido cancelada",
    #             "completada": "Su cita ha sido completada",
    #             "en_consulta": "Su cita está en curso",
    #             "no_asistio": "Marcada como no asistida"
    #         }
    #         mensaje = mensajes.get(cita.estado, f"Estado actualizado a: {cita.estado}")
    #         
    #         asyncio.create_task(
    #             notificar_cita_actualizada(cita.id, cita.paciente_id, cita.estado, mensaje)
    #         )
    #     except Exception as e:
    #         print(f"No se pudo enviar notificación WebSocket: {e}")
    
    # Recargar la cita con relaciones para información adicional
    cita_actualizada = get_cita(db, cita_id)
    return cita_actualizada

def delete_cita(db: Session, cita_id: int, empleado_id: int):
    """Borrado lógico de cita con registro de auditoría"""
    cita = get_cita(db, cita_id)
    if not cita:
        return None
    
    # Capturar información antes de eliminar para auditoría
    paciente_nombre = f"{cita.paciente.nombre} {cita.paciente.apellido}" if cita.paciente else "Desconocido"
    medico_nombre = f"{cita.medico.empleado.nombre} {cita.medico.empleado.apellido}" if cita.medico and cita.medico.empleado else "No asignado"
    fecha_cita = cita.fecha.strftime("%d/%m/%Y") if cita.fecha else "N/A"
    estado_cita = cita.estado
    
    # Borrado lógico en lugar de físico
    cita.soft_delete()
    db.commit()
    
    # Registrar en auditoría
    try:
        empleado = db.query(Empleado).filter(Empleado.id == empleado_id).first()
        auditoria_service.registrar_accion(
            db=db,
            usuario_id=empleado_id,
            usuario_nombre=f"{empleado.nombre} {empleado.apellido}" if empleado else "Sistema",
            usuario_cargo=empleado.cargo if empleado else "Sistema",
            accion="ELIMINAR",
            modulo="Citas",
            descripcion=f"Cita eliminada de {paciente_nombre}",
            tabla_afectada="citas",
            registro_id=cita_id,
            datos_anteriores={
                "paciente": paciente_nombre,
                "medico": medico_nombre,
                "fecha": fecha_cita,
                "estado": estado_cita
            }
        )
    except Exception as e:
        print(f"Error registrando auditoría: {e}")
    
    return True


def obtener_disponibilidad_medicos(db: Session, especialidad: str = None, fecha: date = None):
    """
    Obtiene la disponibilidad de médicos por especialidad (RF-001)
    """
    if not fecha:
        fecha = date.today()
    
    # Obtener médicos filtrados por especialidad si se proporciona
    # Usar joinedload para cargar la relación empleado
    query = db.query(Medico).options(joinedload(Medico.empleado))
    if especialidad:
        query = query.filter(Medico.especialidad == especialidad)
    
    medicos = query.all()
    
    disponibilidad = []
    for medico in medicos:
        # Obtener citas del médico en la fecha especificada
        citas = db.query(Cita).filter(
            and_(
                Cita.medico_id == medico.id,
                func.date(Cita.fecha) == fecha,
                Cita.estado.in_(['programada', 'confirmada', 'Pendiente', 'Confirmada'])
            )
        ).all()
        
        # Calcular bloques ocupados
        bloques_ocupados = []
        for cita in citas:
            if cita.hora_inicio and cita.hora_fin:
                bloques_ocupados.append({
                    'inicio': cita.hora_inicio,
                    'fin': cita.hora_fin,
                    'cita_id': cita.id
                })
        
        # Construir nombre del médico
        if medico.empleado:
            nombre_completo = f"{medico.empleado.nombre} {medico.empleado.apellido}"
        else:
            # Si no tiene empleado asociado, usar los datos directos del médico
            nombre_completo = f"{medico.nombre} {medico.apellido}"
        
        medico_info = {
            'medico_id': medico.id,
            'nombre': nombre_completo,
            'especialidad': medico.especialidad or "General",
            'bloques_ocupados': bloques_ocupados,
            'total_citas_dia': len(citas)
        }
        
        disponibilidad.append(medico_info)
    
    return disponibilidad


def validar_cita_del_dia(db: Session, cita_id: int):
    """
    Valida una cita del día actual y notifica a enfermería (RF-001)
    """
    cita = get_cita(db, cita_id)
    if not cita:
        raise HTTPException(status_code=404, detail="Cita no encontrada")
    
    # Verificar que la cita sea del día actual
    hoy = date.today()
    fecha_cita = cita.fecha.date() if hasattr(cita.fecha, 'date') else cita.fecha
    
    if fecha_cita != hoy:
        raise HTTPException(
            status_code=400,
            detail=f"Esta cita no es para hoy. Fecha de la cita: {fecha_cita.strftime('%d/%m/%Y')}"
        )
    
    # Actualizar estado a confirmada si está programada
    if cita.estado == "programada":
        cita.estado = "confirmada"
        db.commit()
    
    # Notificar a enfermería vía WebSocket (RF-001) - comentado por error de event loop
    # try:
    #     from app.core.websocket import manager
    #     
    #     paciente = db.query(Paciente).filter(Paciente.id == cita.paciente_id).first()
    #     paciente_nombre = f"{paciente.nombre} {paciente.apellido}" if paciente else "Paciente"
    #     
    #     # Notificar a todas las enfermeras
    #     asyncio.create_task(
    #         manager.send_to_role({
    #             "type": "paciente_validado",
    #             "title": "Paciente validado para atención",
    #             "message": f"{paciente_nombre} ha sido validado. Iniciar triaje.",
    #             "data": {
    #                 "cita_id": cita.id,
    #                 "paciente_id": cita.paciente_id,
    #                 "paciente_nombre": paciente_nombre,
    #                 "hora": datetime.now().strftime("%H:%M")
    #             }
    #         }, "Enfermera")
    #     )
    #     
    #     print(f"✅ Notificación enviada a enfermería para paciente {paciente_nombre}")
    # except Exception as e:
    #     print(f"Error notificando a enfermería: {e}")
    
    return cita


def obtener_citas_por_fecha(db: Session, fecha: date, medico_id: int = None):
    """
    Obtiene citas filtradas por fecha y opcionalmente por médico
    """
    query = db.query(Cita).options(
        joinedload(Cita.paciente),
        joinedload(Cita.medico).joinedload(Medico.empleado)
    ).filter(func.date(Cita.fecha) == fecha)
    
    if medico_id:
        query = query.filter(Cita.medico_id == medico_id)
    
    citas = query.order_by(Cita.hora_inicio).all()
    
    # Agregar información adicional a cada cita
    for cita in citas:
        if cita.paciente:
            cita.paciente_nombre = cita.paciente.nombre
            cita.paciente_apellido = cita.paciente.apellido
            cita.paciente_cedula = str(cita.paciente.cedula)
            cita.paciente_edad = cita.paciente.edad  # Edad calculada desde fecha_nacimiento
            cita.paciente_genero = cita.paciente.genero
            cita.paciente_telefono = cita.paciente.telefono
        
        if cita.medico:
            if cita.medico.empleado:
                cita.medico_nombre = cita.medico.empleado.nombre
                cita.medico_apellido = cita.medico.empleado.apellido
            else:
                cita.medico_nombre = cita.medico.nombre
                cita.medico_apellido = cita.medico.apellido
            cita.medico_especialidad = cita.medico.especialidad
    
    return citas


def cancelar_cita(db: Session, cita_id: int, motivo: str, usuario_id: int):
    """
    Cancela una cita con motivo obligatorio (RF-001)
    """
    if not motivo or len(motivo.strip()) < 10:
        raise HTTPException(
            status_code=400,
            detail="Debe proporcionar un motivo de cancelación de al menos 10 caracteres"
        )
    
    cita = get_cita(db, cita_id)
    if not cita:
        raise HTTPException(status_code=404, detail="Cita no encontrada")
    
    if cita.estado == "cancelada":
        raise HTTPException(status_code=400, detail="La cita ya está cancelada")
    
    if cita.estado == "completada":
        raise HTTPException(status_code=400, detail="No se puede cancelar una cita completada")
    
    # Actualizar cita con auditoría
    return update_cita(db, cita_id, CitaUpdate(
        estado="cancelada",
        observaciones_cancelacion=motivo
    ), empleado_id=usuario_id)


def reprogramar_cita(db: Session, cita_id: int, nueva_fecha: datetime, 
                     nueva_hora_inicio: str = None, nueva_hora_fin: str = None, empleado_id: int = None):
    """
    Reprograma una cita a nueva fecha/hora (RF-001)
    """
    cita = get_cita(db, cita_id)
    if not cita:
        raise HTTPException(status_code=404, detail="Cita no encontrada")
    
    if cita.estado in ["cancelada", "completada"]:
        raise HTTPException(
            status_code=400,
            detail=f"No se puede reprogramar una cita en estado: {cita.estado}"
        )
    
    # Validar disponibilidad en la nueva fecha/hora
    if cita.medico_id and nueva_hora_inicio and nueva_hora_fin:
        conflicto = db.query(Cita).filter(
            and_(
                Cita.id != cita_id,  # Excluir la cita actual
                Cita.medico_id == cita.medico_id,
                func.date(Cita.fecha) == nueva_fecha.date() if hasattr(nueva_fecha, 'date') else nueva_fecha,
                Cita.estado.in_(['programada', 'confirmada']),
                or_(
                    and_(
                        Cita.hora_inicio <= nueva_hora_inicio,
                        Cita.hora_fin > nueva_hora_inicio
                    ),
                    and_(
                        Cita.hora_inicio < nueva_hora_fin,
                        Cita.hora_fin >= nueva_hora_fin
                    )
                )
            )
        ).first()
        
        if conflicto:
            raise HTTPException(
                status_code=400,
                detail=f"El nuevo bloque horario no está disponible. Conflicto con cita #{conflicto.id}"
            )
    
    # Reprogramar con auditoría
    return update_cita(db, cita_id, CitaUpdate(
        fecha=nueva_fecha,
        hora_inicio=nueva_hora_inicio,
        hora_fin=nueva_hora_fin
    ), empleado_id=empleado_id)
