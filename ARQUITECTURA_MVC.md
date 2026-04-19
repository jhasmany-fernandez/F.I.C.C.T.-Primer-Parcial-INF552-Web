# Arquitectura MVC y Logica Principal

Este documento resume la separacion MVC aplicada en el proyecto y explica los flujos principales que quedaron comentados en el codigo.

## Objetivo

La idea de esta organizacion es que cada capa tenga una responsabilidad clara:

- `Controller`: recibe peticiones, coordina el flujo y construye la respuesta.
- `Service`: contiene reglas de negocio y casos de uso.
- `Model`: accede a la base de datos o a la persistencia.
- `View`: serializa respuestas en backend o maneja el DOM en frontend.

Con esta separacion se reduce el acoplamiento y es mas facil mantener o ampliar el sistema sin romper otras partes.

## MVC En Backend

### Controllers

Archivo principal:

- `backend/controllers/userController.js`

Responsabilidad:

- leer el `body` de la request
- validar acceso al modulo cuando corresponde
- delegar la logica al service
- serializar usuarios con las view helpers
- devolver respuestas HTTP consistentes

Ejemplo de idea aplicada:

- `handleImportUsersExcel()` no parsea Excel directamente
- `handleBulkSaveUsers()` no hace `INSERT` directos
- `handleUpdateUserPassword()` no actualiza SQL por su cuenta

Todo eso se delega al service.

### Services

Archivo principal:

- `backend/services/userManagementService.js`

Responsabilidad:

- validar reglas de negocio
- decidir si una operacion puede ejecutarse
- procesar el Excel
- preparar datos para guardar usuarios, materias y horarios
- controlar errores de dominio antes de responder por HTTP

Casos de uso importantes:

- `authorizeAdministrativeAccess(actorRegistration)`
  Verifica si la carga masiva puede continuar cuando la chapa inteligente esta apagada.
- `createManagedUser(payload)`
  Crea usuarios desde el panel respetando validaciones y la clave temporal si aplica.
- `importUsersFromExcelPayload(payload)`
  Hace la previsualizacion del Excel, detecta advertencias academicas y no persiste aun.
- `persistImportedUsers(users)`
  Guarda usuarios y solo crea materia/horario si la fila academica esta completa.
- `updateManagedUserPassword(payload)`
  Actualiza la contrasena y activa el usuario despues del primer ingreso.

### Models

Archivo principal:

- `backend/models/userModel.js`

Responsabilidad:

- ejecutar consultas SQL sobre `usuarios`
- encapsular operaciones reutilizables de lectura y escritura
- permitir uso con cliente normal o dentro de transacciones

Funciones importantes:

- `findUserForLogin(registro)`
- `findUserByRegistro(registro)`
- `findExistingUsersByRegistro(registros)`
- `listRecentUsers(limit, db)`
- `createUserRecord(user, passwordHash, db)`
- `updateUserPasswordByRegistro(registro, passwordHash, db)`
- `upsertImportedUser(importedUser, buildImportedUserPayload, hashPassword, db)`

Regla especial del sistema:

- `ensurePendingTeachersGenericPassword(...)`
  Alinea a todos los docentes `Pendiente` con la clave generica configurada para el primer acceso.

### Views

Archivos relacionados:

- `backend/views/jsonView.js`
- `backend/views/userView.js`

Responsabilidad:

- formatear la salida del backend
- mantener una respuesta JSON consistente
- evitar que el controller construya manualmente todas las estructuras repetidas

## MVC En Frontend

### LoginController

Archivo:

- `frontend/js/login/loginController.js`

Responsabilidad:

- coordinar el login por rostro, PIN y contrasena
- decidir si el usuario entra directo o debe cambiar contrasena
- actualizar la sesion web
- pedir cambios visuales a la view

Flujos importantes:

- `startBiometricStatusPolling()`
  Consulta si la app movil ya autorizo huella o rostro.
- `submitKeypadCode()`
  Valida el PIN temporal contra backend.
- `handlePasswordLogin(event)`
  Hace login por contrasena y verifica si el backend exige cambio obligatorio.
- `handleMandatoryPasswordChange(registro, message)`
  Ejecuta el primer cambio de contrasena para docentes pendientes.
- `completePasswordSession(user, reason)`
  Centraliza el formato de sesion para evitar duplicacion.

### LoginModel

Archivo:

- `frontend/js/login/loginModel.js`

Responsabilidad:

- mantener estado efimero del login, como stream de camara y buffer del PIN
- concentrar las llamadas `fetch()` al backend
- resolver la `baseUrl` de la API

Endpoints consumidos desde aqui:

- `POST /login-face`
- `POST /api/login`
- `POST /api/users/update-password`
- `POST /api/access-code/validate`
- `GET /api/biometric-access/status`
- `GET /api/installations/smart-locks/status`

### LoginView

Archivo:

- `frontend/js/login/loginView.js`

Responsabilidad:

- leer inputs del DOM
- enlazar botones y formularios al controller
- actualizar estados visuales
- manejar la vista previa de camara
- mostrar mensajes y animaciones

La view no decide si un login es valido o no. Solo muestra el estado que el controller le indica.

## Flujo De Primer Ingreso Docente

La regla de negocio implementada es esta:

- si `rol = Docente`
- y `estado = Pendiente`
- entonces puede iniciar sesion con la clave generica `ficct123*`

Flujo:

1. El usuario envia `registro` y `password` a `POST /api/login`.
2. Si es docente pendiente con clave temporal valida, el backend responde con `requirePasswordReset: true`.
3. El frontend no entra al dashboard todavia.
4. El controller obliga a cambiar contrasena.
5. La nueva contrasena se envia a `POST /api/users/update-password`.
6. El backend actualiza la contrasena y cambia el estado a `Activo`.
7. El frontend vuelve a autenticar y recien ahi completa la sesion normal.

Esto evita que un docente se quede usando la clave generica despues del primer acceso.

## Flujo De Importacion Desde Excel

El proceso se divide en dos etapas para no guardar datos defectuosos sin control.

### 1. Preview

Se ejecuta en:

- `importUsersFromExcelPayload(payload)`

Que hace:

- lee el archivo desde ruta local o base64
- abre hojas del Excel
- transforma filas a usuarios legibles por el sistema
- detecta advertencias academicas
- consulta si el usuario ya existe en base de datos
- marca si la fila puede persistir o no

En esta etapa no se guarda nada aun.

### 2. Persistencia

Se ejecuta en:

- `persistImportedUsers(users)`

Que hace:

- crea o reutiliza usuarios
- crea materias si la fila academica es valida
- crea horarios solo si realmente existe horario en la fila
- guarda todo dentro de una transaccion

Resultado:

- evita duplicar docentes
- evita guardar relaciones incompletas
- mantiene integridad entre usuario, materia y horario

## Criterio General De Diseno

Las decisiones tomadas en esta estructura siguen esta idea:

- controllers pequenos
- services con la logica del negocio
- models enfocados en SQL y persistencia
- views enfocadas en representacion

Eso permite que:

- el backend sea mas facil de probar y mantener
- el frontend tenga responsabilidades mas claras
- las reglas del sistema no queden mezcladas con detalles de interfaz o transporte HTTP

## Archivos Clave

- `backend/controllers/userController.js`
- `backend/services/userManagementService.js`
- `backend/models/userModel.js`
- `backend/controllers/authController.js`
- `frontend/js/login/loginController.js`
- `frontend/js/login/loginModel.js`
- `frontend/js/login/loginView.js`

## Nota Final

Este documento resume la logica principal ya comentada en el codigo. Si luego se agregan nuevos modulos, conviene mantener la misma regla:

- primero definir la responsabilidad de cada capa
- despues ubicar la logica en la capa correcta
- y por ultimo documentar solo lo que no sea obvio a simple vista
