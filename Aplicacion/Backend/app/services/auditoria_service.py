from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc
from app.models.auditoria import Auditoria
from app.schemas.auditoria_schema import AuditoriaCreate, AuditoriaFilter
from datetime import datetime
from typing import Optional, List, Dict, Any

class AuditoriaService:
    
    @staticmethod
    def crear_registro(db: Session, auditoria: AuditoriaCreate) -> Auditoria:
        """Crea un nuevo registro de auditoría"""
        db_auditoria = Auditoria(**auditoria.dict())
        db.add(db_auditoria)
        db.commit()
        db.refresh(db_auditoria)
        return db_auditoria
    
    @staticmethod
    def registrar_accion(
        db: Session,
        usuario_id: Optional[int],
        usuario_nombre: Optional[str],
        usuario_cargo: Optional[str],
        accion: str,
        modulo: str,
        descripcion: str,
        tabla_afectada: Optional[str] = None,
        registro_id: Optional[int] = None,
        datos_anteriores: Optional[Dict[str, Any]] = None,
        datos_nuevos: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        estado: str = "exitoso",
        detalles_adicionales: Optional[Dict[str, Any]] = None
    ) -> Auditoria:
        """Método helper para registrar acciones rápidamente"""
        auditoria = AuditoriaCreate(
            usuario_id=usuario_id,
            usuario_nombre=usuario_nombre,
            usuario_cargo=usuario_cargo,
            accion=accion,
            modulo=modulo,
            descripcion=descripcion,
            tabla_afectada=tabla_afectada,
            registro_id=registro_id,
            datos_anteriores=datos_anteriores,
            datos_nuevos=datos_nuevos,
            ip_address=ip_address,
            user_agent=user_agent,
            estado=estado,
            detalles_adicionales=detalles_adicionales
        )
        return AuditoriaService.crear_registro(db, auditoria)
    
    @staticmethod
    def listar(
        db: Session,
        filtros: Optional[AuditoriaFilter] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """Lista registros de auditoría con filtros opcionales"""
        query = db.query(Auditoria)
        
        if filtros:
            if filtros.fecha_desde:
                fecha_desde = datetime.fromisoformat(filtros.fecha_desde)
                query = query.filter(Auditoria.fecha_hora >= fecha_desde)
            
            if filtros.fecha_hasta:
                fecha_hasta = datetime.fromisoformat(filtros.fecha_hasta)
                query = query.filter(Auditoria.fecha_hora <= fecha_hasta)
            
            if filtros.usuario_id:
                query = query.filter(Auditoria.usuario_id == filtros.usuario_id)
            
            if filtros.accion:
                query = query.filter(Auditoria.accion == filtros.accion)
            
            if filtros.modulo:
                query = query.filter(Auditoria.modulo == filtros.modulo)
            
            if filtros.estado:
                query = query.filter(Auditoria.estado == filtros.estado)
        
        registros = query.order_by(desc(Auditoria.fecha_hora)).offset(skip).limit(limit).all()
        
        # Convertir a diccionarios manualmente
        return [
            {
                "id": r.id,
                "usuario_id": r.usuario_id,
                "usuario_nombre": r.usuario_nombre,
                "usuario_cargo": r.usuario_cargo,
                "accion": r.accion,
                "modulo": r.modulo,
                "descripcion": r.descripcion,
                "tabla_afectada": r.tabla_afectada,
                "registro_id": r.registro_id,
                "datos_anteriores": r.datos_anteriores,
                "datos_nuevos": r.datos_nuevos,
                "ip_address": r.ip_address,
                "user_agent": r.user_agent,
                "estado": r.estado,
                "fecha_hora": r.fecha_hora,
                "detalles_adicionales": r.detalles_adicionales
            }
            for r in registros
        ]
    
    @staticmethod
    def obtener_por_id(db: Session, auditoria_id: int) -> Optional[Dict[str, Any]]:
        """Obtiene un registro de auditoría por ID"""
        r = db.query(Auditoria).filter(Auditoria.id == auditoria_id).first()
        if not r:
            return None
        
        return {
            "id": r.id,
            "usuario_id": r.usuario_id,
            "usuario_nombre": r.usuario_nombre,
            "usuario_cargo": r.usuario_cargo,
            "accion": r.accion,
            "modulo": r.modulo,
            "descripcion": r.descripcion,
            "tabla_afectada": r.tabla_afectada,
            "registro_id": r.registro_id,
            "datos_anteriores": r.datos_anteriores,
            "datos_nuevos": r.datos_nuevos,
            "ip_address": r.ip_address,
            "user_agent": r.user_agent,
            "estado": r.estado,
            "fecha_hora": r.fecha_hora,
            "detalles_adicionales": r.detalles_adicionales
        }
    
    @staticmethod
    def obtener_por_usuario(db: Session, usuario_id: int, limit: int = 50) -> List[Dict[str, Any]]:
        """Obtiene el historial de acciones de un usuario específico"""
        registros = db.query(Auditoria)\
            .filter(Auditoria.usuario_id == usuario_id)\
            .order_by(desc(Auditoria.fecha_hora))\
            .limit(limit)\
            .all()
        
        return [
            {
                "id": r.id,
                "usuario_id": r.usuario_id,
                "usuario_nombre": r.usuario_nombre,
                "usuario_cargo": r.usuario_cargo,
                "accion": r.accion,
                "modulo": r.modulo,
                "descripcion": r.descripcion,
                "tabla_afectada": r.tabla_afectada,
                "registro_id": r.registro_id,
                "datos_anteriores": r.datos_anteriores,
                "datos_nuevos": r.datos_nuevos,
                "ip_address": r.ip_address,
                "user_agent": r.user_agent,
                "estado": r.estado,
                "fecha_hora": r.fecha_hora,
                "detalles_adicionales": r.detalles_adicionales
            }
            for r in registros
        ]
    
    @staticmethod
    def obtener_por_modulo(db: Session, modulo: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Obtiene el historial de acciones de un módulo específico"""
        registros = db.query(Auditoria)\
            .filter(Auditoria.modulo == modulo)\
            .order_by(desc(Auditoria.fecha_hora))\
            .limit(limit)\
            .all()
        
        return [
            {
                "id": r.id,
                "usuario_id": r.usuario_id,
                "usuario_nombre": r.usuario_nombre,
                "usuario_cargo": r.usuario_cargo,
                "accion": r.accion,
                "modulo": r.modulo,
                "descripcion": r.descripcion,
                "tabla_afectada": r.tabla_afectada,
                "registro_id": r.registro_id,
                "datos_anteriores": r.datos_anteriores,
                "datos_nuevos": r.datos_nuevos,
                "ip_address": r.ip_address,
                "user_agent": r.user_agent,
                "estado": r.estado,
                "fecha_hora": r.fecha_hora,
                "detalles_adicionales": r.detalles_adicionales
            }
            for r in registros
        ]
    
    @staticmethod
    def contar_registros(db: Session, filtros: Optional[AuditoriaFilter] = None) -> int:
        """Cuenta el total de registros de auditoría"""
        query = db.query(Auditoria)
        
        if filtros:
            if filtros.fecha_desde:
                fecha_desde = datetime.fromisoformat(filtros.fecha_desde)
                query = query.filter(Auditoria.fecha_hora >= fecha_desde)
            
            if filtros.fecha_hasta:
                fecha_hasta = datetime.fromisoformat(filtros.fecha_hasta)
                query = query.filter(Auditoria.fecha_hora <= fecha_hasta)
            
            if filtros.usuario_id:
                query = query.filter(Auditoria.usuario_id == filtros.usuario_id)
            
            if filtros.accion:
                query = query.filter(Auditoria.accion == filtros.accion)
            
            if filtros.modulo:
                query = query.filter(Auditoria.modulo == filtros.modulo)
            
            if filtros.estado:
                query = query.filter(Auditoria.estado == filtros.estado)
        
        return query.count()
    
    @staticmethod
    def obtener_estadisticas(db: Session) -> Dict[str, Any]:
        """Obtiene estadísticas generales de auditoría"""
        from sqlalchemy import func
        
        total_registros = db.query(Auditoria).count()
        
        # Acciones más comunes
        acciones_comunes = db.query(
            Auditoria.accion,
            func.count(Auditoria.id).label('count')
        ).group_by(Auditoria.accion)\
         .order_by(desc('count'))\
         .limit(10)\
         .all()
        
        # Módulos más activos
        modulos_activos = db.query(
            Auditoria.modulo,
            func.count(Auditoria.id).label('count')
        ).group_by(Auditoria.modulo)\
         .order_by(desc('count'))\
         .limit(10)\
         .all()
        
        # Usuarios más activos
        usuarios_activos = db.query(
            Auditoria.usuario_nombre,
            Auditoria.usuario_cargo,
            func.count(Auditoria.id).label('count')
        ).filter(Auditoria.usuario_nombre.isnot(None))\
         .group_by(Auditoria.usuario_nombre, Auditoria.usuario_cargo)\
         .order_by(desc('count'))\
         .limit(10)\
         .all()
        
        return {
            "total_registros": total_registros,
            "acciones_comunes": [{"accion": a[0], "count": a[1]} for a in acciones_comunes],
            "modulos_activos": [{"modulo": m[0], "count": m[1]} for m in modulos_activos],
            "usuarios_activos": [{"nombre": u[0], "cargo": u[1], "count": u[2]} for u in usuarios_activos]
        }

auditoria_service = AuditoriaService()
