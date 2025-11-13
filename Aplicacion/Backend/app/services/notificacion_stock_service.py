from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import List, Optional
from datetime import datetime, date, timedelta
from app.models.medicamento import Medicamento
from app.models.lote import Lote

class NotificacionStockService:
    """
    RF-004: Servicio para gestionar notificaciones de stock
    Alertas para médicos y farmacéuticos sobre stock crítico y vencimientos
    """
    
    @staticmethod
    def obtener_alertas_dashboard() -> dict:
        """
        Obtener todas las alertas para el dashboard
        Retorna: {
            "stock_critico": [],
            "stock_agotado": [],
            "proximos_vencer": [],
            "vencidos": []
        }
        """
        from app.core.database import SessionLocal
        db = SessionLocal()
        
        try:
            alertas = {
                "stock_critico": NotificacionStockService._obtener_stock_critico(db),
                "stock_agotado": NotificacionStockService._obtener_stock_agotado(db),
                "proximos_vencer": NotificacionStockService._obtener_proximos_vencer(db),
                "vencidos": NotificacionStockService._obtener_vencidos(db)
            }
            return alertas
        finally:
            db.close()
    
    @staticmethod
    def _obtener_stock_critico(db: Session, umbral: int = 10) -> List[dict]:
        """
        Obtener medicamentos con stock crítico (< umbral)
        """
        medicamentos = db.query(Medicamento).filter(
            and_(
                Medicamento.stock > 0,
                Medicamento.stock < umbral
            )
        ).all()
        
        alertas = []
        for med in medicamentos:
            alertas.append({
                "id": med.id,
                "tipo": "stock_critico",
                "gravedad": "advertencia",
                "medicamento_id": med.id,
                "medicamento_nombre": med.nombre,
                "stock_actual": med.stock,
                "mensaje": f"{med.nombre}: Stock CRÍTICO ({med.stock} unidades restantes)",
                "fecha": datetime.now().isoformat()
            })
        
        return alertas
    
    @staticmethod
    def _obtener_stock_agotado(db: Session) -> List[dict]:
        """
        Obtener medicamentos agotados
        """
        medicamentos = db.query(Medicamento).filter(
            Medicamento.stock == 0
        ).all()
        
        alertas = []
        for med in medicamentos:
            alertas.append({
                "id": med.id,
                "tipo": "stock_agotado",
                "gravedad": "critica",
                "medicamento_id": med.id,
                "medicamento_nombre": med.nombre,
                "stock_actual": 0,
                "mensaje": f"{med.nombre}: AGOTADO - No disponible para prescripción",
                "fecha": datetime.now().isoformat()
            })
        
        return alertas
    
    @staticmethod
    def _obtener_proximos_vencer(db: Session, dias: int = 30) -> List[dict]:
        """
        Obtener lotes próximos a vencer en los próximos X días
        """
        fecha_limite = date.today() + timedelta(days=dias)
        
        lotes = db.query(Lote).join(Medicamento).filter(
            and_(
                Lote.fecha_vencimiento <= fecha_limite,
                Lote.fecha_vencimiento >= date.today(),
                Lote.cantidad_disponible > 0
            )
        ).order_by(Lote.fecha_vencimiento.asc()).all()
        
        alertas = []
        for lote in lotes:
            dias_restantes = (lote.fecha_vencimiento - date.today()).days
            gravedad = "critica" if dias_restantes <= 15 else "advertencia"
            
            alertas.append({
                "id": lote.id,
                "tipo": "proximo_vencer",
                "gravedad": gravedad,
                "lote_id": lote.id,
                "numero_lote": lote.numero_lote,
                "medicamento_id": lote.medicamento_id,
                "medicamento_nombre": lote.medicamento.nombre,
                "fecha_vencimiento": lote.fecha_vencimiento.isoformat(),
                "cantidad_disponible": lote.cantidad_disponible,
                "dias_restantes": dias_restantes,
                "ubicacion": lote.ubicacion_fisica,
                "mensaje": f"{lote.medicamento.nombre} (Lote {lote.numero_lote}): "
                          f"Vence en {dias_restantes} días - {lote.cantidad_disponible} unidades",
                "fecha": datetime.now().isoformat()
            })
        
        return alertas
    
    @staticmethod
    def _obtener_vencidos(db: Session) -> List[dict]:
        """
        Obtener lotes vencidos con stock
        """
        lotes = db.query(Lote).join(Medicamento).filter(
            and_(
                Lote.fecha_vencimiento < date.today(),
                Lote.cantidad_disponible > 0
            )
        ).all()
        
        alertas = []
        for lote in lotes:
            alertas.append({
                "id": lote.id,
                "tipo": "vencido",
                "gravedad": "critica",
                "lote_id": lote.id,
                "numero_lote": lote.numero_lote,
                "medicamento_id": lote.medicamento_id,
                "medicamento_nombre": lote.medicamento.nombre,
                "fecha_vencimiento": lote.fecha_vencimiento.isoformat(),
                "cantidad_disponible": lote.cantidad_disponible,
                "ubicacion": lote.ubicacion_fisica,
                "mensaje": f"{lote.medicamento.nombre} (Lote {lote.numero_lote}): "
                          f"VENCIDO - Retirar {lote.cantidad_disponible} unidades",
                "fecha": datetime.now().isoformat()
            })
        
        return alertas
    
    @staticmethod
    def verificar_disponibilidad_para_prescripcion(db: Session, medicamento_id: int, cantidad: int) -> dict:
        """
        Verificar si un medicamento puede ser prescrito
        Usado por médicos al crear recetas
        """
        medicamento = db.query(Medicamento).filter(Medicamento.id == medicamento_id).first()
        if not medicamento:
            return {
                "disponible": False,
                "mensaje": "Medicamento no encontrado",
                "gravedad": "critica"
            }
        
        # Verificar stock en lotes disponibles
        lotes_disponibles = db.query(Lote).filter(
            and_(
                Lote.medicamento_id == medicamento_id,
                Lote.cantidad_disponible > 0,
                Lote.fecha_vencimiento >= date.today(),
                Lote.estado.in_(["disponible", "proximo_a_vencer"])
            )
        ).all()
        
        stock_total = sum(lote.cantidad_disponible for lote in lotes_disponibles)
        
        if stock_total == 0:
            return {
                "disponible": False,
                "mensaje": f"{medicamento.nombre} está AGOTADO. No se puede prescribir.",
                "gravedad": "critica",
                "stock_actual": 0
            }
        elif stock_total < cantidad:
            return {
                "disponible": False,
                "mensaje": f"{medicamento.nombre}: Stock insuficiente. "
                          f"Requerido: {cantidad}, Disponible: {stock_total}",
                "gravedad": "critica",
                "stock_actual": stock_total
            }
        elif stock_total < cantidad * 2:
            return {
                "disponible": True,
                "mensaje": f"{medicamento.nombre}: Stock bajo. "
                          f"Disponible: {stock_total}, después quedarán: {stock_total - cantidad}",
                "gravedad": "advertencia",
                "stock_actual": stock_total
            }
        else:
            return {
                "disponible": True,
                "mensaje": f"{medicamento.nombre}: Disponible ({stock_total} unidades)",
                "gravedad": "info",
                "stock_actual": stock_total
            }
    
    @staticmethod
    def obtener_resumen_alertas(db: Session) -> dict:
        """
        Obtener resumen numérico de alertas para dashboard
        """
        return {
            "stock_critico": len(NotificacionStockService._obtener_stock_critico(db)),
            "stock_agotado": len(NotificacionStockService._obtener_stock_agotado(db)),
            "proximos_vencer": len(NotificacionStockService._obtener_proximos_vencer(db)),
            "vencidos": len(NotificacionStockService._obtener_vencidos(db))
        }
