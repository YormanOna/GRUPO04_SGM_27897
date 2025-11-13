"""
Sistema de notificaciones por email (RF-001)
Envía confirmaciones, recordatorios y avisos de citas
"""
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from typing import Optional
from app.core.config import settings

try:
    import resend
    RESEND_AVAILABLE = True
except ImportError:
    RESEND_AVAILABLE = False


def send_email(to_email: str, subject: str, body: str, body_html: Optional[str] = None):
    """
    Envía un correo electrónico usando Resend API o SMTP como fallback
    """
    try:
        # OPCIÓN 1: Usar Resend API (Recomendado)
        if settings.USE_RESEND and settings.RESEND_API_KEY and RESEND_AVAILABLE:
            try:
                resend.api_key = settings.RESEND_API_KEY
                
                params = {
                    "from": settings.EMAIL_FROM or "Sistema Hospitalario <onboarding@resend.dev>",
                    "to": [to_email],
                    "subject": subject,
                    "html": body_html if body_html else f"<pre>{body}</pre>",
                }
                
                response = resend.Emails.send(params)
                print(f"✅ Email enviado exitosamente con Resend a {to_email}")
                print(f"   ID: {response.get('id', 'N/A')}")
                return True
                
            except Exception as resend_error:
                print(f"⚠️ Error con Resend: {str(resend_error)}")
                print(f"💡 Intentando con SMTP como fallback...")
                # Continuar al fallback SMTP
        # Si no hay configuración SMTP, solo loguear en consola
        if not settings.SMTP_HOST:
            print(f"\n{'='*60}")
            print(f"📧 [EMAIL SIMULADO - Sin servidor SMTP configurado]")
            print(f"{'='*60}")
            print(f"Para: {to_email}")
            print(f"Asunto: {subject}")
            print(f"Contenido:\n{body[:200]}...")
            print(f"{'='*60}\n")
            return True
        
        # Crear mensaje
        msg = MIMEMultipart('alternative')
        msg['From'] = settings.EMAIL_FROM or "noreply@hospital.com"
        msg['To'] = to_email
        msg['Subject'] = subject
        
        # Agregar cuerpo de texto plano
        msg.attach(MIMEText(body, 'plain', 'utf-8'))
        
        # Agregar cuerpo HTML si existe
        if body_html:
            msg.attach(MIMEText(body_html, 'html', 'utf-8'))
        
        # Conectar y enviar con timeout corto para no bloquear
        try:
            # Servidor local (localhost:1025) - sin autenticación
            if settings.SMTP_HOST == 'localhost' or settings.SMTP_HOST == '127.0.0.1':
                with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=3) as server:
                    server.send_message(msg)
                print(f"✅ Email enviado a servidor local: {to_email}")
            # Servidor externo (Gmail, etc) - con autenticación
            else:
                with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
                    server.starttls()
                    if settings.SMTP_USER and settings.SMTP_PASSWORD:
                        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                    server.send_message(msg)
                print(f"✅ Email enviado exitosamente a {to_email}")
            
            return True
            
        except (ConnectionRefusedError, OSError) as conn_err:
            # Si el servidor local no está corriendo, simular en consola
            print(f"\n{'='*60}")
            print(f"📧 [EMAIL SIMULADO - Servidor SMTP no disponible]")
            print(f"{'='*60}")
            print(f"Para: {to_email}")
            print(f"Asunto: {subject}")
            print(f"Servidor: {settings.SMTP_HOST}:{settings.SMTP_PORT}")
            print(f"Error: {str(conn_err)}")
            print(f"\n💡 TIP: Para recibir emails reales localmente, ejecuta:")
            print(f"   python -m aiosmtpd -n -l localhost:1025")
            print(f"{'='*60}\n")
            return True  # No fallar la operación por email
        
    except Exception as e:
        print(f"⚠️ Error enviando email a {to_email}: {str(e)}")
        # No lanzar excepción, solo loguear
        return False


def enviar_confirmacion_cita(paciente_email: str, paciente_nombre: str, fecha: datetime, 
                             medico_nombre: str, motivo: str, cita_id: int):
    """
    Envía confirmación de cita agendada (RF-001)
    """
    # Formatear fecha y hora en español
    meses = {
        1: 'Enero', 2: 'Febrero', 3: 'Marzo', 4: 'Abril', 5: 'Mayo', 6: 'Junio',
        7: 'Julio', 8: 'Agosto', 9: 'Septiembre', 10: 'Octubre', 11: 'Noviembre', 12: 'Diciembre'
    }
    dias = {
        0: 'Lunes', 1: 'Martes', 2: 'Miércoles', 3: 'Jueves', 
        4: 'Viernes', 5: 'Sábado', 6: 'Domingo'
    }
    
    dia_semana = dias[fecha.weekday()]
    mes_nombre = meses[fecha.month]
    fecha_formateada = f"{dia_semana} {fecha.day} de {mes_nombre} de {fecha.year}"
    hora_formateada = fecha.strftime("%I:%M %p")
    
    subject = "✅ Su Cita Médica ha sido Confirmada"
    
    body = f"""
Estimado/a {paciente_nombre},

¡Su cita médica ha sido agendada exitosamente!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DETALLES DE SU CITA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📅 Fecha: {fecha_formateada}
🕐 Hora: {hora_formateada}
👨‍⚕️ Doctor(a): {medico_nombre}
📋 Motivo: {motivo}
🔢 Código de Cita: #{cita_id}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INSTRUCCIONES IMPORTANTES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ Llegar 15 minutos antes de su cita
✓ Traer su documento de identidad
✓ Traer su carnet de seguro médico (si aplica)
✓ Traer exámenes previos relacionados

Si necesita CANCELAR o REPROGRAMAR su cita, 
contáctenos con al menos 24 horas de anticipación.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Estamos comprometidos con su salud y bienestar.

Atentamente,
Sistema de Gestión Hospitalaria
📞 Teléfono: (099) XXX-XXXX
📧 Email: info@hospital.com
🏥 Hospital Central
    """.strip()
    
    body_html = f"""
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
                                <p style="font-size: 16px; color: #2d3748; margin: 0;">Estimado/a <strong style="color: #667eea;">{paciente_nombre}</strong>,</p>
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
                                                                <span style="font-size: 20px;">👨‍⚕️</span>
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
                                                            <p style="margin: 5px 0 0 0; font-size: 16px; color: #2d3748;">{motivo}</p>
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
                                                            <p style="margin: 5px 0 0 0; font-size: 18px; color: #667eea; font-weight: bold;">#{cita_id}</p>
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
    
    return send_email(paciente_email, subject, body, body_html)


def enviar_recordatorio_cita(paciente_email: str, paciente_nombre: str, fecha: datetime,
                             medico_nombre: str, cita_id: int):
    """
    Envía recordatorio 24 horas antes de la cita (RF-001)
    """
    meses = {
        1: 'Enero', 2: 'Febrero', 3: 'Marzo', 4: 'Abril', 5: 'Mayo', 6: 'Junio',
        7: 'Julio', 8: 'Agosto', 9: 'Septiembre', 10: 'Octubre', 11: 'Noviembre', 12: 'Diciembre'
    }
    dias = {
        0: 'Lunes', 1: 'Martes', 2: 'Miércoles', 3: 'Jueves', 
        4: 'Viernes', 5: 'Sábado', 6: 'Domingo'
    }
    
    dia_semana = dias[fecha.weekday()]
    mes_nombre = meses[fecha.month]
    fecha_formateada = f"{dia_semana} {fecha.day} de {mes_nombre}"
    hora_formateada = fecha.strftime("%I:%M %p")
    
    subject = "🔔 Recordatorio: Cita Médica Mañana"
    
    body = f"""
Estimado/a {paciente_nombre},

Este es un recordatorio de su cita médica programada para MAÑANA:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 Fecha: {fecha_formateada}
🕐 Hora: {hora_formateada}
👨‍⚕️ Doctor(a): {medico_nombre}
🔢 Código: #{cita_id}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RECUERDE:
✓ Llegar 15 minutos antes
✓ Traer documento de identidad
✓ Traer carnet de seguro (si aplica)

Si no puede asistir, contáctenos lo antes posible.

Atentamente,
Sistema de Gestión Hospitalaria
📞 (099) XXX-XXXX
    """.strip()
    
    body_html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f7fa;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f7fa; padding: 40px 20px;">
            <tr>
                <td align="center">
                    <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
                        <!-- Header -->
                        <tr>
                            <td style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 30px; text-align: center;">
                                <div style="background-color: rgba(255,255,255,0.2); width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 20px;">
                                    <span style="font-size: 40px; line-height: 80px;">🔔</span>
                                </div>
                                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">Recordatorio de Cita</h1>
                                <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Su cita es mañana</p>
                            </td>
                        </tr>
                        
                        <tr>
                            <td style="padding: 30px 40px;">
                                <p style="font-size: 16px; color: #2d3748; margin: 0;">Estimado/a <strong style="color: #f59e0b;">{paciente_nombre}</strong>,</p>
                                <p style="font-size: 16px; color: #4a5568; margin: 15px 0;">Le recordamos que tiene una cita médica programada para <strong>MAÑANA</strong>:</p>
                                
                                <table width="100%" cellpadding="15" cellspacing="0" style="background-color: #fef3c7; border-radius: 12px; margin: 20px 0;">
                                    <tr>
                                        <td>
                                            <p style="margin: 8px 0; color: #78350f; font-size: 16px;"><strong>📅 Fecha:</strong> {fecha_formateada}</p>
                                            <p style="margin: 8px 0; color: #78350f; font-size: 16px;"><strong>🕐 Hora:</strong> {hora_formateada}</p>
                                            <p style="margin: 8px 0; color: #78350f; font-size: 16px;"><strong>👨‍⚕️ Doctor(a):</strong> Dr(a). {medico_nombre}</p>
                                            <p style="margin: 8px 0; color: #78350f; font-size: 16px;"><strong>🔢 Código:</strong> #{cita_id}</p>
                                        </td>
                                    </tr>
                                </table>
                                
                                <div style="background-color: #e0f2fe; border-left: 4px solid #0284c7; border-radius: 8px; padding: 20px; margin: 20px 0;">
                                    <h3 style="margin: 0 0 12px 0; color: #0c4a6e; font-size: 16px;">✓ Recuerde:</h3>
                                    <ul style="margin: 0; padding-left: 20px; color: #0c4a6e; font-size: 14px; line-height: 1.8;">
                                        <li>Llegar <strong>15 minutos antes</strong></li>
                                        <li>Traer documento de identidad</li>
                                        <li>Traer carnet de seguro (si aplica)</li>
                                    </ul>
                                </div>
                                
                                <p style="color: #ef4444; font-size: 14px; margin: 20px 0;">
                                    <strong>⚠️</strong> Si no puede asistir, contáctenos lo antes posible.
                                </p>
                            </td>
                        </tr>
                        
                        <tr>
                            <td style="background-color: #f7fafc; padding: 20px 40px; text-align: center; border-top: 1px solid #e2e8f0;">
                                <p style="margin: 0; color: #718096; font-size: 13px;">Sistema de Gestión Hospitalaria</p>
                                <p style="margin: 5px 0 0 0; color: #a0aec0; font-size: 12px;">📞 (099) XXX-XXXX</p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """
    
    return send_email(paciente_email, subject, body, body_html)


def enviar_cancelacion_cita(paciente_email: str, paciente_nombre: str, fecha: datetime,
                            motivo_cancelacion: str):
    """
    Notifica cancelación de cita (RF-001)
    """
    meses = {
        1: 'Enero', 2: 'Febrero', 3: 'Marzo', 4: 'Abril', 5: 'Mayo', 6: 'Junio',
        7: 'Julio', 8: 'Agosto', 9: 'Septiembre', 10: 'Octubre', 11: 'Noviembre', 12: 'Diciembre'
    }
    
    mes_nombre = meses[fecha.month]
    fecha_formateada = f"{fecha.day} de {mes_nombre} de {fecha.year}"
    hora_formateada = fecha.strftime("%I:%M %p")
    
    subject = "❌ Notificación: Cita Médica Cancelada"
    
    body = f"""
Estimado/a {paciente_nombre},

Le informamos que su cita médica ha sido CANCELADA.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DATOS DE LA CITA CANCELADA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 Fecha: {fecha_formateada}
🕐 Hora: {hora_formateada}

MOTIVO DE CANCELACIÓN:
{motivo_cancelacion}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

¿Desea reagendar su cita?
Contáctenos o acceda al sistema para programar una nueva fecha.

Atentamente,
Sistema de Gestión Hospitalaria
📞 (099) XXX-XXXX
📧 info@hospital.com
    """.strip()
    
    body_html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f7fa;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f7fa; padding: 40px 20px;">
            <tr>
                <td align="center">
                    <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
                        <!-- Header -->
                        <tr>
                            <td style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 40px 30px; text-align: center;">
                                <div style="background-color: rgba(255,255,255,0.2); width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 20px;">
                                    <span style="font-size: 40px; line-height: 80px;">❌</span>
                                </div>
                                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">Cita Cancelada</h1>
                                <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Su cita médica ha sido cancelada</p>
                            </td>
                        </tr>
                        
                        <tr>
                            <td style="padding: 30px 40px;">
                                <p style="font-size: 16px; color: #2d3748; margin: 0;">Estimado/a <strong style="color: #ef4444;">{paciente_nombre}</strong>,</p>
                                <p style="font-size: 16px; color: #4a5568; margin: 15px 0;">Le informamos que su cita médica ha sido <strong>CANCELADA</strong>.</p>
                                
                                <table width="100%" cellpadding="15" cellspacing="0" style="background-color: #fee2e2; border-radius: 12px; margin: 20px 0;">
                                    <tr>
                                        <td>
                                            <h3 style="margin: 0 0 12px 0; color: #991b1b; font-size: 16px;">Datos de la Cita Cancelada:</h3>
                                            <p style="margin: 8px 0; color: #7f1d1d; font-size: 16px;"><strong>📅 Fecha:</strong> {fecha_formateada}</p>
                                            <p style="margin: 8px 0; color: #7f1d1d; font-size: 16px;"><strong>🕐 Hora:</strong> {hora_formateada}</p>
                                        </td>
                                    </tr>
                                </table>
                                
                                <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 20px 0;">
                                    <h3 style="margin: 0 0 10px 0; color: #78350f; font-size: 16px;">📝 Motivo de Cancelación:</h3>
                                    <p style="margin: 0; color: #78350f; font-size: 14px; line-height: 1.6;">{motivo_cancelacion}</p>
                                </div>
                                
                                <div style="background-color: #e0f2fe; border-radius: 12px; padding: 25px; margin: 25px 0; text-align: center;">
                                    <h3 style="margin: 0 0 10px 0; color: #0c4a6e; font-size: 18px;">¿Desea reagendar su cita?</h3>
                                    <p style="margin: 0; color: #075985; font-size: 14px;">Contáctenos o acceda al sistema para programar una nueva fecha.</p>
                                </div>
                            </td>
                        </tr>
                        
                        <tr>
                            <td style="background-color: #f7fafc; padding: 20px 40px; text-align: center; border-top: 1px solid #e2e8f0;">
                                <p style="margin: 0; color: #2d3748; font-size: 14px; font-weight: bold;">Sistema de Gestión Hospitalaria</p>
                                <p style="margin: 5px 0; color: #718096; font-size: 13px;">📞 (099) XXX-XXXX | 📧 info@hospital.com</p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """
    
    return send_email(paciente_email, subject, body, body_html)


def enviar_reprogramacion_cita(paciente_email: str, paciente_nombre: str, 
                               fecha_anterior: datetime, fecha_nueva: datetime,
                               medico_nombre: str, cita_id: int):
    """
    Notifica reprogramación de cita (RF-001)
    """
    meses = {
        1: 'Enero', 2: 'Febrero', 3: 'Marzo', 4: 'Abril', 5: 'Mayo', 6: 'Junio',
        7: 'Julio', 8: 'Agosto', 9: 'Septiembre', 10: 'Octubre', 11: 'Noviembre', 12: 'Diciembre'
    }
    
    # Fecha anterior
    mes_ant = meses[fecha_anterior.month]
    fecha_ant_formateada = f"{fecha_anterior.day} de {mes_ant} de {fecha_anterior.year}"
    hora_ant_formateada = fecha_anterior.strftime("%I:%M %p")
    
    # Fecha nueva
    mes_nuevo = meses[fecha_nueva.month]
    fecha_nueva_formateada = f"{fecha_nueva.day} de {mes_nuevo} de {fecha_nueva.year}"
    hora_nueva_formateada = fecha_nueva.strftime("%I:%M %p")
    
    subject = "🔄 Importante: Cita Médica Reprogramada"
    
    body = f"""
Estimado/a {paciente_nombre},

Su cita médica ha sido REPROGRAMADA.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FECHA ANTERIOR (CANCELADA):
📅 {fecha_ant_formateada}
🕐 {hora_ant_formateada}

       ⬇️  CAMBIO A  ⬇️

NUEVA FECHA (CONFIRMADA):
📅 {fecha_nueva_formateada}
🕐 {hora_nueva_formateada}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👨‍⚕️ Doctor(a): {medico_nombre}
🔢 Código: #{cita_id}

RECUERDE:
✓ Llegar 15 minutos antes
✓ Traer documento de identidad
✓ Traer carnet de seguro (si aplica)

Atentamente,
Sistema de Gestión Hospitalaria
📞 (099) XXX-XXXX
    """.strip()
    
    body_html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f7fa;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f7fa; padding: 40px 20px;">
            <tr>
                <td align="center">
                    <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
                        <!-- Header -->
                        <tr>
                            <td style="background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); padding: 40px 30px; text-align: center;">
                                <div style="background-color: rgba(255,255,255,0.2); width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 20px;">
                                    <span style="font-size: 40px; line-height: 80px;">🔄</span>
                                </div>
                                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">Cita Reprogramada</h1>
                                <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Su cita ha sido cambiada a una nueva fecha</p>
                            </td>
                        </tr>
                        
                        <tr>
                            <td style="padding: 30px 40px;">
                                <p style="font-size: 16px; color: #2d3748; margin: 0;">Estimado/a <strong style="color: #8b5cf6;">{paciente_nombre}</strong>,</p>
                                <p style="font-size: 16px; color: #4a5568; margin: 15px 0;">Le informamos que su cita médica ha sido <strong>REPROGRAMADA</strong> a una nueva fecha:</p>
                                
                                <!-- Fecha Anterior -->
                                <table width="100%" cellpadding="15" cellspacing="0" style="background-color: #fee2e2; border-radius: 12px; margin: 20px 0; border: 2px dashed #f87171;">
                                    <tr>
                                        <td>
                                            <h3 style="margin: 0 0 12px 0; color: #991b1b; font-size: 16px;">❌ Fecha Anterior (Cancelada):</h3>
                                            <p style="margin: 8px 0; color: #7f1d1d; font-size: 16px; text-decoration: line-through;"><strong>📅 Fecha:</strong> {fecha_ant_formateada}</p>
                                            <p style="margin: 8px 0; color: #7f1d1d; font-size: 16px; text-decoration: line-through;"><strong>🕐 Hora:</strong> {hora_ant_formateada}</p>
                                        </td>
                                    </tr>
                                </table>
                                
                                <!-- Flecha de cambio -->
                                <div style="text-align: center; margin: 15px 0;">
                                    <span style="font-size: 32px; color: #8b5cf6;">⬇️</span>
                                    <p style="margin: 5px 0; color: #8b5cf6; font-weight: bold; font-size: 14px;">CAMBIO A</p>
                                    <span style="font-size: 32px; color: #8b5cf6;">⬇️</span>
                                </div>
                                
                                <!-- Nueva Fecha -->
                                <table width="100%" cellpadding="15" cellspacing="0" style="background: linear-gradient(135deg, #ddd6fe, #e0e7ff); border-radius: 12px; margin: 20px 0; border: 2px solid #8b5cf6;">
                                    <tr>
                                        <td>
                                            <h3 style="margin: 0 0 12px 0; color: #5b21b6; font-size: 18px;">✅ Nueva Fecha (Confirmada):</h3>
                                            <p style="margin: 8px 0; color: #5b21b6; font-size: 18px; font-weight: bold;"><strong>📅 Fecha:</strong> {fecha_nueva_formateada}</p>
                                            <p style="margin: 8px 0; color: #5b21b6; font-size: 18px; font-weight: bold;"><strong>🕐 Hora:</strong> {hora_nueva_formateada}</p>
                                            <hr style="border: none; border-top: 1px solid rgba(91, 33, 182, 0.2); margin: 15px 0;">
                                            <p style="margin: 8px 0; color: #5b21b6; font-size: 16px;"><strong>👨‍⚕️ Doctor(a):</strong> Dr(a). {medico_nombre}</p>
                                            <p style="margin: 8px 0; color: #5b21b6; font-size: 16px;"><strong>🔢 Código:</strong> #{cita_id}</p>
                                        </td>
                                    </tr>
                                </table>
                                
                                <div style="background-color: #e0f2fe; border-left: 4px solid #0284c7; border-radius: 8px; padding: 20px; margin: 20px 0;">
                                    <h3 style="margin: 0 0 12px 0; color: #0c4a6e; font-size: 16px;">✓ Recuerde:</h3>
                                    <ul style="margin: 0; padding-left: 20px; color: #0c4a6e; font-size: 14px; line-height: 1.8;">
                                        <li>Llegar <strong>15 minutos antes</strong></li>
                                        <li>Traer documento de identidad</li>
                                        <li>Traer carnet de seguro (si aplica)</li>
                                    </ul>
                                </div>
                            </td>
                        </tr>
                        
                        <tr>
                            <td style="background-color: #f7fafc; padding: 20px 40px; text-align: center; border-top: 1px solid #e2e8f0;">
                                <p style="margin: 0; color: #2d3748; font-size: 14px; font-weight: bold;">Sistema de Gestión Hospitalaria</p>
                                <p style="margin: 5px 0; color: #718096; font-size: 13px;">📞 (099) XXX-XXXX</p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """
    
    return send_email(paciente_email, subject, body, body_html)
