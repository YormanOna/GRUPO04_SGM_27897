from fastapi import HTTPException, status, Depends
from jose import jwt, JWTError
from app.core.config import settings
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Obtiene el usuario actual desde el token JWT
    """
    try:
        token = credentials.credentials
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        user_id = payload.get("sub")
        cargo = payload.get("cargo")
        
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido"
            )
        
        return {"id": int(user_id), "cargo": cargo}
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No se pudo validar las credenciales"
        )

def require_role(allowed_roles: list):
    """
    Decorador para verificar que el usuario tenga un rol permitido
    """
    def role_checker(current_user: dict = Depends(get_current_user)):
        if current_user["cargo"] not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"No tienes permisos. Se requiere uno de estos roles: {', '.join(allowed_roles)}"
            )
        return current_user
    return role_checker

# Funciones helper para roles específicos
def super_admin_only(current_user: dict = Depends(get_current_user)):
    """Solo Admin General (acceso total al sistema)"""
    if current_user["cargo"] not in ["Admin General"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Se requiere rol de Admin General"
        )
    return current_user

def admin_only(current_user: dict = Depends(get_current_user)):
    """Solo Admin General o Administradores (recepcionistas)"""
    if current_user["cargo"] not in ["Admin General", "Administrador"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Se requiere rol de Admin General o Administrador"
        )
    return current_user

def admin_or_medic(current_user: dict = Depends(get_current_user)):
    """Admin General, Administradores o Médicos"""
    if current_user["cargo"] not in ["Admin General", "Administrador", "Medico"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Se requiere rol de Admin General, Administrador o Médico"
        )
    return current_user

def admin_or_nurse(current_user: dict = Depends(get_current_user)):
    """Admin General, Administradores o Enfermeras"""
    if current_user["cargo"] not in ["Admin General", "Administrador", "Enfermera"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Se requiere rol de Admin General, Administrador o Enfermera"
        )
    return current_user

def admin_or_pharmacist(current_user: dict = Depends(get_current_user)):
    """Admin General, Administradores o Farmacéuticos"""
    if current_user["cargo"] not in ["Admin General", "Administrador", "Farmaceutico"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Se requiere rol de Admin General, Administrador o Farmacéutico"
        )
    return current_user

def medical_staff(current_user: dict = Depends(get_current_user)):
    """Personal médico (Admin General, Admin, Médico, Enfermera)"""
    if current_user["cargo"] not in ["Admin General", "Administrador", "Medico", "Enfermera"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Se requiere rol de personal médico"
        )
    return current_user

def nurse_only(current_user: dict = Depends(get_current_user)):
    """Solo Admin General o Enfermeras (para signos vitales)"""
    if current_user["cargo"] not in ["Admin General", "Enfermera"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Se requiere rol de Enfermera o Admin General"
        )
    return current_user

def medical_consultation_only(current_user: dict = Depends(get_current_user)):
    """Solo Admin General o Médicos (para consultas médicas)"""
    if current_user["cargo"] not in ["Admin General", "Medico"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Se requiere rol de Médico o Admin General"
        )
    return current_user

def any_authenticated(current_user: dict = Depends(get_current_user)):
    """Cualquier usuario autenticado (Admin General tiene acceso automático)"""
    return current_user

def verificar_permisos(current_user: dict, allowed_roles: list):
    """
    Verifica que el usuario actual tenga uno de los roles permitidos
    Mapea nombres de roles en español/inglés a los roles del sistema
    """
    # Mapeo de roles
    role_mapping = {
        "super_admin": "Admin General",
        "admin": "Administrador",
        "medico": "Medico",
        "farmaceutico": "Farmaceutico",
        "enfermero": "Enfermera",
        "recepcionista": "Administrador",
    }
    
    # Convertir roles permitidos usando el mapeo
    mapped_roles = []
    for role in allowed_roles:
        if role in role_mapping:
            mapped_roles.append(role_mapping[role])
        else:
            mapped_roles.append(role)
    
    # Verificar si el usuario tiene uno de los roles permitidos
    user_cargo = current_user.get("cargo")
    if user_cargo not in mapped_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"No tienes permisos. Se requiere uno de estos roles: {', '.join(mapped_roles)}"
        )
    
    return True
