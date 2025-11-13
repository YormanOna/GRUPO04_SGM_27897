from sqlalchemy import create_engine, Column, Boolean, DateTime
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.exc import OperationalError
from datetime import datetime
from app.core.config import settings

DATABASE_URL = (
    f"mysql+pymysql://{settings.DB_USER}:{settings.DB_PASSWORD}"
    f"@{settings.DB_HOST}:{settings.DB_PORT}/{settings.DB_NAME}"
)

# Engine & session (sync)
# Configuración optimizada para pruebas de carga
engine = create_engine(
    DATABASE_URL, 
    pool_pre_ping=True,   # Verifica conexiones antes de usarlas
    echo=False,
    pool_size=20,         # Número base de conexiones (antes: 5 por defecto)
    max_overflow=30,      # Conexiones adicionales permitidas (antes: 10 por defecto)
    pool_timeout=60,      # Tiempo de espera para obtener conexión en segundos (antes: 30)
    pool_recycle=3600     # Reciclar conexiones cada hora (evita conexiones muertas)
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# ═══════════════════════════════════════════════════════════════════════════════
# MIXIN PARA SOFT DELETE (BORRADO LÓGICO)
# ═══════════════════════════════════════════════════════════════════════════════

class SoftDeleteMixin:
    """
    Mixin para implementar borrado lógico en los modelos.
    Agrega campos para marcar registros como eliminados sin borrarlos físicamente.
    """
    activo = Column(Boolean, default=True, nullable=False, index=True)
    fecha_eliminacion = Column(DateTime, nullable=True)
    
    def soft_delete(self):
        """Marca el registro como eliminado"""
        self.activo = False
        self.fecha_eliminacion = datetime.utcnow()
    
    def restore(self):
        """Restaura un registro marcado como eliminado"""
        self.activo = True
        self.fecha_eliminacion = None

def get_db():
    """Dependency para obtener sesión de base de datos"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    # Import models here so they are registered with Base.metadata
    from app.models import empleado, paciente, medico, cita, historia, consulta, farmacia, medicamento, signos_vitales, asistencia, receta, auditoria
    try:
        Base.metadata.create_all(bind=engine)
        print("Database tables created or already exist.")
    except OperationalError as e:
        print("Error creando tablas:", e)
