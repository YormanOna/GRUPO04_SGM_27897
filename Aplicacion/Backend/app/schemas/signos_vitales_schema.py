from pydantic import BaseModel, validator, Field
from typing import Optional
import re

class SignosVitalesBase(BaseModel):
    presion_arterial: Optional[str] = Field(None, description="Formato: XXX/XX (ej: 120/80)")
    presion: Optional[float] = Field(None, ge=0, le=300, description="Presión en mmHg")
    frecuencia_cardiaca: Optional[int] = Field(None, ge=0, le=250, description="Latidos por minuto")
    frecuencia_respiratoria: Optional[int] = Field(None, ge=0, le=100, description="Respiraciones por minuto")
    temperatura: Optional[float] = Field(None, ge=30.0, le=45.0, description="Temperatura en °C")
    saturacion_oxigeno: Optional[float] = Field(None, ge=0.0, le=100.0, description="Saturación de oxígeno en %")
    peso: Optional[float] = Field(None, ge=0.1, le=500.0, description="Peso en kilogramos")
    talla: Optional[float] = Field(None, ge=0.1, le=3.0, description="Talla en metros")
    imc: Optional[float] = Field(None, ge=0.0, le=100.0, description="Índice de masa corporal")
    observaciones: Optional[str] = Field(None, max_length=500, description="Observaciones adicionales")
    
    @validator('presion_arterial')
    def validar_formato_presion_arterial(cls, v):
        """
        Valida que la presión arterial tenga formato XXX/XX
        Ejemplos válidos: 120/80, 110/70, 130/85
        """
        if v is None:
            return v
        
        # Permitir formato con slash (/)
        patron = r'^\d{2,3}/\d{2,3}$'
        if not re.match(patron, v):
            raise ValueError(
                f"Formato inválido de presión arterial: '{v}'. "
                f"Use formato XXX/XX (ejemplo: 120/80)"
            )
        
        # Validar rangos razonables
        try:
            sistolica, diastolica = map(int, v.split('/'))
            if not (50 <= sistolica <= 250):
                raise ValueError(f"Presión sistólica fuera de rango (50-250): {sistolica}")
            if not (30 <= diastolica <= 150):
                raise ValueError(f"Presión diastólica fuera de rango (30-150): {diastolica}")
            if sistolica <= diastolica:
                raise ValueError(f"Presión sistólica debe ser mayor que diastólica: {v}")
        except ValueError as e:
            if "invalid literal" in str(e):
                raise ValueError(f"Valores numéricos inválidos en presión arterial: '{v}'")
            raise
        
        return v

class SignosVitalesCreate(SignosVitalesBase):
    pass

class SignosVitalesOut(SignosVitalesBase):
    id: int

    class Config:
        orm_mode = True
