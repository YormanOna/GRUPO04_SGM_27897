"""
Utilidades de validación para el sistema
RF-001: Validación de cédula ecuatoriana y otras validaciones
"""
from datetime import date, timedelta
from typing import Tuple


def validar_cedula_ecuatoriana(cedula: str) -> Tuple[bool, str]:
    """
    Valida una cédula ecuatoriana según el algoritmo oficial
    
    Pasos:
    1. Debe tener 10 dígitos
    2. Los dos primeros dígitos deben corresponder a una provincia válida (01-24)
    3. El tercer dígito debe ser menor a 6 (personas naturales)
    4. Validación del dígito verificador (último dígito)
    
    Returns:
        Tuple[bool, str]: (es_valida, mensaje_error)
    """
    # Convertir a string y limpiar
    cedula_str = str(cedula).strip()
    
    # Verificar que tenga 10 dígitos
    if len(cedula_str) != 10:
        return False, "La cédula debe tener exactamente 10 dígitos"
    
    # Verificar que todos sean dígitos
    if not cedula_str.isdigit():
        return False, "La cédula debe contener solo números"
    
    # Verificar código de provincia (01-24)
    provincia = int(cedula_str[0:2])
    if provincia < 1 or provincia > 24:
        return False, "Código de provincia inválido (debe ser 01-24)"
    
    # Verificar tercer dígito (debe ser menor a 6 para personas naturales)
    tercer_digito = int(cedula_str[2])
    if tercer_digito > 5:
        return False, "Tercer dígito inválido (debe ser 0-5 para personas naturales)"
    
    # Algoritmo de validación del dígito verificador
    coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2]
    suma = 0
    
    for i in range(9):
        valor = int(cedula_str[i]) * coeficientes[i]
        if valor > 9:
            valor -= 9
        suma += valor
    
    # Calcular dígito verificador esperado
    residuo = suma % 10
    digito_verificador_esperado = 0 if residuo == 0 else 10 - residuo
    digito_verificador_recibido = int(cedula_str[9])
    
    if digito_verificador_esperado != digito_verificador_recibido:
        return False, "Dígito verificador inválido"
    
    return True, "Cédula válida"


def validar_vigencia_poliza(fecha_vigencia: date) -> Tuple[str, str]:
    """
    Valida el estado de vigencia de una póliza médica
    
    Returns:
        Tuple[str, str]: (estado, mensaje)
        Estados: 'vigente', 'vencida', 'proxima_a_vencer'
    """
    if not fecha_vigencia:
        return 'sin_informacion', 'No se ha registrado fecha de vigencia'
    
    hoy = date.today()
    dias_diferencia = (fecha_vigencia - hoy).days
    
    if dias_diferencia < 0:
        return 'vencida', f'La póliza venció hace {abs(dias_diferencia)} días'
    elif dias_diferencia == 0:
        return 'vencida', 'La póliza vence hoy'
    elif dias_diferencia <= 30:
        return 'proxima_a_vencer', f'La póliza vence en {dias_diferencia} días'
    else:
        return 'vigente', f'La póliza es válida por {dias_diferencia} días más'


def generar_numero_historia_clinica(ultimo_numero: int = 0) -> str:
    """
    Genera un número único de historia clínica con formato: HCL-YYYYMMDD-NNNN
    
    Args:
        ultimo_numero: Último número secuencial usado en el día actual
    
    Returns:
        str: Número de historia clínica formateado
    """
    hoy = date.today()
    fecha_str = hoy.strftime("%Y%m%d")
    numero_secuencial = str(ultimo_numero + 1).zfill(4)
    
    return f"HCL-{fecha_str}-{numero_secuencial}"


def validar_formato_email(email: str) -> bool:
    """
    Validación básica de formato de email
    """
    import re
    patron = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(patron, email))


def validar_edad_coherente(fecha_nacimiento: date) -> Tuple[bool, str]:
    """
    Valida que la fecha de nacimiento sea coherente
    """
    if not fecha_nacimiento:
        return True, ""
    
    hoy = date.today()
    
    # No puede ser en el futuro
    if fecha_nacimiento > hoy:
        return False, "La fecha de nacimiento no puede ser en el futuro"
    
    # Calcular edad
    edad = hoy.year - fecha_nacimiento.year
    if hoy.month < fecha_nacimiento.month or (hoy.month == fecha_nacimiento.month and hoy.day < fecha_nacimiento.day):
        edad -= 1
    
    # Validar rango razonable (0-120 años)
    if edad < 0 or edad > 120:
        return False, f"Edad calculada ({edad} años) fuera de rango válido"
    
    return True, ""
