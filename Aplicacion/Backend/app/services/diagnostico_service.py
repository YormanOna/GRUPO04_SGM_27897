from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.models.diagnostico_cie10 import DiagnosticoCIE10

class DiagnosticoService:
    @staticmethod
    def buscar_diagnosticos(db: Session, query: str, limit: int = 20):
        """
        Busca diagnósticos CIE-10 por código o descripción.
        Retorna lista de objetos ORM que serán convertidos por Pydantic.
        """
        if not query or len(query) < 2:
            return []
        
        search_pattern = f"%{query.upper()}%"  # Convertir a mayúsculas para búsqueda
        
        try:
            diagnosticos = db.query(DiagnosticoCIE10).filter(
                or_(
                    DiagnosticoCIE10.codigo.ilike(search_pattern),
                    DiagnosticoCIE10.descripcion.ilike(search_pattern)
                )
            ).limit(limit).all()
            
            # Debug: Verificar qué tipo de objetos estamos devolviendo
            if diagnosticos:
                print(f"✅ Se encontraron {len(diagnosticos)} diagnósticos")
                print(f"   Primer resultado tipo: {type(diagnosticos[0])}")
                print(f"   Primer resultado: id={diagnosticos[0].id}, codigo={diagnosticos[0].codigo}")
            else:
                print(f"⚠️ No se encontraron diagnósticos para: {query}")
            
            return diagnosticos
        except Exception as e:
            print(f"❌ Error al buscar diagnósticos: {e}")
            return []
    
    @staticmethod
    def obtener_por_codigo(db: Session, codigo: str):
        """
        Obtiene un diagnóstico específico por su código CIE-10
        """
        return db.query(DiagnosticoCIE10).filter(
            DiagnosticoCIE10.codigo == codigo
        ).first()
