"""
Visor de emails para desarrollo
Permite ver los emails HTML directamente en el navegador
"""
from fastapi import APIRouter, Depends
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session
from datetime import datetime as dt

from app.core.database import get_db
from app.models.cita import Cita
from app.models.paciente import Paciente
from app.models.medico import Medico

router = APIRouter(prefix="/dev/emails", tags=["desarrollo"])

@router.get("/{cita_id}/confirmacion", response_class=HTMLResponse)
def ver_email_confirmacion(cita_id: int, db: Session = Depends(get_db)):
    """Ver el email de confirmación en formato HTML"""
    
    cita = db.query(Cita).filter(Cita.id == cita_id).first()
    if not cita:
        return "<h1>Cita no encontrada</h1>"
    
    paciente = db.query(Paciente).filter(Paciente.id == cita.paciente_id).first()
    
    medico_nombre = "Doctor Principal"
    if cita.medico_id:
        medico_obj = db.query(Medico).filter(Medico.id == cita.medico_id).first()
        if medico_obj and medico_obj.empleado:
            medico_nombre = f"{medico_obj.empleado.nombre} {medico_obj.empleado.apellido}"
    
    # Formatear fecha
    if isinstance(cita.fecha, dt):
        fecha_obj = cita.fecha
    else:
        fecha_obj = dt.strptime(str(cita.fecha), "%Y-%m-%d")
    
    fecha_formateada = fecha_obj.strftime("%A %d de %B de %Y").title()
    
    # Formatear hora
    hora_str = cita.hora_inicio or "08:00"
    try:
        hora_obj = dt.strptime(hora_str, "%H:%M:%S")
    except:
        hora_obj = dt.strptime(hora_str, "%H:%M")
    
    periodo = "PM" if hora_obj.hour >= 12 else "AM"
    hora_12 = hora_obj.hour if hora_obj.hour <= 12 else hora_obj.hour - 12
    if hora_12 == 0:
        hora_12 = 12
    hora_formateada = f"{hora_12:02d}:{hora_obj.minute:02d} {periodo}"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f7fa;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f7fa; padding: 40px 20px;">
            <tr>
                <td align="center">
                    <!-- Contenedor principal -->
                    <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
                        <!-- Header con gradiente -->
                        <tr>
                            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                                <div style="background-color: rgba(255,255,255,0.2); width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                                    <span style="font-size: 40px;">✅</span>
                                </div>
                                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">Cita Confirmada</h1>
                                <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Su cita ha sido agendada exitosamente</p>
                            </td>
                        </tr>
                        
                        <!-- Saludo -->
                        <tr>
                            <td style="padding: 30px 40px 20px;">
                                <p style="font-size: 16px; color: #2d3748; margin: 0;">Estimado/a <strong style="color: #667eea;">{paciente.nombre} {paciente.apellido}</strong>,</p>
                                <p style="font-size: 16px; color: #4a5568; margin: 15px 0 0 0;">¡Su cita médica ha sido confirmada! A continuación encontrará todos los detalles:</p>
                            </td>
                        </tr>
                        
                        <!-- Detalles de la cita -->
                        <tr>
                            <td style="padding: 0 40px 30px;">
                                <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%); border-radius: 12px; border: 2px solid #667eea30;">
                                    <tr>
                                        <td style="padding: 25px;">
                                            <!-- Fecha -->
                                            <div style="margin-bottom: 20px;">
                                                <table width="100%" cellpadding="0" cellspacing="0">
                                                    <tr>
                                                        <td width="40" style="vertical-align: top;">
                                                            <div style="width: 36px; height: 36px; background-color: #667eea; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                                                                <span style="font-size: 20px;">📅</span>
                                                            </div>
                                                        </td>
                                                        <td style="padding-left: 15px; vertical-align: middle;">
                                                            <p style="margin: 0; font-size: 13px; color: #718096; font-weight: 600;">FECHA</p>
                                                            <p style="margin: 5px 0 0 0; font-size: 18px; color: #2d3748; font-weight: bold;">{fecha_formateada}</p>
                                                        </td>
                                                    </tr>
                                                </table>
                                            </div>
                                            
                                            <!-- Hora -->
                                            <div style="margin-bottom: 20px;">
                                                <table width="100%" cellpadding="0" cellspacing="0">
                                                    <tr>
                                                        <td width="40" style="vertical-align: top;">
                                                            <div style="width: 36px; height: 36px; background-color: #48bb78; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                                                                <span style="font-size: 20px;">🕐</span>
                                                            </div>
                                                        </td>
                                                        <td style="padding-left: 15px; vertical-align: middle;">
                                                            <p style="margin: 0; font-size: 13px; color: #718096; font-weight: 600;">HORA</p>
                                                            <p style="margin: 5px 0 0 0; font-size: 18px; color: #2d3748; font-weight: bold;">{hora_formateada}</p>
                                                        </td>
                                                    </tr>
                                                </table>
                                            </div>
                                            
                                            <!-- Médico -->
                                            <div style="margin-bottom: 20px;">
                                                <table width="100%" cellpadding="0" cellspacing="0">
                                                    <tr>
                                                        <td width="40" style="vertical-align: top;">
                                                            <div style="width: 36px; height: 36px; background-color: #ed8936; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                                                                <span style="font-size: 20px;">🩺‍⚕️</span>
                                                            </div>
                                                        </td>
                                                        <td style="padding-left: 15px; vertical-align: middle;">
                                                            <p style="margin: 0; font-size: 13px; color: #718096; font-weight: 600;">DOCTOR(A)</p>
                                                            <p style="margin: 5px 0 0 0; font-size: 18px; color: #2d3748; font-weight: bold;">Dr(a). {medico_nombre}</p>
                                                        </td>
                                                    </tr>
                                                </table>
                                            </div>
                                            
                                            <!-- Motivo -->
                                            <div style="margin-bottom: 20px;">
                                                <table width="100%" cellpadding="0" cellspacing="0">
                                                    <tr>
                                                        <td width="40" style="vertical-align: top;">
                                                            <div style="width: 36px; height: 36px; background-color: #9f7aea; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                                                                <span style="font-size: 20px;">📋</span>
                                                            </div>
                                                        </td>
                                                        <td style="padding-left: 15px; vertical-align: middle;">
                                                            <p style="margin: 0; font-size: 13px; color: #718096; font-weight: 600;">MOTIVO</p>
                                                            <p style="margin: 5px 0 0 0; font-size: 16px; color: #2d3748;">{cita.motivo or 'Consulta médica'}</p>
                                                        </td>
                                                    </tr>
                                                </table>
                                            </div>
                                            
                                            <!-- Código -->
                                            <div>
                                                <table width="100%" cellpadding="0" cellspacing="0">
                                                    <tr>
                                                        <td width="40" style="vertical-align: top;">
                                                            <div style="width: 36px; height: 36px; background-color: #4299e1; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                                                                <span style="font-size: 20px;">🔢</span>
                                                            </div>
                                                        </td>
                                                        <td style="padding-left: 15px; vertical-align: middle;">
                                                            <p style="margin: 0; font-size: 13px; color: #718096; font-weight: 600;">CÓDIGO DE CITA</p>
                                                            <p style="margin: 5px 0 0 0; font-size: 18px; color: #667eea; font-weight: bold;">#{cita.id}</p>
                                                        </td>
                                                    </tr>
                                                </table>
                                            </div>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        
                        <!-- Instrucciones -->
                        <tr>
                            <td style="padding: 0 40px 30px;">
                                <div style="background-color: #edf2f7; border-left: 4px solid #667eea; border-radius: 8px; padding: 20px;">
                                    <h3 style="margin: 0 0 15px 0; color: #2d3748; font-size: 16px; font-weight: bold;">📌 Instrucciones Importantes</h3>
                                    <ul style="margin: 0; padding-left: 20px; color: #4a5568; font-size: 14px; line-height: 1.8;">
                                        <li>Llegar <strong>15 minutos antes</strong> de su cita</li>
                                        <li>Traer su <strong>documento de identidad</strong></li>
                                        <li>Traer su <strong>carnet de seguro médico</strong> (si aplica)</li>
                                        <li>Traer <strong>exámenes previos</strong> relacionados</li>
                                    </ul>
                                </div>
                            </td>
                        </tr>
                        
                        <!-- Aviso de cancelación -->
                        <tr>
                            <td style="padding: 0 40px 30px;">
                                <div style="background-color: #fff5f5; border-left: 4px solid #fc8181; border-radius: 8px; padding: 15px;">
                                    <p style="margin: 0; color: #742a2a; font-size: 14px;">
                                        <strong>⚠️ Cancelaciones:</strong> Si necesita cancelar o reprogramar, contáctenos con al menos <strong>24 horas de anticipación</strong>.
                                    </p>
                                </div>
                            </td>
                        </tr>
                        
                        <!-- Footer -->
                        <tr>
                            <td style="background-color: #f7fafc; padding: 30px 40px; text-align: center; border-top: 1px solid #e2e8f0;">
                                <p style="margin: 0 0 10px 0; color: #2d3748; font-size: 16px; font-weight: bold;">Sistema de Gestión Hospitalaria</p>
                                <p style="margin: 0 0 15px 0; color: #718096; font-size: 14px;">Comprometidos con su salud y bienestar</p>
                                <div style="margin-top: 15px;">
                                    <p style="margin: 5px 0; color: #4a5568; font-size: 13px;">📞 Teléfono: (099) XXX-XXXX</p>
                                    <p style="margin: 5px 0; color: #4a5568; font-size: 13px;">📧 Email: info@hospital.com</p>
                                    <p style="margin: 5px 0; color: #4a5568; font-size: 13px;">🏥 Hospital Central</p>
                                </div>
                                <p style="margin: 20px 0 0 0; color: #a0aec0; font-size: 12px;">
                                    Este es un mensaje automático, por favor no responda a este correo.
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """
    
    return html_content
