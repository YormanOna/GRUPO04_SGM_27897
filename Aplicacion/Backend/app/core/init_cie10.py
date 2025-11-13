from sqlalchemy.orm import Session
from app.models.diagnostico_cie10 import DiagnosticoCIE10

# Diagnósticos CIE-10 más comunes por categoría
DIAGNOSTICOS_CIE10_COMUNES = [
    # Enfermedades infecciosas intestinales (A00-A09)
    {"codigo": "A09", "descripcion": "Diarrea y gastroenteritis de presunto origen infeccioso", "categoria": "Enfermedades infecciosas"},
    {"codigo": "A00.9", "descripcion": "Cólera no especificado", "categoria": "Enfermedades infecciosas"},
    
    # Tuberculosis (A15-A19)
    {"codigo": "A15.0", "descripcion": "Tuberculosis del pulmón, confirmada por hallazgo microscópico del bacilo tuberculoso", "categoria": "Tuberculosis"},
    {"codigo": "A16.9", "descripcion": "Tuberculosis respiratoria no especificada", "categoria": "Tuberculosis"},
    
    # Infecciones respiratorias (J00-J22)
    {"codigo": "J00", "descripcion": "Rinofaringitis aguda (resfriado común)", "categoria": "Enfermedades respiratorias"},
    {"codigo": "J02.9", "descripcion": "Faringitis aguda no especificada", "categoria": "Enfermedades respiratorias"},
    {"codigo": "J03.9", "descripcion": "Amigdalitis aguda no especificada", "categoria": "Enfermedades respiratorias"},
    {"codigo": "J06.9", "descripcion": "Infección aguda de las vías respiratorias superiores no especificada", "categoria": "Enfermedades respiratorias"},
    {"codigo": "J18.9", "descripcion": "Neumonía no especificada", "categoria": "Enfermedades respiratorias"},
    {"codigo": "J20.9", "descripcion": "Bronquitis aguda no especificada", "categoria": "Enfermedades respiratorias"},
    {"codigo": "J44.0", "descripcion": "Enfermedad pulmonar obstructiva crónica con infección aguda de las vías respiratorias inferiores", "categoria": "Enfermedades respiratorias"},
    {"codigo": "J45.9", "descripcion": "Asma no especificada", "categoria": "Enfermedades respiratorias"},
    
    # Enfermedades del sistema digestivo (K00-K93)
    {"codigo": "K29.7", "descripcion": "Gastritis no especificada", "categoria": "Enfermedades digestivas"},
    {"codigo": "K30", "descripcion": "Dispepsia funcional", "categoria": "Enfermedades digestivas"},
    {"codigo": "K21.9", "descripcion": "Enfermedad del reflujo gastroesofágico sin esofagitis", "categoria": "Enfermedades digestivas"},
    {"codigo": "K52.9", "descripcion": "Gastroenteritis y colitis no infecciosas no especificadas", "categoria": "Enfermedades digestivas"},
    {"codigo": "K80.2", "descripcion": "Colelitiasis de la vesícula biliar sin colecistitis", "categoria": "Enfermedades digestivas"},
    
    # Diabetes (E10-E14)
    {"codigo": "E11.9", "descripcion": "Diabetes mellitus tipo 2 sin complicaciones", "categoria": "Enfermedades endocrinas"},
    {"codigo": "E11.6", "descripcion": "Diabetes mellitus tipo 2 con otras complicaciones especificadas", "categoria": "Enfermedades endocrinas"},
    {"codigo": "E10.9", "descripcion": "Diabetes mellitus tipo 1 sin complicaciones", "categoria": "Enfermedades endocrinas"},
    
    # Hipertensión (I10-I15)
    {"codigo": "I10", "descripcion": "Hipertensión esencial (primaria)", "categoria": "Enfermedades cardiovasculares"},
    {"codigo": "I11.9", "descripcion": "Enfermedad cardíaca hipertensiva sin insuficiencia cardíaca (congestiva)", "categoria": "Enfermedades cardiovasculares"},
    
    # Enfermedades cardíacas (I20-I25)
    {"codigo": "I25.1", "descripcion": "Enfermedad aterosclerótica del corazón", "categoria": "Enfermedades cardiovasculares"},
    {"codigo": "I20.9", "descripcion": "Angina de pecho no especificada", "categoria": "Enfermedades cardiovasculares"},
    
    # Cefaleas (G43-G44)
    {"codigo": "G43.9", "descripcion": "Migraña no especificada", "categoria": "Enfermedades neurológicas"},
    {"codigo": "G44.2", "descripcion": "Cefalea tensional", "categoria": "Enfermedades neurológicas"},
    {"codigo": "R51", "descripcion": "Cefalea", "categoria": "Síntomas generales"},
    
    # Infecciones urinarias (N30-N39)
    {"codigo": "N39.0", "descripcion": "Infección de vías urinarias sitio no especificado", "categoria": "Enfermedades genitourinarias"},
    {"codigo": "N30.9", "descripcion": "Cistitis no especificada", "categoria": "Enfermedades genitourinarias"},
    
    # Embarazo y parto (O00-O99)
    {"codigo": "O80", "descripcion": "Parto único espontáneo", "categoria": "Embarazo y parto"},
    {"codigo": "O09.9", "descripcion": "Duración del embarazo no especificada", "categoria": "Embarazo y parto"},
    
    # Traumatismos (S00-T98)
    {"codigo": "S06.0", "descripcion": "Conmoción cerebral", "categoria": "Traumatismos"},
    {"codigo": "S52.5", "descripcion": "Fractura de la extremidad distal del radio", "categoria": "Traumatismos"},
    {"codigo": "S82.3", "descripcion": "Fractura de la extremidad distal de la tibia", "categoria": "Traumatismos"},
    
    # Síntomas generales (R50-R69)
    {"codigo": "R50.9", "descripcion": "Fiebre no especificada", "categoria": "Síntomas generales"},
    {"codigo": "R53", "descripcion": "Malestar y fatiga", "categoria": "Síntomas generales"},
    {"codigo": "R05", "descripcion": "Tos", "categoria": "Síntomas generales"},
    {"codigo": "R10.4", "descripcion": "Otros dolores abdominales y los no especificados", "categoria": "Síntomas generales"},
    {"codigo": "R52", "descripcion": "Dolor no clasificado en otra parte", "categoria": "Síntomas generales"},
    
    # Enfermedades de la piel (L00-L99)
    {"codigo": "L20.9", "descripcion": "Dermatitis atópica no especificada", "categoria": "Enfermedades de la piel"},
    {"codigo": "L30.9", "descripcion": "Dermatitis no especificada", "categoria": "Enfermedades de la piel"},
    
    # Anemia (D50-D64)
    {"codigo": "D50.9", "descripcion": "Anemia por deficiencia de hierro sin otra especificación", "categoria": "Enfermedades de la sangre"},
    {"codigo": "D64.9", "descripcion": "Anemia no especificada", "categoria": "Enfermedades de la sangre"},
    
    # Trastornos mentales (F30-F48)
    {"codigo": "F32.9", "descripcion": "Episodio depresivo no especificado", "categoria": "Trastornos mentales"},
    {"codigo": "F41.1", "descripcion": "Trastorno de ansiedad generalizada", "categoria": "Trastornos mentales"},
    {"codigo": "F41.9", "descripcion": "Trastorno de ansiedad no especificado", "categoria": "Trastornos mentales"},
    
    # Obesidad (E66)
    {"codigo": "E66.0", "descripcion": "Obesidad debida a exceso de calorías", "categoria": "Enfermedades endocrinas"},
    {"codigo": "E66.9", "descripcion": "Obesidad no especificada", "categoria": "Enfermedades endocrinas"},
    
    # COVID-19
    {"codigo": "U07.1", "descripcion": "COVID-19, virus identificado", "categoria": "Enfermedades infecciosas"},
    {"codigo": "U07.2", "descripcion": "COVID-19, virus no identificado", "categoria": "Enfermedades infecciosas"},
    
    # Conjuntivitis
    {"codigo": "H10.9", "descripcion": "Conjuntivitis no especificada", "categoria": "Enfermedades del ojo"},
    
    # Otitis
    {"codigo": "H66.9", "descripcion": "Otitis media no especificada", "categoria": "Enfermedades del oído"},
    
    # Lumbago
    {"codigo": "M54.5", "descripcion": "Dolor de espalda bajo (lumbago)", "categoria": "Enfermedades musculoesqueléticas"},
    {"codigo": "M54.9", "descripcion": "Dorsalgia no especificada", "categoria": "Enfermedades musculoesqueléticas"},
    
    # Artritis
    {"codigo": "M19.9", "descripcion": "Artrosis no especificada", "categoria": "Enfermedades musculoesqueléticas"},
]

def inicializar_diagnosticos_cie10(db: Session):
    """
    Inicializa la tabla de diagnósticos CIE-10 con códigos comunes
    """
    # Verificar si ya hay diagnósticos cargados
    count = db.query(DiagnosticoCIE10).count()
    if count > 0:
        print(f"✅ Ya existen {count} diagnósticos CIE-10 en la base de datos")
        return
    
    print("📋 Cargando diagnósticos CIE-10...")
    
    for diag_data in DIAGNOSTICOS_CIE10_COMUNES:
        diagnostico = DiagnosticoCIE10(**diag_data)
        db.add(diagnostico)
    
    db.commit()
    print(f"✅ Se cargaron {len(DIAGNOSTICOS_CIE10_COMUNES)} diagnósticos CIE-10")
