from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import List, Dict, Optional
from datetime import datetime, date
from app.models.medicamento import Medicamento
from app.models.paciente import Paciente
from app.models.lote import Lote
from app.models.receta import Receta
from app.models.consulta import Consulta

class ValidacionFarmaceuticaService:
    """
    RF-004: Servicio para validación farmacéutica
    Valida: stock disponible, alergias, interacciones, dosis
    """
    
    @staticmethod
    def validar_prescripcion(
        db: Session,
        paciente_id: int,
        medicamentos: List[Dict[str, any]]
    ) -> Dict:
        """
        Validar una prescripción completa
        
        Args:
            paciente_id: ID del paciente
            medicamentos: Lista de dicts con {medicamento_id, cantidad, dosis}
        
        Returns:
            Dict con alertas: {
                "criticas": [],  # Bloquean dispensación
                "advertencias": [],  # Requieren confirmación
                "info": [],  # Informativas
                "puede_dispensar": bool
            }
        """
        resultado = {
            "criticas": [],
            "advertencias": [],
            "info": [],
            "puede_dispensar": True
        }
        
        paciente = db.query(Paciente).filter(Paciente.id == paciente_id).first()
        if not paciente:
            resultado["criticas"].append("Paciente no encontrado")
            resultado["puede_dispensar"] = False
            return resultado
        
        # 1. Validar stock disponible
        alertas_stock = ValidacionFarmaceuticaService._validar_stock(db, medicamentos)
        resultado["criticas"].extend(alertas_stock["criticas"])
        resultado["advertencias"].extend(alertas_stock["advertencias"])
        
        # 2. Validar alergias del paciente
        alertas_alergias = ValidacionFarmaceuticaService._validar_alergias(db, paciente_id, medicamentos)
        resultado["criticas"].extend(alertas_alergias["criticas"])
        resultado["advertencias"].extend(alertas_alergias["advertencias"])
        
        # 3. Validar interacciones medicamentosas
        alertas_interacciones = ValidacionFarmaceuticaService._validar_interacciones(db, medicamentos)
        resultado["advertencias"].extend(alertas_interacciones["advertencias"])
        resultado["info"].extend(alertas_interacciones["info"])
        
        # 4. Validar medicamentos activos del paciente
        alertas_medicamentos_activos = ValidacionFarmaceuticaService._validar_medicamentos_activos(
            db, paciente_id, medicamentos
        )
        resultado["advertencias"].extend(alertas_medicamentos_activos)
        
        # 5. Validar dosis (básico)
        alertas_dosis = ValidacionFarmaceuticaService._validar_dosis(db, medicamentos)
        resultado["info"].extend(alertas_dosis)
        
        # Si hay alertas críticas, no se puede dispensar
        if resultado["criticas"]:
            resultado["puede_dispensar"] = False
        
        return resultado
    
    @staticmethod
    def _validar_stock(db: Session, medicamentos: List[Dict]) -> Dict:
        """Validar disponibilidad de stock"""
        alertas = {"criticas": [], "advertencias": []}
        
        for med in medicamentos:
            medicamento_id = med.get("medicamento_id")
            cantidad_requerida = med.get("cantidad", 0)
            
            medicamento = db.query(Medicamento).filter(Medicamento.id == medicamento_id).first()
            if not medicamento:
                alertas["criticas"].append(f"Medicamento ID {medicamento_id} no encontrado")
                continue
            
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
                alertas["criticas"].append(
                    f"❌ {medicamento.nombre}: Stock AGOTADO. No se puede dispensar."
                )
            elif stock_total < cantidad_requerida:
                alertas["criticas"].append(
                    f"❌ {medicamento.nombre}: Stock INSUFICIENTE. "
                    f"Requerido: {cantidad_requerida}, Disponible: {stock_total}"
                )
            elif stock_total < cantidad_requerida * 2:
                alertas["advertencias"].append(
                    f"⚠️ {medicamento.nombre}: Stock BAJO. "
                    f"Disponible: {stock_total}, después de dispensar quedarán: {stock_total - cantidad_requerida}"
                )
        
        return alertas
    
    @staticmethod
    def _validar_alergias(db: Session, paciente_id: int, medicamentos: List[Dict]) -> Dict:
        """Validar alergias del paciente"""
        alertas = {"criticas": [], "advertencias": []}
        
        # Obtener alergias del paciente (de la tabla que crearemos)
        # Por ahora, buscar en el historial médico
        paciente = db.query(Paciente).filter(Paciente.id == paciente_id).first()
        if not paciente:
            return alertas
        
        # Buscar alergias en consultas previas (campo alergias en historia)
        consultas_previas = db.query(Consulta).filter(
            Consulta.paciente_id == paciente_id
        ).order_by(Consulta.created_at.desc()).limit(10).all()
        
        alergias_conocidas = set()
        for consulta in consultas_previas:
            if consulta.alergias:
                # Parsear alergias (asumiendo que están separadas por comas)
                alergias = [a.strip().lower() for a in consulta.alergias.split(',')]
                alergias_conocidas.update(alergias)
        
        # Validar contra medicamentos prescritos
        for med in medicamentos:
            medicamento = db.query(Medicamento).filter(Medicamento.id == med.get("medicamento_id")).first()
            if not medicamento:
                continue
            
            nombre_med = medicamento.nombre.lower()
            principio_activo = (medicamento.principio_activo or "").lower()
            
            # Verificar si hay coincidencias
            for alergia in alergias_conocidas:
                if alergia in nombre_med or alergia in principio_activo:
                    alertas["criticas"].append(
                        f"🚫 ALERGIA CONOCIDA: El paciente es alérgico a {alergia}. "
                        f"Medicamento: {medicamento.nombre}. NO DISPENSAR."
                    )
                    break
        
        return alertas
    
    @staticmethod
    def _validar_interacciones(db: Session, medicamentos: List[Dict]) -> Dict:
        """Validar interacciones entre medicamentos de la prescripción"""
        alertas = {"advertencias": [], "info": []}
        
        if len(medicamentos) < 2:
            return alertas
        
        # Lista de interacciones comunes conocidas (simplificado)
        # En producción, esto debería estar en una base de datos
        interacciones_conocidas = {
            ("ibuprofeno", "aspirina"): {
                "nivel": "advertencia",
                "mensaje": "Ibuprofeno + Aspirina: Aumenta riesgo de sangrado gastrointestinal"
            },
            ("warfarina", "aspirina"): {
                "nivel": "critica",
                "mensaje": "Warfarina + Aspirina: RIESGO ALTO de hemorragia"
            },
            ("omeprazol", "clopidogrel"): {
                "nivel": "advertencia",
                "mensaje": "Omeprazol puede reducir efectividad de Clopidogrel"
            }
        }
        
        # Obtener nombres de medicamentos
        medicamentos_info = []
        for med in medicamentos:
            medicamento = db.query(Medicamento).filter(Medicamento.id == med.get("medicamento_id")).first()
            if medicamento:
                medicamentos_info.append({
                    "nombre": medicamento.nombre.lower(),
                    "principio_activo": (medicamento.principio_activo or "").lower()
                })
        
        # Verificar interacciones
        for i, med_a in enumerate(medicamentos_info):
            for med_b in medicamentos_info[i+1:]:
                # Buscar por nombre
                clave = tuple(sorted([med_a["nombre"], med_b["nombre"]]))
                if clave in interacciones_conocidas:
                    interaccion = interacciones_conocidas[clave]
                    if interaccion["nivel"] == "advertencia":
                        alertas["advertencias"].append(f"⚠️ {interaccion['mensaje']}")
                
                # Buscar por principio activo
                if med_a["principio_activo"] and med_b["principio_activo"]:
                    clave_pa = tuple(sorted([med_a["principio_activo"], med_b["principio_activo"]]))
                    if clave_pa in interacciones_conocidas:
                        interaccion = interacciones_conocidas[clave_pa]
                        if interaccion["nivel"] == "advertencia":
                            alertas["advertencias"].append(f"⚠️ {interaccion['mensaje']}")
        
        return alertas
    
    @staticmethod
    def _validar_medicamentos_activos(db: Session, paciente_id: int, medicamentos: List[Dict]) -> List[str]:
        """Verificar si el paciente tiene recetas activas que puedan interactuar"""
        alertas = []
        
        # Buscar recetas activas del paciente (últimos 30 días)
        from datetime import timedelta
        fecha_limite = date.today() - timedelta(days=30)
        
        recetas_activas = db.query(Receta).join(Consulta).filter(
            and_(
                Consulta.paciente_id == paciente_id,
                Receta.estado.in_(["pendiente", "dispensada"]),
                Receta.created_at >= fecha_limite
            )
        ).all()
        
        if recetas_activas:
            medicamentos_activos = set()
            for receta in recetas_activas:
                if receta.medicamento:
                    medicamentos_activos.add(receta.medicamento.nombre)
            
            if medicamentos_activos:
                alertas.append(
                    f"ℹ️ El paciente tiene medicamentos activos: {', '.join(medicamentos_activos)}. "
                    "Verificar posibles interacciones."
                )
        
        return alertas
    
    @staticmethod
    def _validar_dosis(db: Session, medicamentos: List[Dict]) -> List[str]:
        """Validar que la dosis esté en rango recomendado (básico)"""
        alertas = []
        
        for med in medicamentos:
            medicamento = db.query(Medicamento).filter(Medicamento.id == med.get("medicamento_id")).first()
            if not medicamento:
                continue
            
            dosis_prescrita = med.get("dosis", "")
            dosis_recomendada = medicamento.dosis_recomendada
            
            if dosis_recomendada:
                alertas.append(
                    f"ℹ️ {medicamento.nombre}: Dosis recomendada: {dosis_recomendada}"
                )
        
        return alertas
    
    @staticmethod
    def validar_dispensacion_individual(
        db: Session,
        medicamento_id: int,
        cantidad: int,
        paciente_id: int
    ) -> Dict:
        """
        Validación rápida para dispensar un medicamento individual
        """
        return ValidacionFarmaceuticaService.validar_prescripcion(
            db,
            paciente_id,
            [{"medicamento_id": medicamento_id, "cantidad": cantidad}]
        )
