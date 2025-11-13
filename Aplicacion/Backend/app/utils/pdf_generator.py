"""
Utilidad para generar recetas médicas y comprobantes de cita en PDF
Diseño profesional con membrete y formato médico estándar
RF-001: Incluye generación de comprobantes con código QR
Versión 2.0 - Diseño elegante y moderno
"""
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from reportlab.pdfgen import canvas
from io import BytesIO
from datetime import datetime
import qrcode
from PIL import Image as PILImage

# Paleta de colores moderna y profesional
COLORS = {
    'primary': colors.HexColor('#2563eb'),      # Azul vibrante
    'secondary': colors.HexColor('#7c3aed'),    # Púrpura elegante
    'success': colors.HexColor('#059669'),      # Verde esmeralda
    'warning': colors.HexColor('#d97706'),      # Ámbar
    'danger': colors.HexColor('#dc2626'),       # Rojo
    'dark': colors.HexColor('#1f2937'),         # Gris oscuro
    'light': colors.HexColor('#f9fafb'),        # Gris muy claro
    'border': colors.HexColor('#e5e7eb'),       # Gris border
    'text_secondary': colors.HexColor('#6b7280'), # Texto secundario
    'bg_highlight': colors.HexColor('#eff6ff'),  # Azul muy claro
    'bg_success': colors.HexColor('#d1fae5'),    # Verde muy claro
    'bg_warning': colors.HexColor('#fef3c7'),    # Amarillo claro
}

class NumberedCanvas(canvas.Canvas):
    """Canvas personalizado para agregar encabezado y pie de página"""
    def __init__(self, *args, **kwargs):
        canvas.Canvas.__init__(self, *args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)

    def draw_page_decorations(self, page_count):
        """Dibuja decoraciones en cada página"""
        # Línea superior decorativa
        self.setStrokeColor(COLORS['primary'])
        self.setLineWidth(3)
        self.line(50, 750, 562, 750)
        
        # Línea inferior con página
        self.setStrokeColor(COLORS['border'])
        self.setLineWidth(1)
        self.line(50, 50, 562, 50)
        
        # Número de página
        self.setFont('Helvetica', 8)
        self.setFillColor(COLORS['text_secondary'])
        page = f"Página {self._pageNumber} de {page_count}"
        self.drawRightString(562, 35, page)

def generar_receta_pdf(receta, paciente, medico):
    """
    Genera un PDF de receta médica con diseño elegante y profesional
    
    Args:
        receta: Objeto Receta con la información de prescripción
        paciente: Objeto Paciente con datos del paciente
        medico: Objeto Empleado/Medico con datos del médico
    
    Returns:
        BytesIO: Buffer con el PDF generado
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer, 
        pagesize=letter,
        rightMargin=60, 
        leftMargin=60,
        topMargin=85, 
        bottomMargin=65,
        title=f"Receta Médica #{receta.id}",
        author="Sistema de Gestión Médica"
    )
    
    # Container para los elementos del PDF
    elements = []
    
    # Estilos base
    styles = getSampleStyleSheet()
    
    # === ESTILOS PERSONALIZADOS ELEGANTES ===
    
    # Título principal con gradiente visual
    title_style = ParagraphStyle(
        'ElegantTitle',
        parent=styles['Heading1'],
        fontSize=26,
        textColor=COLORS['primary'],
        spaceAfter=8,
        spaceBefore=5,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold',
        leading=30
    )
    
    # Subtítulo del documento
    doc_subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontSize=11,
        textColor=COLORS['text_secondary'],
        spaceAfter=20,
        alignment=TA_CENTER,
        fontName='Helvetica-Oblique'
    )
    
    # Etiquetas de sección
    section_label_style = ParagraphStyle(
        'SectionLabel',
        parent=styles['Heading2'],
        fontSize=13,
        textColor=COLORS['primary'],
        spaceAfter=10,
        spaceBefore=15,
        fontName='Helvetica-Bold',
        leftIndent=5,
        borderPadding=5,
        borderWidth=0,
        borderColor=COLORS['primary']
    )
    
    # Texto normal mejorado
    normal_style = ParagraphStyle(
        'NormalPlus',
        parent=styles['Normal'],
        fontSize=10,
        spaceAfter=6,
        leading=14,
        textColor=COLORS['dark']
    )
    
    # Estilo para datos importantes
    highlight_style = ParagraphStyle(
        'Highlight',
        parent=styles['Normal'],
        fontSize=11,
        fontName='Helvetica-Bold',
        textColor=COLORS['dark'],
        leading=15
    )
    
    # === ENCABEZADO ELEGANTE CON DISEÑO MODERNO ===
    
    # Título principal con ícono
    elements.append(Paragraph('⚕️ RECETA MÉDICA', title_style))
    elements.append(Paragraph('Sistema de Gestión Médica Hospitalaria', doc_subtitle_style))
    
    # Tarjeta de información de la receta
    fecha_hora = receta.fecha_emision.strftime("%d de %B de %Y - %H:%M")
    estado_color = COLORS['success'] if receta.estado == 'dispensada' else COLORS['warning']
    
    info_receta_data = [
        ['', ''],  # Fila de espaciado
        [
            Paragraph(f'<font size=10 color="#6b7280"><b>N° DE RECETA</b></font><br/><font size=14 color="#1f2937"><b>#{str(receta.id).zfill(6)}</b></font>', normal_style),
            Paragraph(f'<font size=10 color="#6b7280"><b>FECHA DE EMISIÓN</b></font><br/><font size=11 color="#1f2937">{fecha_hora}</font>', normal_style)
        ],
        [
            Paragraph(f'<font size=10 color="#6b7280"><b>ESTADO</b></font><br/><font size=11><b>{receta.estado.upper()}</b></font>', normal_style),
            Paragraph(f'<font size=10 color="#6b7280"><b>VALIDEZ</b></font><br/><font size=11 color="#1f2937">30 días</font>', normal_style)
        ],
    ]
    
    info_receta_table = Table(info_receta_data, colWidths=[3.5*inch, 3*inch])
    info_receta_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), COLORS['bg_highlight']),
        ('BOX', (0, 0), (-1, -1), 2, COLORS['primary']),
        ('INNERGRID', (0, 1), (-1, -1), 0.5, COLORS['border']),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 15),
        ('RIGHTPADDING', (0, 0), (-1, -1), 15),
        ('TOPPADDING', (0, 0), (-1, 0), 5),
        ('TOPPADDING', (0, 1), (-1, -1), 12),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
    ]))
    elements.append(info_receta_table)
    elements.append(Spacer(1, 0.25*inch))
    
    # === SECCIÓN: DATOS DEL PACIENTE ===
    elements.append(Paragraph('� INFORMACIÓN DEL PACIENTE', section_label_style))
    
    edad = calcular_edad(paciente.fecha_nacimiento) if paciente.fecha_nacimiento else 'No especificado'
    genero_icono = '♂️' if paciente.genero and paciente.genero.lower() == 'masculino' else '♀️' if paciente.genero else '⚥'
    
    paciente_data = [
        [
            Paragraph('<font size=9 color="#6b7280"><b>NOMBRE COMPLETO</b></font>', normal_style),
            Paragraph(f'<font size=11 color="#1f2937"><b>{paciente.nombre} {paciente.apellido}</b></font>', normal_style)
        ],
        [
            Paragraph('<font size=9 color="#6b7280"><b>CÉDULA / ID</b></font>', normal_style),
            Paragraph(f'<font size=10 color="#1f2937">{paciente.cedula}</font>', normal_style)
        ],
        [
            Paragraph('<font size=9 color="#6b7280"><b>EDAD</b></font>', normal_style),
            Paragraph(f'<font size=10 color="#1f2937">{edad}</font>', normal_style)
        ],
        [
            Paragraph(f'<font size=9 color="#6b7280"><b>GÉNERO {genero_icono}</b></font>', normal_style),
            Paragraph(f'<font size=10 color="#1f2937">{paciente.genero or "No especificado"}</font>', normal_style)
        ],
        [
            Paragraph('<font size=9 color="#6b7280"><b>TELÉFONO</b></font>', normal_style),
            Paragraph(f'<font size=10 color="#1f2937">{paciente.telefono or "No registrado"}</font>', normal_style)
        ],
    ]
    
    if paciente.email:
        paciente_data.append([
            Paragraph('<font size=9 color="#6b7280"><b>EMAIL</b></font>', normal_style),
            Paragraph(f'<font size=10 color="#1f2937">{paciente.email}</font>', normal_style)
        ])
    
    paciente_table = Table(paciente_data, colWidths=[1.8*inch, 4.7*inch])
    paciente_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), COLORS['light']),
        ('BACKGROUND', (1, 0), (1, -1), colors.white),
        ('BOX', (0, 0), (-1, -1), 1.5, COLORS['border']),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, COLORS['border']),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 12),
        ('RIGHTPADDING', (0, 0), (-1, -1), 12),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(paciente_table)
    
    # Alerta de alergias si existen
    if paciente.alergias:
        elements.append(Spacer(1, 0.1*inch))
        alergia_para = Paragraph(
            f'<font size=10><b>⚠️ ALERGIAS CONOCIDAS:</b> {paciente.alergias}</font>',
            normal_style
        )
        alergia_table = Table([[alergia_para]], colWidths=[6.5*inch])
        alergia_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#fee2e2')),
            ('BOX', (0, 0), (-1, -1), 2, COLORS['danger']),
            ('LEFTPADDING', (0, 0), (-1, -1), 15),
            ('RIGHTPADDING', (0, 0), (-1, -1), 15),
            ('TOPPADDING', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
        ]))
        elements.append(alergia_table)
    
    elements.append(Spacer(1, 0.25*inch))
    
    # === SECCIÓN: PRESCRIPCIÓN MÉDICA (Rp) ===
    elements.append(Paragraph('💊 PRESCRIPCIÓN (Rp)', section_label_style))
    
    # Estilo para medicamentos con formato elegante
    medicamentos_style = ParagraphStyle(
        'PrescriptionText',
        parent=styles['Normal'],
        fontSize=11,
        leading=18,
        leftIndent=5,
        fontName='Helvetica',
        textColor=COLORS['dark']
    )
    
    # Formatear medicamentos con viñetas si es texto multi-línea
    medicamentos_text = receta.medicamentos.replace('\n', '<br/>• ')
    if not medicamentos_text.startswith('• '):
        medicamentos_text = '• ' + medicamentos_text
    
    medicamentos_paragraph = Paragraph(medicamentos_text, medicamentos_style)
    
    medicamentos_table = Table([[medicamentos_paragraph]], colWidths=[6.5*inch])
    medicamentos_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), COLORS['bg_warning']),
        ('BOX', (0, 0), (-1, -1), 2.5, COLORS['warning']),
        ('LEFTPADDING', (0, 0), (-1, -1), 20),
        ('RIGHTPADDING', (0, 0), (-1, -1), 20),
        ('TOPPADDING', (0, 0), (-1, -1), 18),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 18),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    elements.append(medicamentos_table)
    elements.append(Spacer(1, 0.2*inch))
    
    # === SECCIÓN: INDICACIONES Y POSOLOGÍA ===
    if receta.indicaciones:
        elements.append(Paragraph('� INDICACIONES Y POSOLOGÍA', section_label_style))
        
        indicaciones_style = ParagraphStyle(
            'Instructions',
            parent=styles['Normal'],
            fontSize=10,
            leading=16,
            textColor=COLORS['dark'],
            alignment=TA_JUSTIFY
        )
        
        indicaciones_text = receta.indicaciones.replace('\n', '<br/>')
        indicaciones_paragraph = Paragraph(indicaciones_text, indicaciones_style)
        
        indicaciones_table = Table([[indicaciones_paragraph]], colWidths=[6.5*inch])
        indicaciones_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#e0f2fe')),
            ('BOX', (0, 0), (-1, -1), 1.5, COLORS['primary']),
            ('LEFTPADDING', (0, 0), (-1, -1), 15),
            ('RIGHTPADDING', (0, 0), (-1, -1), 15),
            ('TOPPADDING', (0, 0), (-1, -1), 12),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ]))
        elements.append(indicaciones_table)
        elements.append(Spacer(1, 0.25*inch))
    
    # === INFORMACIÓN DE DISPENSACIÓN (si aplica) ===
    if receta.dispensada_por or receta.fecha_dispensacion:
        elements.append(Paragraph('✅ INFORMACIÓN DE DISPENSACIÓN', section_label_style))
        
        disp_data = []
        if receta.fecha_dispensacion:
            disp_data.append([
                Paragraph('<font size=9 color="#6b7280"><b>FECHA DE DISPENSACIÓN</b></font>', normal_style),
                Paragraph(f'<font size=10>{receta.fecha_dispensacion.strftime("%d/%m/%Y %H:%M")}</font>', normal_style)
            ])
        if receta.lote:
            disp_data.append([
                Paragraph('<font size=9 color="#6b7280"><b>LOTE</b></font>', normal_style),
                Paragraph(f'<font size=10>{receta.lote}</font>', normal_style)
            ])
        if receta.fecha_vencimiento:
            disp_data.append([
                Paragraph('<font size=9 color="#6b7280"><b>FECHA DE VENCIMIENTO</b></font>', normal_style),
                Paragraph(f'<font size=10>{receta.fecha_vencimiento.strftime("%d/%m/%Y")}</font>', normal_style)
            ])
        
        if disp_data:
            disp_table = Table(disp_data, colWidths=[2*inch, 4.5*inch])
            disp_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (0, -1), COLORS['bg_success']),
                ('BACKGROUND', (1, 0), (1, -1), colors.white),
                ('BOX', (0, 0), (-1, -1), 1, COLORS['success']),
                ('INNERGRID', (0, 0), (-1, -1), 0.5, COLORS['border']),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('LEFTPADDING', (0, 0), (-1, -1), 12),
                ('RIGHTPADDING', (0, 0), (-1, -1), 12),
                ('TOPPADDING', (0, 0), (-1, -1), 8),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ]))
            elements.append(disp_table)
            elements.append(Spacer(1, 0.2*inch))
    
    # === FIRMA DEL MÉDICO PRESCRIPTOR ===
    elements.append(Spacer(1, 0.4*inch))
    
    # Obtener especialidad si está disponible
    especialidad = ''
    if hasattr(medico, 'especialidad') and medico.especialidad:
        especialidad = medico.especialidad
    
    firma_data = [
        ['', ''],
        ['', ''],
        ['', Paragraph('<font size=1 color="#e5e7eb">______________________________</font>', normal_style)],
        ['', Paragraph(f'<font size=11><b>Dr(a). {medico.nombre} {medico.apellido}</b></font>', normal_style)],
        ['', Paragraph(f'<font size=9 color="#6b7280">Registro Médico: {medico.cedula}</font>', normal_style)],
    ]
    
    if especialidad:
        firma_data.append(['', Paragraph(f'<font size=9 color="#6b7280">{especialidad}</font>', normal_style)])
    
    firma_table = Table(firma_data, colWidths=[3.2*inch, 3.3*inch])
    firma_table.setStyle(TableStyle([
        ('ALIGN', (1, 0), (1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LINEABOVE', (1, 2), (1, 2), 1.5, COLORS['dark']),
    ]))
    elements.append(firma_table)
    
    # === NOTAS IMPORTANTES Y PIE DE PÁGINA ===
    elements.append(Spacer(1, 0.35*inch))
    
    footer_style = ParagraphStyle(
        'FooterNotes',
        parent=styles['Normal'],
        fontSize=8,
        textColor=COLORS['text_secondary'],
        alignment=TA_CENTER,
        leading=12
    )
    
    notas_para = Paragraph(
        '<font size=9><b>NOTAS IMPORTANTES</b></font><br/>'
        '• Esta receta médica es válida por 30 días desde la fecha de emisión<br/>'
        '• No automedicarse. Seguir estrictamente las indicaciones del médico<br/>'
        '• Conservar los medicamentos en lugar fresco y seco, fuera del alcance de los niños<br/>'
        '• Ante cualquier reacción adversa, suspender y consultar inmediatamente',
        footer_style
    )
    
    notas_table = Table([[notas_para]], colWidths=[6.5*inch])
    notas_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#fafafa')),
        ('BOX', (0, 0), (-1, -1), 1, COLORS['border']),
        ('LEFTPADDING', (0, 0), (-1, -1), 15),
        ('RIGHTPADDING', (0, 0), (-1, -1), 15),
        ('TOPPADDING', (0, 0), (-1, -1), 12),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
    ]))
    elements.append(notas_table)
    
    # Construir PDF con canvas personalizado
    doc.build(elements, canvasmaker=NumberedCanvas)
    
    buffer.seek(0)
    return buffer

def calcular_edad(fecha_nacimiento):
    """Calcula la edad a partir de la fecha de nacimiento"""
    if not fecha_nacimiento:
        return "N/A"
    
    hoy = datetime.now().date()
    if isinstance(fecha_nacimiento, datetime):
        fecha_nacimiento = fecha_nacimiento.date()
    
    edad = hoy.year - fecha_nacimiento.year
    if hoy.month < fecha_nacimiento.month or (hoy.month == fecha_nacimiento.month and hoy.day < fecha_nacimiento.day):
        edad -= 1
    
    return f"{edad} años"


def generar_comprobante_cita_pdf(cita, paciente, medico=None):
    """
    Genera un comprobante de cita médica elegante con código QR (RF-001)
    
    Args:
        cita: Objeto Cita con información de la cita
        paciente: Objeto Paciente
        medico: Objeto Medico/Empleado (opcional)
    
    Returns:
        BytesIO: Buffer con el PDF generado
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer, 
        pagesize=letter,
        rightMargin=60, 
        leftMargin=60,
        topMargin=85, 
        bottomMargin=65,
        title=f"Comprobante de Cita #{cita.id}",
        author="Sistema de Gestión Médica"
    )
    
    elements = []
    styles = getSampleStyleSheet()
    
    # === ESTILOS PERSONALIZADOS PARA COMPROBANTE ===
    
    # Título principal con diseño llamativo
    title_style = ParagraphStyle(
        'AppointmentTitle',
        parent=styles['Heading1'],
        fontSize=28,
        textColor=COLORS['primary'],
        spaceAfter=6,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold',
        leading=32
    )
    
    # Subtítulo institucional
    subtitle_style = ParagraphStyle(
        'InstitutionSubtitle',
        parent=styles['Normal'],
        fontSize=12,
        textColor=COLORS['text_secondary'],
        spaceAfter=10,
        alignment=TA_CENTER,
        fontName='Helvetica-Oblique'
    )
    
    # Estilo para secciones
    section_title_style = ParagraphStyle(
        'SectionTitle',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=COLORS['primary'],
        spaceAfter=12,
        spaceBefore=10,
        fontName='Helvetica-Bold',
        leftIndent=5
    )
    
    # Estilo para texto informativo
    info_text_style = ParagraphStyle(
        'InfoText',
        parent=styles['Normal'],
        fontSize=10,
        textColor=COLORS['dark'],
        leading=14
    )
    
    # Estilo para instrucciones
    instruction_style = ParagraphStyle(
        'Instructions',
        parent=styles['Normal'],
        fontSize=10,
        textColor=COLORS['text_secondary'],
        alignment=TA_CENTER,
        leading=15,
        spaceAfter=6
    )
    
    # === ENCABEZADO PRINCIPAL ===
    elements.append(Paragraph('🗓️ COMPROBANTE DE CITA', title_style))
    elements.append(Paragraph('Centro Médico - Sistema de Gestión Hospitalaria', subtitle_style))
    
    # Fecha de emisión del comprobante
    fecha_emision = datetime.now().strftime("%d/%m/%Y %H:%M")
    emision_para = Paragraph(
        f'<font size=8 color="#9ca3af">Documento generado el: {fecha_emision}</font>',
        subtitle_style
    )
    elements.append(emision_para)
    elements.append(Spacer(1, 0.25*inch))
    
    # === GENERAR CÓDIGO QR ===
    qr_data = f"CITA:{cita.id}|PACIENTE:{paciente.cedula}|FECHA:{cita.fecha.strftime('%Y%m%d')}"
    qr = qrcode.QRCode(version=1, box_size=8, border=2)
    qr.add_data(qr_data)
    qr.make(fit=True)
    # qrcode requiere string o tupla, no objeto Color de ReportLab
    qr_img = qr.make_image(fill_color="black", back_color="white")
    
    qr_buffer = BytesIO()
    qr_img.save(qr_buffer, format='PNG')
    qr_buffer.seek(0)
    qr_image = Image(qr_buffer, width=1.6*inch, height=1.6*inch)
    
    # === TARJETA PRINCIPAL: INFORMACIÓN DE LA CITA CON QR ===
    fecha_formateada = cita.fecha.strftime("%d de %B de %Y")
    hora_inicio = cita.hora_inicio or cita.fecha.strftime("%H:%M")
    hora_fin = cita.hora_fin or ""
    hora_display = f"{hora_inicio} - {hora_fin}" if hora_fin else hora_inicio
    
    # Color del estado
    estado_colors = {
        'programada': COLORS['primary'],
        'confirmada': COLORS['success'],
        'en_proceso': COLORS['warning'],
        'completada': COLORS['success'],
        'cancelada': COLORS['danger']
    }
    estado_bg_colors = {
        'programada': COLORS['bg_highlight'],
        'confirmada': COLORS['bg_success'],
        'en_proceso': COLORS['bg_warning'],
        'completada': COLORS['bg_success'],
        'cancelada': colors.HexColor('#fee2e2')
    }
    
    estado_color = estado_colors.get(cita.estado, COLORS['text_secondary'])
    estado_bg = estado_bg_colors.get(cita.estado, COLORS['light'])
    
    # Información de la cita (lado izquierdo)
    cita_info_content = [
        [Paragraph(f'<font size=18 color="{COLORS["primary"]}"><b>#{str(cita.id).zfill(5)}</b></font>', info_text_style)],
        [Paragraph(f'<font size=9 color="#9ca3af">CÓDIGO DE CITA</font>', info_text_style)],
        [Spacer(1, 0.15*inch)],
        [Paragraph(f'<font size=11 color="#1f2937"><b>📅 {fecha_formateada}</b></font>', info_text_style)],
        [Paragraph(f'<font size=11 color="#1f2937"><b>🕐 {hora_display}</b></font>', info_text_style)],
    ]
    
    if cita.sala_asignada:
        cita_info_content.append([Paragraph(f'<font size=10 color="#6b7280">🚪 Sala: <b>{cita.sala_asignada}</b></font>', info_text_style)])
    
    if cita.tipo_cita:
        tipo_display = cita.tipo_cita.replace('_', ' ').title()
        cita_info_content.append([Paragraph(f'<font size=10 color="#6b7280">📋 Tipo: <b>{tipo_display}</b></font>', info_text_style)])
    
    # Estado con badge
    estado_display = cita.estado.replace('_', ' ').upper()
    cita_info_content.append([Spacer(1, 0.1*inch)])
    cita_info_content.append([
        Paragraph(f'<font size=10><b>ESTADO: {estado_display}</b></font>', info_text_style)
    ])
    
    info_left_table = Table(cita_info_content, colWidths=[3.5*inch])
    info_left_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 2),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
        # Badge de estado
        ('BACKGROUND', (0, -1), (-1, -1), estado_bg),
        ('BOX', (0, -1), (-1, -1), 1.5, estado_color),
        ('LEFTPADDING', (0, -1), (-1, -1), 8),
        ('RIGHTPADDING', (0, -1), (-1, -1), 8),
        ('TOPPADDING', (0, -1), (-1, -1), 6),
        ('BOTTOMPADDING', (0, -1), (-1, -1), 6),
    ]))
    
    # QR con etiqueta (lado derecho)
    qr_content = [
        [qr_image],
        [Paragraph('<font size=8 color="#6b7280"><b>Escanear para verificar</b></font>', info_text_style)]
    ]
    
    qr_table = Table(qr_content, colWidths=[2.2*inch])
    qr_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]))
    
    # Combinar información y QR
    main_card = Table([[info_left_table, qr_table]], colWidths=[3.8*inch, 2.7*inch])
    main_card.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
        ('BOX', (0, 0), (-1, -1), 2.5, COLORS['primary']),
        ('LINEAFTER', (0, 0), (0, 0), 1, COLORS['border']),
        ('LEFTPADDING', (0, 0), (-1, -1), 20),
        ('RIGHTPADDING', (0, 0), (-1, -1), 20),
        ('TOPPADDING', (0, 0), (-1, -1), 20),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 20),
    ]))
    elements.append(main_card)
    elements.append(Spacer(1, 0.3*inch))
    
    # === SECCIÓN: DATOS DEL PACIENTE ===
    elements.append(Paragraph('👤 DATOS DEL PACIENTE', section_title_style))
    
    edad = calcular_edad(paciente.fecha_nacimiento) if paciente.fecha_nacimiento else 'No especificado'
    genero_icon = '♂️' if paciente.genero and paciente.genero.lower() == 'masculino' else '♀️' if paciente.genero else '⚥'
    
    paciente_data = [
        [
            Paragraph('<font size=9 color="#6b7280"><b>NOMBRE COMPLETO</b></font>', info_text_style),
            Paragraph(f'<font size=11 color="#1f2937"><b>{paciente.nombre} {paciente.apellido}</b></font>', info_text_style)
        ],
        [
            Paragraph('<font size=9 color="#6b7280"><b>DOCUMENTO DE IDENTIDAD</b></font>', info_text_style),
            Paragraph(f'<font size=10 color="#1f2937">{paciente.cedula}</font>', info_text_style)
        ],
        [
            Paragraph(f'<font size=9 color="#6b7280"><b>EDAD / GÉNERO {genero_icon}</b></font>', info_text_style),
            Paragraph(f'<font size=10 color="#1f2937">{edad} - {paciente.genero or "No especificado"}</font>', info_text_style)
        ],
        [
            Paragraph('<font size=9 color="#6b7280"><b>CONTACTO</b></font>', info_text_style),
            Paragraph(f'<font size=10 color="#1f2937">📞 {paciente.telefono or "No registrado"} | ✉️ {paciente.email or "No registrado"}</font>', info_text_style)
        ],
    ]
    
    paciente_table = Table(paciente_data, colWidths=[1.8*inch, 4.7*inch])
    paciente_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), COLORS['light']),
        ('BACKGROUND', (1, 0), (1, -1), colors.white),
        ('BOX', (0, 0), (-1, -1), 1.5, COLORS['border']),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, COLORS['border']),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 12),
        ('RIGHTPADDING', (0, 0), (-1, -1), 12),
        ('TOPPADDING', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
    ]))
    elements.append(paciente_table)
    elements.append(Spacer(1, 0.25*inch))
    
    # === SECCIÓN: DATOS DEL MÉDICO ===
    if medico:
        elements.append(Paragraph('👨‍⚕️ MÉDICO ASIGNADO', section_title_style))
        
        especialidad = ''
        if hasattr(medico, 'especialidad') and medico.especialidad:
            especialidad = f' - {medico.especialidad}'
        
        medico_data = [
            [
                Paragraph('<font size=9 color="#6b7280"><b>PROFESIONAL</b></font>', info_text_style),
                Paragraph(f'<font size=11 color="#1f2937"><b>Dr(a). {medico.nombre} {medico.apellido}</b>{especialidad}</font>', info_text_style)
            ]
        ]
        
        medico_table = Table(medico_data, colWidths=[1.8*inch, 4.7*inch])
        medico_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), COLORS['bg_highlight']),
            ('BACKGROUND', (1, 0), (1, -1), colors.white),
            ('BOX', (0, 0), (-1, -1), 1.5, COLORS['primary']),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('LEFTPADDING', (0, 0), (-1, -1), 12),
            ('RIGHTPADDING', (0, 0), (-1, -1), 12),
            ('TOPPADDING', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
        ]))
        elements.append(medico_table)
        elements.append(Spacer(1, 0.25*inch))
    
    # === SECCIÓN: MOTIVO DE LA CONSULTA ===
    if cita.motivo:
        elements.append(Paragraph('📝 MOTIVO DE LA CONSULTA', section_title_style))
        
        motivo_style_local = ParagraphStyle(
            'MotivoText',
            parent=styles['Normal'],
            fontSize=10,
            leading=15,
            textColor=COLORS['dark'],
            alignment=TA_JUSTIFY
        )
        
        motivo_paragraph = Paragraph(cita.motivo, motivo_style_local)
        motivo_table = Table([[motivo_paragraph]], colWidths=[6.5*inch])
        motivo_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#fffbeb')),
            ('BOX', (0, 0), (-1, -1), 1.5, COLORS['warning']),
            ('LEFTPADDING', (0, 0), (-1, -1), 15),
            ('RIGHTPADDING', (0, 0), (-1, -1), 15),
            ('TOPPADDING', (0, 0), (-1, -1), 12),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ]))
        elements.append(motivo_table)
        elements.append(Spacer(1, 0.25*inch))
    
    # === INSTRUCCIONES IMPORTANTES ===
    elements.append(Spacer(1, 0.3*inch))
    
    instrucciones_data = [
        [Paragraph('<font size=11 color="#2563eb"><b>📋 INSTRUCCIONES PARA SU VISITA</b></font>', instruction_style)],
        [Paragraph(
            '<font size=10 color="#1f2937">'
            '<b>✓</b> Llegar <b>15 minutos antes</b> de la hora programada<br/>'
            '<b>✓</b> Traer <b>documento de identidad</b> y carnet de seguro<br/>'
            '<b>✓</b> Presentar este <b>comprobante en recepción</b><br/>'
            '<b>✓</b> Para <b>cancelar o reprogramar</b>, contactar con <b>24 horas</b> de anticipación<br/>'
            '<b>✓</b> En caso de retraso mayor a 15 min, la cita puede ser <b>reprogramada</b>'
            '</font>',
            instruction_style
        )],
    ]
    
    instrucciones_table = Table(instrucciones_data, colWidths=[6.5*inch])
    instrucciones_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), COLORS['primary']),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#f0f9ff')),
        ('BOX', (0, 0), (-1, -1), 2, COLORS['primary']),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, COLORS['border']),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        ('ALIGN', (0, 1), (-1, -1), 'LEFT'),
        ('LEFTPADDING', (0, 0), (-1, -1), 15),
        ('RIGHTPADDING', (0, 0), (-1, -1), 15),
        ('TOPPADDING', (0, 0), (-1, -1), 12),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
    ]))
    elements.append(instrucciones_table)
    
    # === INFORMACIÓN DE CONTACTO Y PIE DE PÁGINA ===
    elements.append(Spacer(1, 0.3*inch))
    
    footer_contact_style = ParagraphStyle(
        'FooterContact',
        parent=styles['Normal'],
        fontSize=9,
        textColor=COLORS['text_secondary'],
        alignment=TA_CENTER,
        leading=13
    )
    
    contacto_para = Paragraph(
        '<font size=10><b>INFORMACIÓN DE CONTACTO</b></font><br/>'
        '📞 Teléfono: (02) 123-4567 | 📧 Email: info@hospital.com<br/>'
        '🌐 Web: www.hospitalsistema.com | 📍 Dirección: Av. Principal 123<br/>'
        '<font size=8 color="#9ca3af">─────────────────────────────────────────────</font><br/>'
        f'<font size=8>Documento generado automáticamente - {datetime.now().strftime("%d/%m/%Y %H:%M")}</font><br/>'
        '<font size=8>Sistema de Gestión Médica © 2025 - Todos los derechos reservados</font>',
        footer_contact_style
    )
    
    footer_table = Table([[contacto_para]], colWidths=[6.5*inch])
    footer_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#fafafa')),
        ('BOX', (0, 0), (-1, -1), 1, COLORS['border']),
        ('LEFTPADDING', (0, 0), (-1, -1), 15),
        ('RIGHTPADDING', (0, 0), (-1, -1), 15),
        ('TOPPADDING', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
    ]))
    elements.append(footer_table)
    
    # Construir PDF con canvas personalizado
    doc.build(elements, canvasmaker=NumberedCanvas)
    
    buffer.seek(0)
    return buffer
