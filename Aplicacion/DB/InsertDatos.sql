-- ============================================================
-- SCRIPT DE INSERCIÓN DE DATOS - Sistema de Gestión Médica
-- Fecha: 8 de noviembre de 2025
-- Descripción: 15 registros simplificados por tabla
-- ============================================================

USE GestionMedicaDB;

-- Deshabilitar verificación de claves foráneas temporalmente
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- 1. EMPLEADOS (Base para todo el sistema)
-- NOTA: Los IDs 1-5 están reservados para usuarios por defecto de init_data.py
-- Estos empleados empiezan desde ID 6
-- Contraseñas por rol: medico123, farma123, enfer123, admin123, superadmin123
-- IMPORTANTE: Todos los empleados se crean con activo=1 (TRUE) y estado='Activo'
-- Estados posibles: 'Activo', 'Inactivo', 'Suspendido', 'Vacaciones', 'Licencia Médica'
-- ============================================================
INSERT INTO empleados (id, nombre, apellido, cedula, cargo, email, telefono, hashed_password, activo, estado) VALUES
(6, 'Carlos', 'Méndez', 1104567890, 'Medico', 'carlos.mendez@hospital.com', '0987654321', '$2b$12$hb1aqR72wQdly.7D9jb0WONsxVR0NWArvGe27XwixzhAKmTEPiMNK', 1, 'Activo'),
(7, 'María', 'González', 1104567891, 'Medico', 'maria.gonzalez@hospital.com', '0987654322', '$2b$12$hb1aqR72wQdly.7D9jb0WONsxVR0NWArvGe27XwixzhAKmTEPiMNK', 1, 'Activo'),
(8, 'Juan', 'Rodríguez', 1104567892, 'Medico', 'juan.rodriguez@hospital.com', '0987654323', '$2b$12$hb1aqR72wQdly.7D9jb0WONsxVR0NWArvGe27XwixzhAKmTEPiMNK', 1, 'Activo'),
(9, 'Ana', 'Pérez', 1104567893, 'Medico', 'ana.perez@hospital.com', '0987654324', '$2b$12$hb1aqR72wQdly.7D9jb0WONsxVR0NWArvGe27XwixzhAKmTEPiMNK', 1, 'Activo'),
(10, 'Luis', 'Torres', 1104567894, 'Medico', 'luis.torres@hospital.com', '0987654325', '$2b$12$hb1aqR72wQdly.7D9jb0WONsxVR0NWArvGe27XwixzhAKmTEPiMNK', 1, 'Activo'),
(11, 'Carmen', 'Sánchez', 1104567895, 'Farmaceutico', 'carmen.sanchez@hospital.com', '0987654326', '$2b$12$l0Tghebvd/2ZKvCsZsdCtOw4.NtInm9t9Njnu90oLP.xlxPViOcCG', 1, 'Activo'),
(12, 'Pedro', 'Ramírez', 1104567896, 'Farmaceutico', 'pedro.ramirez@hospital.com', '0987654327', '$2b$12$l0Tghebvd/2ZKvCsZsdCtOw4.NtInm9t9Njnu90oLP.xlxPViOcCG', 1, 'Activo'),
(13, 'Sofia', 'Jiménez', 1104567897, 'Enfermera', 'sofia.jimenez@hospital.com', '0987654328', '$2b$12$G3zveM.9aCCPFFpgemNpC.3PxN7p5mhFfpnydsZFuYyNRjL4Ygi6W', 1, 'Activo'),
(14, 'Miguel', 'Castro', 1104567898, 'Enfermera', 'miguel.castro@hospital.com', '0987654329', '$2b$12$G3zveM.9aCCPFFpgemNpC.3PxN7p5mhFfpnydsZFuYyNRjL4Ygi6W', 1, 'Activo'),
(15, 'Laura', 'Morales', 1104567899, 'Administrador', 'laura.morales@hospital.com', '0987654330', '$2b$12$mEykh6delmWCmseup4JQWe7RP95Tr3Vjiq7tt9ufOY977mrwUASkG', 1, 'Activo'),
(16, 'Diego', 'Vargas', 1104567900, 'Administrador', 'diego.vargas@hospital.com', '0987654331', '$2b$12$mEykh6delmWCmseup4JQWe7RP95Tr3Vjiq7tt9ufOY977mrwUASkG', 1, 'Activo'),
(17, 'Patricia', 'Herrera', 1104567901, 'Admin General', 'patricia.herrera@hospital.com', '0987654332', '$2b$12$w0Rhwcw7Nmd90ru9Ur4UO.CQp1TtdGDs5oYa9SMdnCJzT65LlSCfm', 1, 'Activo'),
(18, 'Roberto', 'Díaz', 1104567902, 'Medico', 'roberto.diaz@hospital.com', '0987654333', '$2b$12$hb1aqR72wQdly.7D9jb0WONsxVR0NWArvGe27XwixzhAKmTEPiMNK', 1, 'Activo'),
(19, 'Valeria', 'Ruiz', 1104567903, 'Medico', 'valeria.ruiz@hospital.com', '0987654334', '$2b$12$hb1aqR72wQdly.7D9jb0WONsxVR0NWArvGe27XwixzhAKmTEPiMNK', 1, 'Activo'),
(20, 'Fernando', 'Ortiz', 1104567904, 'Medico', 'fernando.ortiz@hospital.com', '0987654335', '$2b$12$hb1aqR72wQdly.7D9jb0WONsxVR0NWArvGe27XwixzhAKmTEPiMNK', 1, 'Activo');

-- ============================================================
-- 2. MÉDICOS (Extensión de empleados)
-- NOTA: empleado_id 3 es el médico por defecto (medico@hospital.com)
-- Los médicos de ejemplo referencian empleados ID 6-10 y 18-20
-- IMPORTANTE: Todos los médicos se crean con activo=1 (TRUE)
-- ============================================================
INSERT INTO medicos (nombre, apellido, cedula, especialidad, email, empleado_id, activo) VALUES
('Carlos', 'Méndez', 1104567890, 'Cardiología', 'carlos.mendez@hospital.com', 6, 1),
('María', 'González', 1104567891, 'Pediatría', 'maria.gonzalez@hospital.com', 7, 1),
('Juan', 'Rodríguez', 1104567892, 'Medicina General', 'juan.rodriguez@hospital.com', 8, 1),
('Ana', 'Pérez', 1104567893, 'Ginecología', 'ana.perez@hospital.com', 9, 1),
('Luis', 'Torres', 1104567894, 'Traumatología', 'luis.torres@hospital.com', 10, 1),
('Roberto', 'Díaz', 1104567902, 'Dermatología', 'roberto.diaz@hospital.com', 18, 1),
('Valeria', 'Ruiz', 1104567903, 'Oftalmología', 'valeria.ruiz@hospital.com', 19, 1),
('Fernando', 'Ortiz', 1104567904, 'Neurología', 'fernando.ortiz@hospital.com', 20, 1);

-- ============================================================
-- 3. PACIENTES
-- IMPORTANTE: Todos los pacientes se crean con activo=1 (TRUE)
-- ============================================================
INSERT INTO pacientes (nombre, apellido, cedula, email, telefono, direccion, fecha_nacimiento, genero, grupo_sanguineo, contacto_emergencia_nombre, contacto_emergencia_telefono, activo) VALUES
('Andrea', 'López', 1105678901, 'andrea.lopez@email.com', '0998765431', 'Calle Lourdes 234', '1995-04-12', 'Femenino', 'O+', 'María López', '0998765432', 1),
('Ricardo', 'Martínez', 1105678902, 'ricardo.martinez@email.com', '0998765433', 'Av. Nueva Loja 567', '1980-08-23', 'Masculino', 'A+', 'Lucía Martínez', '0998765434', 1),
('Gabriela', 'Fernández', 1105678903, 'gabriela.fernandez@email.com', '0998765435', 'Calle Olmedo 890', '1992-11-30', 'Femenino', 'B+', 'Pedro Fernández', '0998765436', 1),
('Jorge', 'Silva', 1105678904, 'jorge.silva@email.com', '0998765437', 'Av. Salvador Bustamante', '1975-02-14', 'Masculino', 'AB+', 'Rosa Silva', '0998765438', 1),
('Daniela', 'Mora', 1105678905, 'daniela.mora@email.com', '0998765439', 'Calle Azuay 123', '1998-06-18', 'Femenino', 'O-', 'Carlos Mora', '0998765440', 1),
('Andrés', 'Vega', 1105678906, 'andres.vega@email.com', '0998765441', 'Av. Isidro Ayora', '1988-09-07', 'Masculino', 'A-', 'Marta Vega', '0998765442', 1),
('Isabella', 'Romero', 1105678907, 'isabella.romero@email.com', '0998765443', 'Calle Imbabura 456', '2005-12-25', 'Femenino', 'B-', 'Sandra Romero', '0998765444', 1),
('Sebastián', 'Guerrero', 1105678908, 'sebastian.guerrero@email.com', '0998765445', 'Av. Eduardo Kingman', '1983-03-15', 'Masculino', 'O+', 'Paola Guerrero', '0998765446', 1),
('Camila', 'Paredes', 1105678909, 'camila.paredes@email.com', '0998765447', 'Calle José Félix', '1996-07-22', 'Femenino', 'A+', 'Luis Paredes', '0998765448', 1),
('Mateo', 'Cruz', 1105678910, 'mateo.cruz@email.com', '0998765449', 'Av. Emiliano Ortega', '2010-01-10', 'Masculino', 'AB-', 'Elena Cruz', '0998765450', 1),
('Valentina', 'Mendoza', 1105678911, 'valentina.mendoza@email.com', '0998765451', 'Calle Quito 789', '1990-05-05', 'Femenino', 'O+', 'Javier Mendoza', '0998765452', 1),
('Nicolás', 'Reyes', 1105678912, 'nicolas.reyes@email.com', '0998765453', 'Av. 8 de Diciembre', '1978-10-18', 'Masculino', 'B+', 'Carmen Reyes', '0998765454', 1),
('Sofía', 'Aguilar', 1105678913, 'sofia.aguilar@email.com', '0998765455', 'Calle Gonzanamá 321', '2000-08-29', 'Femenino', 'A-', 'Roberto Aguilar', '0998765456', 1),
('Lucas', 'Benítez', 1105678914, 'lucas.benitez@email.com', '0998765457', 'Av. Universitaria 654', '1985-12-12', 'Masculino', 'O-', 'Ana Benítez', '0998765458', 1),
('Emma', 'Castro', 1105678915, 'emma.castro@email.com', '0998765459', 'Calle Bernardo Valdivieso', '1993-04-03', 'Femenino', 'AB+', 'Miguel Castro', '0998765460', 1);

-- ============================================================
-- 4. HISTORIAS CLÍNICAS
-- ============================================================
INSERT INTO historias (identificador) VALUES
('HC-2025-001'), ('HC-2025-002'), ('HC-2025-003'), ('HC-2025-004'), ('HC-2025-005'),
('HC-2025-006'), ('HC-2025-007'), ('HC-2025-008'), ('HC-2025-009'), ('HC-2025-010'),
('HC-2025-011'), ('HC-2025-012'), ('HC-2025-013'), ('HC-2025-014'), ('HC-2025-015');

-- Vincular historias con pacientes
UPDATE pacientes SET historia_id = 1 WHERE id = 1;
UPDATE pacientes SET historia_id = 2 WHERE id = 2;
UPDATE pacientes SET historia_id = 3 WHERE id = 3;
UPDATE pacientes SET historia_id = 4 WHERE id = 4;
UPDATE pacientes SET historia_id = 5 WHERE id = 5;
UPDATE pacientes SET historia_id = 6 WHERE id = 6;
UPDATE pacientes SET historia_id = 7 WHERE id = 7;
UPDATE pacientes SET historia_id = 8 WHERE id = 8;
UPDATE pacientes SET historia_id = 9 WHERE id = 9;
UPDATE pacientes SET historia_id = 10 WHERE id = 10;
UPDATE pacientes SET historia_id = 11 WHERE id = 11;
UPDATE pacientes SET historia_id = 12 WHERE id = 12;
UPDATE pacientes SET historia_id = 13 WHERE id = 13;
UPDATE pacientes SET historia_id = 14 WHERE id = 14;
UPDATE pacientes SET historia_id = 15 WHERE id = 15;

-- ============================================================
-- 5. CITAS (Columnas: fecha, hora_inicio, hora_fin, motivo, estado, tipo_cita, paciente_id, medico_id, encargado_id)
-- NOTA: medico_id 1 es el médico por defecto, medico_id 2-9 son los de ejemplo
-- encargado_id 15,16 son los administradores (Laura y Diego)
-- ============================================================
INSERT INTO citas (paciente_id, medico_id, encargado_id, fecha, hora_inicio, hora_fin, motivo, estado, tipo_cita) VALUES
(1, 2, 15, '2025-11-10 09:00:00', '09:00', '09:30', 'Control cardiológico', 'programada', 'consulta'),
(2, 3, 15, '2025-11-10 10:00:00', '10:00', '10:30', 'Control pediátrico', 'programada', 'seguimiento'),
(3, 4, 16, '2025-11-08 08:00:00', '08:00', '08:30', 'Malestar general', 'completada', 'consulta'),
(4, 5, 15, '2025-11-09 14:00:00', '14:00', '14:30', 'Control ginecológico', 'completada', 'seguimiento'),
(5, 6, 16, '2025-11-08 11:00:00', '11:00', '11:30', 'Dolor en rodilla', 'completada', 'consulta'),
(6, 2, 15, '2025-11-07 15:00:00', '15:00', '15:30', 'Dolor precordial', 'completada', 'emergencia'),
(7, 3, 16, '2025-11-11 09:00:00', '09:00', '09:30', 'Vacunación', 'programada', 'seguimiento'),
(8, 4, 15, '2025-11-06 10:00:00', '10:00', '10:30', 'Dolor abdominal', 'completada', 'consulta'),
(9, 7, 15, '2025-11-12 11:00:00', '11:00', '11:30', 'Consulta dermatológica', 'programada', 'consulta'),
(10, 3, 16, '2025-11-13 08:30:00', '08:30', '09:00', 'Control crecimiento', 'programada', 'seguimiento'),
(11, 5, 15, '2025-11-05 13:00:00', '13:00', '13:30', 'Control prenatal', 'completada', 'seguimiento'),
(12, 9, 16, '2025-11-14 10:00:00', '10:00', '10:30', 'Cefalea intensa', 'programada', 'consulta'),
(13, 8, 15, '2025-11-15 09:00:00', '09:00', '09:30', 'Revisión de vista', 'programada', 'consulta'),
(14, 4, 16, '2025-11-04 16:00:00', '16:00', '16:30', 'Malestar y fiebre', 'completada', 'consulta'),
(15, 2, 15, '2025-11-16 14:00:00', '14:00', '14:30', 'Palpitaciones', 'programada', 'consulta');

-- ============================================================
-- 6. CONSULTAS
-- NOTA: medico_id ahora corresponde a la tabla médicos corregida
-- ============================================================
INSERT INTO consultas (cita_id, historia_id, paciente_id, medico_id, motivo_consulta, diagnostico, diagnostico_codigo, tratamiento, observaciones, signos_vitales, fecha_consulta) VALUES
(3, 3, 3, 4, 'Malestar general, cefalea', 'Resfriado común', 'J00', 'Paracetamol 500mg c/8h, reposo', 'Cuadro viral leve', '{"presion_arterial": "110/70", "temperatura": 37.8}', '2025-11-08 08:30:00'),
(4, 4, 4, 5, 'Control ginecológico', 'Examen ginecológico normal', 'Z01.4', 'Controles anuales', 'Normal', '{"presion_arterial": "115/75", "temperatura": 36.5}', '2025-11-09 14:30:00'),
(5, 5, 5, 6, 'Dolor en rodilla', 'Dolor articular', 'M25.5', 'Naproxeno 550mg c/12h', 'Posible tendinitis', '{"presion_arterial": "120/80", "temperatura": 36.6}', '2025-11-08 11:30:00'),
(6, 6, 6, 2, 'Dolor precordial', 'Dolor precordial inespecífico', 'R07.2', 'Omeprazol 20mg c/12h', 'Descartar cardíaco', '{"presion_arterial": "140/90", "temperatura": 36.7}', '2025-11-07 15:30:00'),
(8, 8, 8, 4, 'Dolor abdominal', 'Gastritis aguda', 'K29.7', 'Omeprazol 40mg, dieta blanda', 'Gastritis aguda', '{"presion_arterial": "125/82", "temperatura": 36.8}', '2025-11-06 10:30:00'),
(11, 11, 11, 5, 'Control prenatal', 'Embarazo normal', 'Z34.0', 'Ácido fólico, hierro', '20 semanas', '{"presion_arterial": "110/65"}', '2025-11-05 13:30:00'),
(14, 14, 14, 4, 'Malestar y fiebre', 'Infección respiratoria aguda', 'J06.9', 'Amoxicilina 500mg c/8h x 7d', 'Faringitis', '{"presion_arterial": "118/76", "temperatura": 38.5}', '2025-11-04 16:30:00');

-- ============================================================
-- 7. FARMACIAS
-- NOTA: farmaceutico_id 11,12 son Carmen Sánchez y Pedro Ramírez
-- ============================================================
INSERT INTO farmacias (nombre_farmacia, direccion, telefono, farmaceutico_id) VALUES
('Farmacia Central Hospital', 'Edificio Principal Planta Baja', '072540100', 11),
('Farmacia Emergencias', 'Ala de Emergencias', '072540101', 12);

-- ============================================================
-- 8. MEDICAMENTOS
-- IMPORTANTE: Todos los medicamentos se crean con activo=1 (TRUE)
-- ============================================================
INSERT INTO medicamentos (nombre, principio_activo, concentracion, forma_farmaceutica, stock, farmacia_id, codigo_interno, nombre_comercial, categoria_terapeutica, indicaciones, dosis_recomendada, contraindicaciones, efectos_secundarios, contenido, activo) VALUES
('Paracetamol', 'Paracetamol', '500mg', 'Tableta', 500, 1, 'MED-001', 'Panadol', 'Analgésico', 'Dolor y fiebre', '500mg cada 6-8h', 'Hepatopatía severa', 'Náuseas, hepatotoxicidad', '20 tabletas', 1),
('Ibuprofeno', 'Ibuprofeno', '400mg', 'Tableta', 450, 1, 'MED-002', 'Advil', 'AINE', 'Dolor e inflamación', '400mg cada 8h', 'Úlcera péptica', 'Gastritis, mareo', '30 tabletas', 1),
('Amoxicilina', 'Amoxicilina', '500mg', 'Cápsula', 300, 1, 'MED-003', 'Amoxil', 'Antibiótico', 'Infecciones bacterianas', '500mg cada 8h', 'Alergia penicilinas', 'Diarrea, exantema', '21 cápsulas', 1),
('Omeprazol', 'Omeprazol', '20mg', 'Cápsula', 400, 1, 'MED-004', 'Losec', 'Inhibidor bomba protones', 'Reflujo, gastritis', '20mg cada 12-24h', 'Hipersensibilidad', 'Cefalea, diarrea', '14 cápsulas', 1),
('Losartán', 'Losartán', '50mg', 'Tableta', 350, 1, 'MED-005', 'Cozaar', 'Antihipertensivo', 'Hipertensión arterial', '50mg cada 24h', 'Embarazo', 'Mareo, hipotensión', '30 tabletas', 1),
('Metformina', 'Metformina', '850mg', 'Tableta', 280, 1, 'MED-006', 'Glucophage', 'Antidiabético', 'Diabetes tipo 2', '850mg cada 12h', 'Acidosis metabólica', 'Diarrea, náuseas', '60 tabletas', 1),
('Atorvastatina', 'Atorvastatina', '20mg', 'Tableta', 320, 1, 'MED-007', 'Lipitor', 'Hipolipemiante', 'Colesterol alto', '20mg cada 24h', 'Hepatopatía activa', 'Mialgia, cefalea', '30 tabletas', 1),
('Salbutamol', 'Salbutamol', '100mcg', 'Inhalador', 150, 1, 'MED-008', 'Ventolin', 'Broncodilatador', 'Asma, broncoespasmo', '2 puff cada 4-6h', 'Taquiarritmias', 'Temblor, taquicardia', '200 dosis', 1),
('Diclofenaco', 'Diclofenaco', '75mg', 'Ampolla', 200, 2, 'MED-009', 'Voltaren', 'AINE', 'Dolor moderado-severo', '75mg IM cada 12h', 'Úlcera activa', 'Gastritis, mareo', '3 ampollas', 1),
('Ranitidina', 'Ranitidina', '150mg', 'Tableta', 380, 1, 'MED-010', 'Zantac', 'Anti-H2', 'Acidez, úlcera', '150mg cada 12h', 'Hipersensibilidad', 'Cefalea, estreñimiento', '20 tabletas', 1),
('Cetirizina', 'Cetirizina', '10mg', 'Tableta', 420, 1, 'MED-011', 'Zyrtec', 'Antihistamínico', 'Alergias', '10mg cada 24h', 'Hipersensibilidad', 'Somnolencia', '10 tabletas', 1),
('Azitromicina', 'Azitromicina', '500mg', 'Tableta', 180, 1, 'MED-012', 'Zithromax', 'Antibiótico', 'Infecciones respiratorias', '500mg cada 24h x 3d', 'Alergia macrólidos', 'Diarrea, náuseas', '3 tabletas', 1),
('Clonazepam', 'Clonazepam', '2mg', 'Tableta', 250, 1, 'MED-013', 'Rivotril', 'Benzodiacepina', 'Ansiedad, convulsiones', '0.5-2mg cada 12h', 'Miastenia gravis', 'Somnolencia, ataxia', '30 tabletas', 1),
('Furosemida', 'Furosemida', '40mg', 'Tableta', 310, 1, 'MED-014', 'Lasix', 'Diurético', 'Edema, hipertensión', '40mg cada 12-24h', 'Anuria', 'Hipopotasemia', '20 tabletas', 1),
('Tramadol', 'Tramadol', '50mg', 'Cápsula', 220, 2, 'MED-015', 'Tramal', 'Analgésico opioide', 'Dolor moderado-severo', '50-100mg cada 6-8h', 'Epilepsia no controlada', 'Náuseas, mareo', '20 cápsulas', 1);

-- ============================================================
-- 9. LOTES (Columnas: medicamento_id, numero_lote, fecha_ingreso, fecha_vencimiento, cantidad_inicial, cantidad_disponible, estado, proveedor)
-- ============================================================
INSERT INTO lotes (medicamento_id, numero_lote, fecha_ingreso, fecha_vencimiento, cantidad_inicial, cantidad_disponible, estado, proveedor) VALUES
(1, 'LOTE-PAR-2024-001', '2024-01-15', '2026-01-15', 1000, 500, 'disponible', 'Laboratorios XYZ'),
(2, 'LOTE-IBU-2024-002', '2024-02-20', '2025-12-20', 800, 450, 'disponible', 'Pharma Global'),
(3, 'LOTE-AMO-2024-003', '2024-03-10', '2025-11-10', 600, 300, 'proximo_a_vencer', 'BioMed S.A.'),
(4, 'LOTE-OME-2024-004', '2024-01-25', '2026-01-25', 1000, 400, 'disponible', 'HealthCorp'),
(5, 'LOTE-LOS-2024-005', '2024-04-05', '2026-04-05', 700, 350, 'disponible', 'CardioPharm'),
(6, 'LOTE-MET-2024-006', '2024-02-15', '2025-12-15', 600, 280, 'disponible', 'DiabetCare'),
(7, 'LOTE-ATO-2024-007', '2024-03-20', '2026-03-20', 800, 320, 'disponible', 'CardioPharm'),
(8, 'LOTE-SAL-2024-008', '2024-01-30', '2025-11-30', 300, 150, 'disponible', 'RespiMed'),
(9, 'LOTE-DIC-2024-009', '2024-04-12', '2025-10-12', 400, 200, 'vencido', 'PainRelief Co.'),
(10, 'LOTE-RAN-2024-010', '2024-02-28', '2026-02-28', 900, 380, 'disponible', 'GastroHealth'),
(11, 'LOTE-CET-2024-011', '2024-03-15', '2026-09-15', 1000, 420, 'disponible', 'AllergyFree'),
(12, 'LOTE-AZI-2024-012', '2024-04-20', '2025-10-20', 400, 180, 'vencido', 'BioMed S.A.'),
(13, 'LOTE-CLO-2024-013', '2024-01-10', '2026-01-10', 500, 250, 'disponible', 'NeuroPharma'),
(14, 'LOTE-FUR-2024-014', '2024-02-05', '2025-12-05', 700, 310, 'disponible', 'RenalCare'),
(15, 'LOTE-TRA-2024-015', '2024-03-25', '2025-09-25', 500, 220, 'vencido', 'PainRelief Co.');

-- ============================================================
-- 10. RECETAS (Para consultas que requieren medicación)
-- NOTA: medico_id corregido, dispensada_por son empleado_id 11,12 (farmacéuticos)
-- ============================================================
INSERT INTO recetas (consulta_id, paciente_id, medico_id, fecha_emision, fecha_vencimiento, indicaciones, observaciones, estado, dispensada_por, fecha_dispensacion, lote_id) VALUES
(1, 3, 4, '2025-11-08 08:30:00', '2025-11-15 23:59:59', 'Paracetamol 500mg cada 8 horas por 5 días', 'Tomar con alimentos', 'dispensada', 11, '2025-11-08 14:00:00', 1),
(3, 5, 6, '2025-11-08 11:30:00', '2025-11-22 23:59:59', 'Ibuprofeno 400mg cada 8h por 7 días + Omeprazol 20mg cada 12h', 'Protección gástrica', 'dispensada', 11, '2025-11-08 15:30:00', 2),
(5, 8, 4, '2025-11-06 10:45:00', '2025-11-20 23:59:59', 'Omeprazol 40mg cada 12h por 14 días', 'Tomar antes de comidas', 'dispensada', 12, '2025-11-06 16:00:00', 4),
(6, 11, 5, '2025-11-05 13:45:00', '2025-12-05 23:59:59', 'Ácido fólico 1mg/día + Sulfato ferroso 300mg/día', 'Durante todo el embarazo', 'dispensada', 11, '2025-11-05 17:00:00', NULL),
(7, 14, 4, '2025-11-04 16:30:00', '2025-11-18 23:59:59', 'Amoxicilina 500mg cada 8h por 7 días', 'Completar tratamiento', 'dispensada', 11, '2025-11-04 18:00:00', 3),
(2, 4, 5, '2025-11-09 14:30:00', '2025-11-23 23:59:59', 'Control sin medicación', 'Solo controles periódicos', 'emitida', NULL, NULL, NULL),
(4, 6, 2, '2025-11-07 15:30:00', '2025-11-21 23:59:59', 'Omeprazol 20mg cada 12h por 10 días', 'Evitar comidas irritantes', 'pendiente', NULL, NULL, NULL);

-- ============================================================
-- 11. ASISTENCIAS (Registro de entrada/salida empleados)
-- NOTA: empleado_id ahora corresponde a los IDs correctos (6-20)
-- ============================================================
INSERT INTO asistencias (empleado_id, fecha_entrada, fecha_salida, tipo_registro, observaciones) VALUES
(6, '2025-11-08 07:30:00', '2025-11-08 16:00:00', 'completo', 'Turno normal'),
(7, '2025-11-08 07:45:00', '2025-11-08 16:15:00', 'completo', 'Turno normal'),
(8, '2025-11-08 08:00:00', '2025-11-08 17:00:00', 'completo', 'Turno normal'),
(9, '2025-11-08 07:30:00', '2025-11-08 16:30:00', 'completo', 'Turno normal'),
(10, '2025-11-08 08:00:00', '2025-11-08 16:00:00', 'completo', 'Turno normal'),
(11, '2025-11-08 08:30:00', '2025-11-08 17:00:00', 'completo', 'Turno farmacia'),
(12, '2025-11-08 14:00:00', '2025-11-08 22:00:00', 'completo', 'Turno tarde'),
(13, '2025-11-08 07:00:00', '2025-11-08 15:00:00', 'completo', 'Turno mañana'),
(14, '2025-11-08 15:00:00', '2025-11-08 23:00:00', 'completo', 'Turno tarde'),
(15, '2025-11-08 08:00:00', '2025-11-08 17:00:00', 'completo', 'Turno administrativo'),
(16, '2025-11-08 08:00:00', '2025-11-08 17:00:00', 'completo', 'Turno administrativo'),
(6, '2025-11-07 07:30:00', '2025-11-07 16:00:00', 'completo', 'Turno normal'),
(7, '2025-11-07 07:45:00', '2025-11-07 16:15:00', 'completo', 'Turno normal'),
(11, '2025-11-07 08:30:00', '2025-11-07 17:00:00', 'completo', 'Turno farmacia'),
(13, '2025-11-07 07:00:00', '2025-11-07 15:00:00', 'completo', 'Turno mañana');

-- ============================================================
-- 12. AUDITORÍA (Tabla: auditoria - Columnas: usuario_id, accion, modulo, descripcion, tabla_afectada, registro_id, datos_anteriores, datos_nuevos, ip_address, user_agent, estado)
-- NOTA: usuario_id ahora usa los IDs correctos de empleados (15-20 para admins, 6-14 para otros)
-- ============================================================
INSERT INTO auditoria (usuario_id, accion, modulo, descripcion, tabla_afectada, registro_id, datos_anteriores, datos_nuevos, ip_address, user_agent, estado) VALUES
(17, 'CREATE', 'Pacientes', 'Creación de paciente Andrea López', 'pacientes', 1, NULL, '{"nombre": "Andrea", "apellido": "López"}', '192.168.1.100', 'Mozilla/5.0', 'exitoso'),
(17, 'CREATE', 'Pacientes', 'Creación de paciente Ricardo Martínez', 'pacientes', 2, NULL, '{"nombre": "Ricardo", "apellido": "Martínez"}', '192.168.1.100', 'Mozilla/5.0', 'exitoso'),
(15, 'CREATE', 'Citas', 'Agendamiento de cita cardiológica', 'citas', 1, NULL, '{"paciente_id": 1, "medico_id": 2, "fecha": "2025-11-10"}', '192.168.1.101', 'Mozilla/5.0', 'exitoso'),
(15, 'CREATE', 'Citas', 'Agendamiento de cita pediátrica', 'citas', 2, NULL, '{"paciente_id": 2, "medico_id": 3, "fecha": "2025-11-10"}', '192.168.1.101', 'Mozilla/5.0', 'exitoso'),
(6, 'CREATE', 'Consultas', 'Registro de consulta por resfriado común', 'consultas', 1, NULL, '{"paciente_id": 3, "diagnostico": "Resfriado común"}', '192.168.1.102', 'Mozilla/5.0', 'exitoso'),
(8, 'CREATE', 'Consultas', 'Registro de examen ginecológico', 'consultas', 2, NULL, '{"paciente_id": 4, "diagnostico": "Examen ginecológico"}', '192.168.1.103', 'Mozilla/5.0', 'exitoso'),
(11, 'CREATE', 'Recetas', 'Emisión de receta médica', 'recetas', 1, NULL, '{"consulta_id": 1, "paciente_id": 3}', '192.168.1.104', 'Mozilla/5.0', 'exitoso'),
(11, 'UPDATE', 'Recetas', 'Dispensación de receta en farmacia', 'recetas', 1, '{"estado": "emitida"}', '{"estado": "dispensada"}', '192.168.1.104', 'Mozilla/5.0', 'exitoso'),
(15, 'UPDATE', 'Citas', 'Cambio de estado de cita a completada', 'citas', 3, '{"estado": "programada"}', '{"estado": "completada"}', '192.168.1.101', 'Mozilla/5.0', 'exitoso'),
(16, 'CREATE', 'Citas', 'Agendamiento de cita para vacunación', 'citas', 7, NULL, '{"paciente_id": 7, "medico_id": 3, "fecha": "2025-11-11"}', '192.168.1.105', 'Mozilla/5.0', 'exitoso'),
(17, 'CREATE', 'Empleados', 'Registro de nuevo médico Roberto Díaz', 'empleados', 18, NULL, '{"nombre": "Roberto", "cargo": "Medico"}', '192.168.1.100', 'Mozilla/5.0', 'exitoso'),
(17, 'CREATE', 'Médicos', 'Registro de especialidad dermatología', 'medicos', 7, NULL, '{"empleado_id": 18, "especialidad": "Dermatología"}', '192.168.1.100', 'Mozilla/5.0', 'exitoso'),
(11, 'CREATE', 'Medicamentos', 'Ingreso de medicamento Paracetamol', 'medicamentos', 1, NULL, '{"nombre": "Paracetamol", "stock": 500}', '192.168.1.104', 'Mozilla/5.0', 'exitoso'),
(12, 'UPDATE', 'Medicamentos', 'Actualización de stock por dispensación', 'medicamentos', 1, '{"stock": 500}', '{"stock": 480}', '192.168.1.106', 'Mozilla/5.0', 'exitoso'),
(6, 'CREATE', 'Historias', 'Creación de historia clínica', 'historias', 1, NULL, '{"identificador": "HC-2025-001"}', '192.168.1.102', 'Mozilla/5.0', 'exitoso');

-- Habilitar verificación de claves foráneas
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- CONSULTAS DE VERIFICACIÓN
-- ============================================================
SELECT 'empleados' as tabla, COUNT(*) as total FROM empleados
UNION ALL SELECT 'medicos', COUNT(*) FROM medicos
UNION ALL SELECT 'pacientes', COUNT(*) FROM pacientes
UNION ALL SELECT 'historias', COUNT(*) FROM historias
UNION ALL SELECT 'citas', COUNT(*) FROM citas
UNION ALL SELECT 'consultas', COUNT(*) FROM consultas
UNION ALL SELECT 'farmacias', COUNT(*) FROM farmacias
UNION ALL SELECT 'medicamentos', COUNT(*) FROM medicamentos
UNION ALL SELECT 'lotes', COUNT(*) FROM lotes
UNION ALL SELECT 'recetas', COUNT(*) FROM recetas
UNION ALL SELECT 'asistencias', COUNT(*) FROM asistencias
UNION ALL SELECT 'auditoria', COUNT(*) FROM auditoria;
