from pydantic import BaseModel, Field
from datetime import date, datetime
from typing import Optional

class LoteBase(BaseModel):
    """Schema base para Lote"""
    medicamento_id: int
    numero_lote: str = Field(..., max_length=50)
    fecha_ingreso: date
    fecha_vencimiento: date
    cantidad_inicial: int = Field(..., gt=0)
    cantidad_disponible: int = Field(..., ge=0)
    ubicacion_fisica: Optional[str] = Field(None, max_length=100)
    proveedor: Optional[str] = Field(None, max_length=150)
    numero_factura: Optional[str] = Field(None, max_length=50)
    costo_unitario: Optional[float] = Field(None, ge=0)
    estado: str = Field(default="disponible", max_length=30)
    observaciones: Optional[str] = Field(None, max_length=255)

class LoteCreate(LoteBase):
    """Schema para crear un lote"""
    pass

class LoteUpdate(BaseModel):
    """Schema para actualizar un lote"""
    cantidad_disponible: Optional[int] = Field(None, ge=0)
    ubicacion_fisica: Optional[str] = Field(None, max_length=100)
    estado: Optional[str] = Field(None, max_length=30)
    observaciones: Optional[str] = Field(None, max_length=255)

class LoteResponse(LoteBase):
    """Schema de respuesta para Lote"""
    id: int
    created_at: datetime
    updated_at: datetime
    
    # Información del medicamento (para listar lotes)
    medicamento_nombre: Optional[str] = None

    class Config:
        from_attributes = True

class LoteListItem(BaseModel):
    """Schema simplificado para listar lotes"""
    id: int
    numero_lote: str
    fecha_vencimiento: date
    cantidad_disponible: int
    estado: str
    ubicacion_fisica: Optional[str] = None
    dias_para_vencer: Optional[int] = None  # Calculado
    
    class Config:
        from_attributes = True

class LoteStockInfo(BaseModel):
    """Schema para información de stock por lote (usado en dispensación)"""
    id: int
    numero_lote: str
    fecha_vencimiento: date
    cantidad_disponible: int
    ubicacion_fisica: Optional[str] = None
    estado: str
    
    class Config:
        from_attributes = True
