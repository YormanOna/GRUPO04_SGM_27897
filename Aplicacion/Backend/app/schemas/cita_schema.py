from pydantic import BaseModel, Field, validator
from datetime import datetime, time as dt_time, timedelta
from typing import Optional, Literal
from enum import Enum
from app.schemas.paciente_schema import PacienteOut
from app.schemas.medico_schema import MedicoOut


class TipoCitaEnum(str, Enum):
    """Tipos de cita disponibles"""
    CONSULTA = "consulta"
    SEGUIMIENTO = "seguimiento"
    EMERGENCIA = "emergencia"


class EstadoCitaEnum(str, Enum):
    """Estados de cita disponibles"""
    PROGRAMADA = "programada"
    CONFIRMADA = "confirmada"
    EN_ESPERA = "en_espera"
    EN_CONSULTA = "en_consulta"
    COMPLETADA = "completada"
    CANCELADA = "cancelada"
    NO_ASISTIO = "no_asistio"

class CitaBase(BaseModel):
    fecha: datetime
    hora_inicio: Optional[str] = Field(None, description="Hora de inicio (formato HH:MM)", example="09:00")
    hora_fin: Optional[str] = Field(None, description="Hora de fin (formato HH:MM)", example="09:30")
    motivo: Optional[str] = Field(None, description="Motivo de la cita", example="Consulta general")
    estado: EstadoCitaEnum = Field(default=EstadoCitaEnum.PROGRAMADA, description="Estado de la cita")
    sala_asignada: Optional[str] = Field(None, description="Sala o consultorio asignado", example="Consultorio 101")
    tipo_cita: TipoCitaEnum = Field(default=TipoCitaEnum.CONSULTA, description="Tipo de cita")

class CitaCreate(CitaBase):
    paciente_id: int
    medico_id: Optional[int] = None
    encargado_id: Optional[int] = None
    
    @validator('fecha')
    def validar_fecha_futura(cls, v):
        """
        Valida que la fecha de la cita sea en el futuro
        """
        if v is None:
            return v
        
        # Obtener la fecha/hora actual con UTC
        from datetime import timezone
        ahora = datetime.now(timezone.utc)
        
        # Convertir v a datetime si es necesario
        if isinstance(v, datetime):
            fecha_cita = v
        else:
            fecha_cita = datetime.fromisoformat(str(v).replace('Z', '+00:00'))
        
        # Asegurarse de que fecha_cita tenga zona horaria
        if fecha_cita.tzinfo is None:
            # Si no tiene zona horaria, asumimos UTC
            fecha_cita = fecha_cita.replace(tzinfo=timezone.utc)
        
        # Validar que sea fecha futura (con margen de 1 hora para citas del mismo día)
        if fecha_cita < ahora - timedelta(hours=1):
            raise ValueError(
                f"No se pueden crear citas en el pasado. "
                f"Fecha proporcionada: {fecha_cita.strftime('%d/%m/%Y %H:%M')}, "
                f"Fecha actual: {ahora.strftime('%d/%m/%Y %H:%M')}"
            )
        
        return v
    
    @validator('hora_fin')
    def validar_hora_fin_mayor_inicio(cls, v, values):
        """
        Valida que hora_fin sea mayor que hora_inicio
        """
        if v is None or 'hora_inicio' not in values or values['hora_inicio'] is None:
            return v
        
        hora_inicio = values['hora_inicio']
        hora_fin = v
        
        # Convertir strings a objetos time para comparar
        try:
            # Parsear hora_inicio (formato "HH:MM" o "HH:MM:SS")
            if isinstance(hora_inicio, str):
                partes_inicio = hora_inicio.split(':')
                time_inicio = dt_time(int(partes_inicio[0]), int(partes_inicio[1]))
            else:
                time_inicio = hora_inicio
            
            # Parsear hora_fin
            if isinstance(hora_fin, str):
                partes_fin = hora_fin.split(':')
                time_fin = dt_time(int(partes_fin[0]), int(partes_fin[1]))
            else:
                time_fin = hora_fin
            
            # Validar que hora_fin > hora_inicio
            if time_fin <= time_inicio:
                raise ValueError(
                    f"La hora de fin ({hora_fin}) debe ser mayor que la hora de inicio ({hora_inicio})"
                )
        
        except (ValueError, IndexError) as e:
            if "debe ser mayor" in str(e):
                raise
            raise ValueError(f"Formato de hora inválido: {e}")
        
        return v

class CitaUpdate(BaseModel):
    fecha: Optional[datetime] = None
    hora_inicio: Optional[str] = None
    hora_fin: Optional[str] = None
    motivo: Optional[str] = None
    estado: Optional[EstadoCitaEnum] = None
    medico_id: Optional[int] = None
    sala_asignada: Optional[str] = None
    tipo_cita: Optional[TipoCitaEnum] = None
    observaciones_cancelacion: Optional[str] = None

class CitaOut(CitaBase):
    id: int
    paciente_id: int
    medico_id: Optional[int] = None
    encargado_id: Optional[int] = None
    observaciones_cancelacion: Optional[str] = None
    
    # Campos opcionales para información adicional (sin validación estricta)
    paciente_nombre: Optional[str] = None
    paciente_apellido: Optional[str] = None
    paciente_cedula: Optional[str] = None
    paciente_edad: Optional[int] = None  # ¡AGREGADO! Edad calculada del paciente
    paciente_genero: Optional[str] = None
    paciente_telefono: Optional[str] = None
    
    medico_nombre: Optional[str] = None
    medico_apellido: Optional[str] = None
    medico_especialidad: Optional[str] = None
    
    # Relaciones completas (opcional, para respuestas detalladas)
    paciente: Optional[PacienteOut] = None
    medico: Optional[MedicoOut] = None

    class Config:
        orm_mode = True
