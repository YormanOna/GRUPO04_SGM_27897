from sqlalchemy.orm import Session
from sqlalchemy import and_, desc
from datetime import date, timedelta
from typing import List, Optional
from app.models.lote import Lote
from app.models.medicamento import Medicamento
from app.schemas.lote_schema import LoteCreate, LoteUpdate

class LoteService:
    """
    RF-004: Servicio para gestión de lotes de medicamentos
    FEFO (First Expired, First Out) - Primero en vencer, primero en salir
    """
    
    @staticmethod
    def crear_lote(db: Session, lote_data: LoteCreate) -> Lote:
        """Crear un nuevo lote de medicamento"""
        # Verificar que el medicamento existe
        medicamento = db.query(Medicamento).filter(Medicamento.id == lote_data.medicamento_id).first()
        if not medicamento:
            raise ValueError("Medicamento no encontrado")
        
        # Crear el lote
        nuevo_lote = Lote(**lote_data.model_dump())
        nuevo_lote.estado = nuevo_lote.calcular_estado()
        
        db.add(nuevo_lote)
        db.commit()
        db.refresh(nuevo_lote)
        
        # Actualizar el stock total del medicamento
        LoteService._actualizar_stock_medicamento(db, lote_data.medicamento_id)
        
        return nuevo_lote
    
    @staticmethod
    def obtener_lote(db: Session, lote_id: int) -> Optional[Lote]:
        """Obtener un lote por ID"""
        return db.query(Lote).filter(Lote.id == lote_id).first()
    
    @staticmethod
    def obtener_lote_por_numero(db: Session, numero_lote: str) -> Optional[Lote]:
        """Obtener un lote por número de lote"""
        return db.query(Lote).filter(Lote.numero_lote == numero_lote).first()
    
    @staticmethod
    def listar_lotes(
        db: Session,
        medicamento_id: Optional[int] = None,
        estado: Optional[str] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Lote]:
        """Listar lotes con filtros opcionales"""
        query = db.query(Lote)
        
        if medicamento_id:
            query = query.filter(Lote.medicamento_id == medicamento_id)
        
        if estado:
            query = query.filter(Lote.estado == estado)
        
        # Ordenar por fecha de vencimiento (FEFO)
        query = query.order_by(Lote.fecha_vencimiento.asc())
        
        return query.offset(skip).limit(limit).all()
    
    @staticmethod
    def listar_lotes_disponibles_medicamento(db: Session, medicamento_id: int) -> List[Lote]:
        """
        Obtener lotes disponibles de un medicamento, ordenados por FEFO
        Solo lotes con cantidad > 0 y no vencidos
        """
        hoy = date.today()
        return db.query(Lote).filter(
            and_(
                Lote.medicamento_id == medicamento_id,
                Lote.cantidad_disponible > 0,
                Lote.fecha_vencimiento >= hoy,
                Lote.estado.in_(["disponible", "proximo_a_vencer"])
            )
        ).order_by(Lote.fecha_vencimiento.asc()).all()
    
    @staticmethod
    def actualizar_lote(db: Session, lote_id: int, lote_data: LoteUpdate) -> Optional[Lote]:
        """Actualizar un lote existente"""
        lote = db.query(Lote).filter(Lote.id == lote_id).first()
        if not lote:
            return None
        
        # Actualizar campos proporcionados
        for key, value in lote_data.model_dump(exclude_unset=True).items():
            setattr(lote, key, value)
        
        # Recalcular estado
        lote.estado = lote.calcular_estado()
        
        db.commit()
        db.refresh(lote)
        
        # Actualizar stock del medicamento
        LoteService._actualizar_stock_medicamento(db, lote.medicamento_id)
        
        return lote
    
    @staticmethod
    def descontar_cantidad_lote(db: Session, lote_id: int, cantidad: int) -> bool:
        """
        Descontar cantidad de un lote (usado en dispensación)
        Retorna True si se pudo descontar, False si no hay suficiente stock
        """
        lote = db.query(Lote).filter(Lote.id == lote_id).first()
        if not lote:
            return False
        
        if lote.cantidad_disponible < cantidad:
            return False
        
        lote.cantidad_disponible -= cantidad
        lote.estado = lote.calcular_estado()
        
        db.commit()
        db.refresh(lote)
        
        # Actualizar stock del medicamento
        LoteService._actualizar_stock_medicamento(db, lote.medicamento_id)
        
        return True
    
    @staticmethod
    def eliminar_lote(db: Session, lote_id: int) -> bool:
        """Borrado lógico de lote"""
        lote = db.query(Lote).filter(Lote.id == lote_id).first()
        if not lote:
            return False
        
        medicamento_id = lote.medicamento_id
        # Borrado lógico en lugar de físico
        lote.soft_delete()
        db.commit()
        
        # Actualizar stock del medicamento
        LoteService._actualizar_stock_medicamento(db, medicamento_id)
        
        return True
    
    @staticmethod
    def obtener_lotes_proximos_vencer(db: Session, dias: int = 30) -> List[Lote]:
        """Obtener lotes que vencen en los próximos X días"""
        fecha_limite = date.today() + timedelta(days=dias)
        return db.query(Lote).filter(
            and_(
                Lote.fecha_vencimiento <= fecha_limite,
                Lote.fecha_vencimiento >= date.today(),
                Lote.cantidad_disponible > 0
            )
        ).order_by(Lote.fecha_vencimiento.asc()).all()
    
    @staticmethod
    def obtener_lotes_vencidos(db: Session) -> List[Lote]:
        """Obtener lotes vencidos con stock disponible"""
        return db.query(Lote).filter(
            and_(
                Lote.fecha_vencimiento < date.today(),
                Lote.cantidad_disponible > 0
            )
        ).all()
    
    @staticmethod
    def actualizar_estados_lotes(db: Session):
        """
        Actualizar el estado de todos los lotes
        (Ejecutar periódicamente o al consultar)
        """
        lotes = db.query(Lote).all()
        for lote in lotes:
            nuevo_estado = lote.calcular_estado()
            if lote.estado != nuevo_estado:
                lote.estado = nuevo_estado
        
        db.commit()
    
    @staticmethod
    def _actualizar_stock_medicamento(db: Session, medicamento_id: int):
        """
        Actualizar el stock total del medicamento sumando todos sus lotes disponibles
        """
        lotes = db.query(Lote).filter(
            and_(
                Lote.medicamento_id == medicamento_id,
                Lote.estado.in_(["disponible", "proximo_a_vencer"])
            )
        ).all()
        
        stock_total = sum(lote.cantidad_disponible for lote in lotes)
        
        medicamento = db.query(Medicamento).filter(Medicamento.id == medicamento_id).first()
        if medicamento:
            medicamento.stock = stock_total
            db.commit()
    
    @staticmethod
    def obtener_costo_promedio_medicamento(db: Session, medicamento_id: int) -> float:
        """
        Calcular el costo promedio ponderado de un medicamento
        basado en los lotes disponibles
        """
        lotes = db.query(Lote).filter(
            and_(
                Lote.medicamento_id == medicamento_id,
                Lote.cantidad_disponible > 0,
                Lote.costo_unitario.isnot(None)
            )
        ).all()
        
        if not lotes:
            return 0.0
        
        costo_total = sum(lote.cantidad_disponible * float(lote.costo_unitario) for lote in lotes)
        cantidad_total = sum(lote.cantidad_disponible for lote in lotes)
        
        return costo_total / cantidad_total if cantidad_total > 0 else 0.0
