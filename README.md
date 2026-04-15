# Proyecto Intelligent

Proyecto académico con app Android, frontend web, backend Node.js y servicio de reconocimiento facial.

## Estructura Principal

- `App/`: aplicación Android
- `frontend/`: frontend web estático
- `backend/`: servidor Node.js que sirve el frontend y expone `POST /login-face`
- `face-recognition-service/`: servicio Python para búsqueda y validación facial

## Arquitectura MVC

El proyecto se organiza bajo el patrón MVC tanto en móvil como en la parte web activa.

### MVC en la app móvil Android

#### Model

Representa estados, entidades y estructuras de datos de la app:

- `App/app/src/main/java/com/uagrm/smartaccess/model/AppScreen.kt`
- `App/app/src/main/java/com/uagrm/smartaccess/model/LoginFormState.kt`
- `App/app/src/main/java/com/uagrm/smartaccess/model/DashboardActionModel.kt`
- `App/app/src/main/java/com/uagrm/smartaccess/model/EntryMethodModel.kt`
- `App/app/src/main/java/com/uagrm/smartaccess/model/ReportModels.kt`
- `App/app/src/main/java/com/uagrm/smartaccess/model/AdminProfileModels.kt`

#### View

Está compuesta por las pantallas Jetpack Compose, responsables de renderizar la interfaz:

- `App/app/src/main/java/com/uagrm/smartaccess/MainActivity.kt`
- `App/app/src/main/java/com/uagrm/smartaccess/ui/dashboard/AccessDashboardScreen.kt`
- `App/app/src/main/java/com/uagrm/smartaccess/ui/entry/ClassroomEntryScreen.kt`
- `App/app/src/main/java/com/uagrm/smartaccess/ui/report/ReportObjectsScreen.kt`
- `App/app/src/main/java/com/uagrm/smartaccess/ui/profile/AdminProfileScreen.kt`

#### Controller

Gestiona navegación, eventos de usuario, lógica de interfaz y comunicación con backend:

- `App/app/src/main/java/com/uagrm/smartaccess/controller/AppController.kt`
- `App/app/src/main/java/com/uagrm/smartaccess/controller/LoginController.kt`
- `App/app/src/main/java/com/uagrm/smartaccess/controller/EntryController.kt`
- `App/app/src/main/java/com/uagrm/smartaccess/controller/ReportController.kt`
- `App/app/src/main/java/com/uagrm/smartaccess/controller/AdminProfileController.kt`

### MVC en la parte web

#### View

La vista web está formada por páginas HTML estáticas:

- `frontend/login.html`
- `frontend/index.html`
- `frontend/settings.html`
- `frontend/register-user.html`

#### Controller

Los controladores web coordinan eventos y consumo de la API:

- `frontend/login.js`
- `frontend/dashboard.js`
- `frontend/register-user.js`
- `frontend/js/login/loginController.js`
- `frontend/js/dashboard/dashboardController.js`
- `frontend/js/admin/adminController.js`

#### Model

Los modelos web encapsulan acceso a datos o respuestas del backend:

- `frontend/js/login/loginModel.js`
- `frontend/js/dashboard/dashboardModel.js`
- `frontend/js/admin/adminModel.js`

### MVC en el backend Node.js

El backend también está separado por responsabilidades siguiendo MVC ligero:

#### Controllers

- `backend/controllers/healthController.js`
- `backend/controllers/authController.js`
- `backend/controllers/userController.js`
- `backend/controllers/accessLogController.js`

#### Models

- `backend/models/databaseModel.js`
- `backend/models/userModel.js`
- `backend/models/accessLogModel.js`

#### Views

Las vistas del backend corresponden a serialización de respuestas y entrega de archivos:

- `backend/views/jsonView.js`
- `backend/views/userView.js`
- `backend/views/staticView.js`

#### Services y Utils

Se usan como capa auxiliar para lógica reutilizable:

- `backend/services/faceRecognitionService.js`
- `backend/services/userService.js`
- `backend/utils/httpUtils.js`
- `backend/utils/valueUtils.js`

## Flujo General

1. El frontend web captura la imagen del usuario.
2. El backend Node.js recibe la imagen en `POST /login-face`.
3. El backend reenvía la imagen al servicio `face-recognition-service`.
4. El servicio facial responde con la coincidencia encontrada.

## Ejecución Básica

### Variables de entorno

1. Copia `.env.example` a `.env`.
2. Define `POSTGRES_USER`, `POSTGRES_PASSWORD` y `POSTGRES_DB`.
3. Mantén esos mismos valores para todos los servicios Docker del proyecto.

### Nota importante sobre PostgreSQL y volúmenes persistentes

Si reutilizas el volumen `postgres_data`, cambiar `POSTGRES_PASSWORD` en `docker-compose.yml` o `.env` no actualiza por sí solo la contraseña interna del rol en PostgreSQL.

Para evitar que backend y base de datos vuelvan a desincronizarse, este proyecto ahora fuerza en cada arranque del contenedor `db` que la contraseña real del usuario configurado coincida con `POSTGRES_PASSWORD`.

### Backend web

```bash
cd backend
node server.js
```

### Servicio de reconocimiento facial

```bash
cd face-recognition-service
pip install -r requirements.txt
python app.py
```

### App Android

Abre `App/` en Android Studio y ejecuta la aplicación desde ahí.

### Importante para pruebas desde celular físico

La app móvil administrativa consume el backend usando la IP local de la computadora.

- Si pruebas desde emulador, normalmente se usa `10.0.2.2`.
- Si pruebas desde un teléfono físico, debes usar la IP local real de tu PC en la misma red Wi-Fi.
- El puerto `8081` debe estar permitido en el Firewall de Windows.

## Notas

- El frontend principal está en `frontend/`, no en frameworks adicionales.
- El backend principal está en `backend/`, no en Django.
- El reconocimiento facial real vive en `face-recognition-service/`.
- La web puede usarse como interfaz administrativa, mientras que la app móvil concentra vistas operativas y administración móvil.

## API de Reportes

El backend recibe reportes desde móvil o web en:

```http
POST /api/reports
Content-Type: application/json
```

### Contrato JSON esperado

```json
{
  "reporterRegistro": "219012345",
  "reporterNombre": "Juan Perez",
  "problemType": "Equipo de computación",
  "problemState": "No funciona",
  "priority": "Alta",
  "description": "La computadora del aula no enciende desde el inicio de clases.",
  "evidenceImageBase64": "/9j/4AAQSkZJRgABAQAAAQABAAD..."
}
```

### Campos

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---:|---|
| reporterRegistro | String | Sí | Registro del usuario que reporta |
| reporterNombre | String | Sí | Nombre del usuario que reporta |
| problemType | String | Sí | Tipo de problema seleccionado |
| problemState | String | Sí | Estado del problema. Ej: `No funciona`, `Funciona mal`, `Detalle estético` |
| priority | String | Sí | Prioridad calculada. Ej: `Alta`, `Media`, `Baja` |
| description | String | Sí | Descripción breve del incidente |
| evidenceImageBase64 | String o null | No | Evidencia fotográfica codificada en Base64 |

### DTO de referencia para Flutter

```kotlin
data class ReportRequest(
    val reporterRegistro: String,
    val reporterNombre: String,
    val problemType: String,
    val problemState: String,
    val priority: String,
    val description: String,
    val evidenceImageBase64: String?
)
```

### Respuesta exitosa

```json
{
  "success": true,
  "message": "Reporte registrado correctamente.",
  "report": {
    "id": 1,
    "reporterRegistro": "219012345",
    "reporterNombre": "Juan Perez",
    "problemType": "Equipo de computación",
    "problemState": "No funciona",
    "priority": "Alta",
    "description": "La computadora del aula no enciende desde el inicio de clases.",
    "evidenceImageBase64": "/9j/4AAQSkZJRgABAQAAAQABAAD...",
    "createdAt": "2026-04-13T00:00:00.000Z"
  }
}
```

### Notas para Flutter

- `evidenceImageBase64` puede enviarse como `null` si no hay evidencia.
- El backend limita el cuerpo JSON a aproximadamente `10 MB`, así que conviene comprimir o redimensionar imágenes grandes antes de codificarlas.
- Si falta un campo obligatorio, el backend responde con `400 Bad Request`.

## Git

Antes de subir cambios, verifica que no se incluyan archivos sensibles:

```bash
git status
```
