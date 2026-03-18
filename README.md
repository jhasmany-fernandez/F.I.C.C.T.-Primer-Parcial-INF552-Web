# Proyecto Intelligent

Dashboard Administrativo Full-Stack con Reconocimiento Facial IA

## 🚀 Inicio Rápido

### Configuración Inicial

**IMPORTANTE: Antes de empezar, copia las variables de entorno:**

```bash
# Copiar archivo de ejemplo a .env
cp .env.example .env

# Edita el archivo .env y cambia las credenciales por defecto
# NUNCA subas el archivo .env a GitHub
```

### Opción 1: Levantar Todo con Docker (Recomendado)

**Windows:**
```bash
start-project.bat
```

**Linux/Mac:**
```bash
chmod +x start-project.sh
./start-project.sh
```

### Opción 2: Docker Compose Manual

```bash
# Copiar variables de entorno
cp .env.example .env
cp frontend-intelligent/.env.example frontend-intelligent/.env

# Levantar todos los servicios
docker-compose up -d

# Ver logs
docker-compose logs -f
```

## 📋 Acceso a los Servicios

Una vez levantado el proyecto:

| Servicio | URL | Descripción |
|----------|-----|-------------|
| **Frontend** | http://localhost:3000 | Dashboard Next.js |
| **Backend** | http://localhost:8000 | API Django |
| **Admin Panel** | http://localhost:8000/admin | Django Admin |
| **API Docs** | http://localhost:8000/swagger | Swagger UI |
| **Face Recognition** | http://localhost:8080 | API de IA |

## 🏗️ Arquitectura

```
Proyecto-intelligent/
├── frontend-intelligent/        # Next.js 16 + React 19 + TypeScript
│   ├── src/
│   │   ├── app/                # App Router (Next.js)
│   │   ├── components/         # Componentes React
│   │   │   ├── Auth/          # Autenticación y Face Scanner
│   │   │   ├── Charts/        # Gráficos y visualizaciones
│   │   │   └── FormElements/  # Componentes de formularios
│   │   ├── services/          # API Services (authService, etc.)
│   │   └── types/             # TypeScript Types
│   └── DOCKER.md              # Docs de Docker del frontend
│
├── backend-intelligent/        # Django 5.0 + Django REST Framework
│   ├── backend_intelligent/   # Configuración Django
│   ├── apps/                  # Django Apps (auth, users, etc.)
│   │   ├── authentication/    # Autenticación con facial recognition
│   │   └── users/            # Gestión de usuarios
│   └── requirements/          # Python Dependencies
│
├── face-recognition-service/  # 🔥 Servicio de IA en uso (DeepFace)
│   ├── app.py                # API Flask con DeepFace
│   ├── requirements.txt      # deepface, scikit-learn, etc.
│   ├── Dockerfile            # Configuración Docker
│   └── face_data/            # Storage de embeddings faciales
│
├── docker-compose.yml         # Orquestación de todos los servicios
├── .gitignore                # Archivos ignorados por Git
├── .env.example              # Template de variables de entorno
└── README.md                 # Este archivo
```

## 🛠️ Stack Tecnológico

### Frontend
- **Framework:** Next.js 16.0.10
- **UI:** React 19.2.0 + TypeScript
- **Estilos:** Tailwind CSS 3.4.16
- **Gráficos:** ApexCharts 4.5.0
- **Temas:** Light/Dark mode con next-themes

### Backend
- **Framework:** Django 5.0.1
- **API:** Django REST Framework 3.14.0
- **Base de datos:** PostgreSQL 16
- **Auth:** JWT (Simple JWT)
- **Docs:** Swagger/OpenAPI (drf-yasg)

### IA/ML
- **Face Recognition:** Servicio personalizado con DeepFace + Facenet512
- **Framework:** Flask + DeepFace
- **Modelo:** Facenet512 (512-dimensional embeddings)
- **Similitud:** Cosine similarity con scikit-learn
- **Features:** Registro, búsqueda, y eliminación de rostros

### DevOps
- **Containerización:** Docker + Docker Compose
- **Hot Reload:** Habilitado en desarrollo
- **Health Checks:** Configurados en todos los servicios

## 📊 Servicios en Detalle

### 1. Frontend (Port 3000)
- Dashboard administrativo completo
- 100+ componentes React reutilizables
- Gráficos interactivos
- Autenticación con Google
- Tema claro/oscuro
- Responsive design

### 2. Backend (Port 8000)
- API REST completa
- Autenticación JWT
- Panel de administración Django
- Documentación automática (Swagger/ReDoc)
- CORS configurado para desarrollo

### 3. Base de Datos (Port 5432)
- PostgreSQL 16 Alpine
- Datos persistentes en volúmenes Docker
- Migraciones automáticas al iniciar

### 4. Face Recognition (Port 8080)
- Detección de rostros
- Reconocimiento facial
- Verificación de identidad
- Registro de usuarios por biometría

## 🎯 Características Principales

### Frontend
- ✅ Dashboard con métricas en tiempo real
- ✅ Gráficos interactivos (4+ tipos)
- ✅ Tablas de datos con filtros
- ✅ Formularios completos con validación
- ✅ Calendario integrado
- ✅ Perfil de usuario
- ✅ Configuraciones
- ✅ Sistema de autenticación
- ✅ Face scanner component

### Backend
- ✅ API REST con DRF
- ✅ JWT Authentication
- ✅ PostgreSQL database
- ✅ Swagger/ReDoc docs
- ✅ CORS support
- ✅ Admin panel
- ✅ Media & static files

### DevOps
- ✅ Docker multi-stage builds
- ✅ Docker Compose orquestación
- ✅ Hot reload en desarrollo
- ✅ Health checks
- ✅ Variables de entorno
- ✅ Volúmenes persistentes

## 📝 Comandos Esenciales

### Gestión General
```bash
# Ver estado de servicios
docker-compose ps
./check-status.sh  # o check-status.bat en Windows

# Ver logs
docker-compose logs -f

# Detener servicios
docker-compose down

# Reiniciar servicios
docker-compose restart
```

### Comandos Django
```bash
# Crear superusuario
docker exec -it intelligent-backend python manage.py createsuperuser

# Ejecutar migraciones
docker exec -it intelligent-backend python manage.py migrate

# Shell de Django
docker exec -it intelligent-backend python manage.py shell
```

### Desarrollo
```bash
# Reconstruir después de cambios
docker-compose up --build

# Acceder al shell del contenedor
docker exec -it intelligent-frontend sh
docker exec -it intelligent-backend sh
```

## 🔧 Configuración

### Variables de Entorno

**Raíz (.env):**
```env
POSTGRES_DB=backend_intelligent_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
DEBUG=True
SECRET_KEY=your-secret-key
```

**Frontend (.env):**
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_FACE_RECOGNITION_URL=http://localhost:8080
```

## 📖 Documentación Adicional

- **[QUICK-START.md](./QUICK-START.md)** - Guía rápida de inicio
- **[README-DOCKER.md](./README-DOCKER.md)** - Documentación completa de Docker
- **[frontend-intelligent/DOCKER.md](./frontend-intelligent/DOCKER.md)** - Docker del frontend
- **[backend-intelligent/README.md](./backend-intelligent/README.md)** - Docs del backend

## 🐛 Solución de Problemas

### Puerto ya en uso
```bash
# Cambiar puerto en docker-compose.yml
ports:
  - "3001:3000"  # Cambiar 3000 a otro puerto
```

### Base de datos no conecta
```bash
docker-compose logs db
docker-compose restart db
```

### Frontend no carga
```bash
docker-compose logs frontend
docker-compose restart frontend
```

### Empezar de cero
```bash
docker-compose down -v
docker-compose up --build
```

## 📤 Preparar para GitHub

### ⚠️ Remover Archivos Sensibles del Tracking

Si ya subiste archivos sensibles a Git (como `.env`), necesitas removerlos:

```bash
# Remover .env del tracking de Git (sin eliminarlo del disco)
git rm --cached .env

# Remover otros archivos sensibles si es necesario
git rm --cached -r node_modules/ 2>/dev/null
git rm --cached -r .next/ 2>/dev/null
git rm --cached -r __pycache__/ 2>/dev/null

# Commit los cambios
git add .gitignore
git commit -m "Remove sensitive files and update .gitignore"
```

### ✅ Verificar que todo esté listo

```bash
# Verificar que .gitignore funciona correctamente
git status

# Los siguientes archivos/carpetas NO deben aparecer:
# - .env
# - node_modules/
# - .next/
# - __pycache__/
# - face_data/
# - *.pyc

# Si ves archivos que deberían estar ignorados
git check-ignore -v <archivo>  # Ver si está en .gitignore
```

### 📝 Antes de Push

**Checklist antes de subir a GitHub:**

- [ ] Archivo `.env` NO está en el repositorio
- [ ] Variables sensibles reemplazadas en `.env.example`
- [ ] `node_modules/` está ignorado
- [ ] `face_data/` está ignorado
- [ ] `.gitignore` está actualizado
- [ ] README.md está completo
- [ ] Credenciales de base de datos NO están hardcodeadas

```bash
# Hacer commit y push
git add .
git commit -m "Initial commit: Full-stack dashboard with facial recognition"
git push origin main
```

## 🎓 Estado del Proyecto

### ✅ Completado
- ✅ Estructura del proyecto
- ✅ Configuración de Docker multi-container
- ✅ Frontend UI completo con 100+ componentes
- ✅ Sistema de autenticación con JWT
- ✅ Backend Django con REST API
- ✅ Modelos de usuario y autenticación
- ✅ Base de datos PostgreSQL configurada
- ✅ **Servicio de reconocimiento facial con DeepFace**
- ✅ **Registro de usuarios con reconocimiento facial**
- ✅ **Login con contraseña y reconocimiento facial**
- ✅ **FaceScanner component con control de cámara**
- ✅ **Funcionalidad "Mantener sesión"**
- ✅ **Mostrar/ocultar contraseñas**
- ✅ Integración frontend-backend completa
- ✅ Documentación completa
- ✅ .gitignore configurado

### ⚠️ En Desarrollo
- Dashboard con datos reales (actualmente con datos mock)
- Sistema de permisos y roles
- Tests unitarios y de integración
- CI/CD pipeline

### 📋 Próximos Pasos
1. Conectar dashboard con datos reales del backend
2. Implementar sistema de roles y permisos
3. Agregar tests unitarios y e2e
4. Implementar CI/CD con GitHub Actions
5. Configurar entorno de producción
6. Implementar analytics y monitoreo

## 🤝 Contribuir

Este es un proyecto de portafolio en desarrollo. Para contribuir:

1. Fork el proyecto
2. Crea una rama feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto es privado y con fines educativos/portafolio.

## 👤 Autor

**Tu Nombre**
- Portfolio: [tu-portfolio.com]
- GitHub: [@tu-usuario]

## 🙏 Agradecimientos

- Next.js Team
- Django Team
- TailwindLabs
- KBY-AI (Face Recognition)

---

**Nota:** Este proyecto está en modo desarrollo. Para producción, asegúrate de:
- Cambiar `DEBUG=False`
- Usar `SECRET_KEY` seguro
- Configurar HTTPS
- Actualizar CORS y ALLOWED_HOSTS
- Usar Gunicorn en producción
- Configurar backups de base de datos
