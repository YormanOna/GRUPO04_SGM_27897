# Usuarios Por Defecto

Este documento lista todos los usuarios que se crean automáticamente al iniciar el sistema por primera vez.

## Usuarios del Sistema Base

Estos usuarios se crean desde `app/core/init_data.py`:

### Super Administrador
- **Email:** superadmin@hospital.com
- **Contraseña:** superadmin123
- **Cédula:** 1111111111
- **Cargo:** Admin General

### Administrador
- **Email:** admin@hospital.com
- **Contraseña:** admin123
- **Cédula:** 1234567890
- **Cargo:** Administrador

### Médico Principal
- **Email:** medico@hospital.com
- **Contraseña:** medico123
- **Cédula:** 9876543210
- **Cargo:** Medico
- **Especialidad:** Medicina General

### Enfermera Jefe
- **Email:** enfermera@hospital.com
- **Contraseña:** enfer123
- **Cédula:** 5555555555
- **Cargo:** Enfermera

### Farmacéutico Principal
- **Email:** farmacia@hospital.com
- **Contraseña:** farma123
- **Cédula:** 7777777777
- **Cargo:** Farmaceutico

---

## Usuarios de Datos de Ejemplo

Estos usuarios corresponden a los datos de `DB/InsertDatos.sql`:

### Médicos (password: medico123)
1. **Carlos Méndez** - carlos.mendez@hospital.com (Cédula: 1104567890)
2. **María González** - maria.gonzalez@hospital.com (Cédula: 1104567891)
3. **Juan Rodríguez** - juan.rodriguez@hospital.com (Cédula: 1104567892)
4. **Ana Pérez** - ana.perez@hospital.com (Cédula: 1104567893)
5. **Luis Torres** - luis.torres@hospital.com (Cédula: 1104567894)
6. **Roberto Díaz** - roberto.diaz@hospital.com (Cédula: 1104567902)
7. **Valeria Ruiz** - valeria.ruiz@hospital.com (Cédula: 1104567903)
8. **Fernando Ortiz** - fernando.ortiz@hospital.com (Cédula: 1104567904)

### Farmacéuticos (password: farma123)
1. **Carmen Sánchez** - carmen.sanchez@hospital.com (Cédula: 1104567895)
2. **Pedro Ramírez** - pedro.ramirez@hospital.com (Cédula: 1104567896)

### Enfermeras (password: enfer123)
1. **Sofía Jiménez** - sofia.jimenez@hospital.com (Cédula: 1104567897)
2. **Miguel Castro** - miguel.castro@hospital.com (Cédula: 1104567898)

### Administradores (password: admin123)
1. **Laura Morales** - laura.morales@hospital.com (Cédula: 1104567899)
2. **Diego Vargas** - diego.vargas@hospital.com (Cédula: 1104567900)

### Super Admin (password: superadmin123)
1. **Patricia Herrera** - patricia.herrera@hospital.com (Cédula: 1104567901)

---

## Notas Importantes

1. **Creación automática**: Todos estos usuarios se crean automáticamente la primera vez que se ejecuta el backend.
2. **Sin duplicados**: Si los usuarios ya existen en la base de datos, no se crean duplicados.
3. **Seguridad**: Las contraseñas están hasheadas en la base de datos usando bcrypt.
4. **Producción**: Se recomienda cambiar estas contraseñas en un entorno de producción.
5. **Consistencia**: Los datos de ejemplo ahora están alineados con `init_data.py`, por lo que puedes usar cualquiera de estos usuarios para iniciar sesión.

## Uso Rápido

Para probar diferentes roles, puedes usar:
- **Médico**: `medico@hospital.com` / `medico123` o cualquier médico de la lista
- **Enfermera**: `enfermera@hospital.com` / `enfer123`
- **Farmacia**: `farmacia@hospital.com` / `farma123`
- **Admin**: `admin@hospital.com` / `admin123`
- **Super Admin**: `superadmin@hospital.com` / `superadmin123`

## 🚀 Acceso a la API

Una vez iniciado el servidor, puedes acceder a:
- **Documentación Swagger:** http://127.0.0.1:8000/docs
- **Documentación ReDoc:** http://127.0.0.1:8000/redoc
- **Endpoint raíz:** http://127.0.0.1:8000/

## 🔐 Autenticación

Para autenticarte, usa el endpoint:
```
POST /auth/login
```

Con el body:
```json
{
  "email": "admin@hospital.com",
  "password": "admin123"
}
```

Recibirás un token JWT que debes incluir en los headers de tus peticiones:
```
Authorization: Bearer <tu_token>
```
