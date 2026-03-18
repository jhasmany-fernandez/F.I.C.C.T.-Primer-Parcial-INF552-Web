# Docker Setup - Frontend Intelligent

Guía completa para ejecutar el frontend con Docker.

## Requisitos Previos

- Docker instalado (versión 20.10 o superior)
- Docker Compose instalado (versión 2.0 o superior)

## Estructura de Archivos Docker

```
frontend-intelligent/
├── Dockerfile              # Imagen de producción optimizada
├── Dockerfile.dev          # Imagen de desarrollo con hot-reload
├── docker-compose.yml      # Configuración para producción
├── docker-compose.dev.yml  # Configuración para desarrollo
├── .dockerignore           # Archivos excluidos del contexto Docker
└── .env.example            # Variables de entorno de ejemplo
```

## Configuración Inicial

1. **Copiar el archivo de variables de entorno:**

```bash
cp .env.example .env
```

2. **Editar el archivo `.env` según tus necesidades:**

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_FACE_RECOGNITION_URL=http://localhost:8080
```

## Modo Desarrollo

### Opción 1: Docker Compose (Recomendado)

```bash
# Construir y ejecutar
docker-compose -f docker-compose.dev.yml up --build

# Ejecutar en segundo plano
docker-compose -f docker-compose.dev.yml up -d

# Ver logs
docker-compose -f docker-compose.dev.yml logs -f

# Detener
docker-compose -f docker-compose.dev.yml down
```

### Opción 2: Docker directo

```bash
# Construir imagen
docker build -f Dockerfile.dev -t intelligent-frontend-dev .

# Ejecutar contenedor
docker run -p 3000:3000 -v $(pwd):/app -v /app/node_modules intelligent-frontend-dev
```

**Características del modo desarrollo:**
- Hot-reload activado
- Volúmenes montados para cambios en tiempo real
- Incluye todas las dependencias de desarrollo
- Puerto 3000 expuesto

## Modo Producción

### Opción 1: Docker Compose (Recomendado)

```bash
# Construir y ejecutar
docker-compose up --build

# Ejecutar en segundo plano
docker-compose up -d

# Ver logs
docker-compose logs -f

# Detener
docker-compose down
```

### Opción 2: Docker directo

```bash
# Construir imagen
docker build -t intelligent-frontend .

# Ejecutar contenedor
docker run -p 3000:3000 --env-file .env intelligent-frontend
```

**Características del modo producción:**
- Build optimizado con multi-stage
- Imagen mínima (Alpine Linux)
- Usuario no-root para seguridad
- Health check incluido
- Standalone output de Next.js

## Comandos Útiles

### Gestión de Contenedores

```bash
# Listar contenedores en ejecución
docker ps

# Ver logs en tiempo real
docker logs -f intelligent-frontend

# Acceder al contenedor
docker exec -it intelligent-frontend sh

# Reiniciar contenedor
docker restart intelligent-frontend

# Eliminar contenedor
docker rm -f intelligent-frontend
```

### Gestión de Imágenes

```bash
# Listar imágenes
docker images

# Eliminar imagen
docker rmi intelligent-frontend

# Limpiar imágenes no usadas
docker image prune -a
```

### Gestión de Volúmenes

```bash
# Listar volúmenes
docker volume ls

# Eliminar volúmenes no usados
docker volume prune
```

## Integración con Backend y Servicios

Para ejecutar el frontend junto con el backend y el servicio de reconocimiento facial, puedes crear un `docker-compose.yml` en la raíz del proyecto:

```yaml
version: '3.8'

services:
  # Frontend
  frontend:
    build: ./frontend-intelligent
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:8000/api
      - NEXT_PUBLIC_FACE_RECOGNITION_URL=http://face-recognition:8080
    depends_on:
      - backend
      - face-recognition
    networks:
      - intelligent-network

  # Backend
  backend:
    build: ./backend-intelligent
    ports:
      - "8000:8000"
    depends_on:
      - db
    networks:
      - intelligent-network

  # Database
  db:
    image: postgres:16-alpine
    environment:
      - POSTGRES_DB=intelligent_db
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - intelligent-network

  # Face Recognition Service
  face-recognition:
    image: kbyai/face-recognition:latest
    ports:
      - "8080:8080"
    networks:
      - intelligent-network

volumes:
  postgres_data:

networks:
  intelligent-network:
    driver: bridge
```

## Optimización de Imágenes

### Tamaño de la Imagen

La imagen de producción utiliza multi-stage build para minimizar el tamaño:

```bash
# Ver tamaño de la imagen
docker images intelligent-frontend

# REPOSITORY              TAG       SIZE
# intelligent-frontend    latest    ~150MB
```

### Cache de Dependencias

Docker cachea las capas, así que cambios en el código no requieren reinstalar dependencias:

1. `package.json` cambia → Reinstala dependencias
2. Solo código cambia → Usa cache de dependencias

## Solución de Problemas

### Error: Puerto 3000 ya en uso

```bash
# Encontrar proceso usando el puerto
netstat -ano | findstr :3000  # Windows
lsof -i :3000                 # Linux/Mac

# Cambiar puerto en docker-compose.yml
ports:
  - "3001:3000"
```

### Error: Out of memory durante build

```bash
# Aumentar memoria de Docker Desktop
# Settings → Resources → Memory → 4GB+

# O usar build con menos paralelismo
docker build --memory=4g -t intelligent-frontend .
```

### Error: Cannot find module

```bash
# Reconstruir sin cache
docker-compose build --no-cache

# O limpiar todo y reconstruir
docker-compose down -v
docker-compose up --build
```

### Cambios en package.json no se reflejan

```bash
# Reconstruir la imagen
docker-compose up --build

# O forzar recreación de contenedor
docker-compose up --force-recreate
```

## Variables de Entorno

### Variables de Next.js (NEXT_PUBLIC_*)

Las variables que comienzan con `NEXT_PUBLIC_` están disponibles en el navegador:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_FACE_RECOGNITION_URL=http://localhost:8080
NEXT_PUBLIC_APP_NAME=Intelligent Admin Dashboard
```

### Variables de Build

Estas variables solo están disponibles durante el build:

```env
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

## Health Check

El contenedor incluye un health check para verificar que la aplicación está funcionando:

```bash
# Ver estado de health check
docker inspect --format='{{.State.Health.Status}}' intelligent-frontend

# Ver logs de health check
docker inspect --format='{{range .State.Health.Log}}{{.Output}}{{end}}' intelligent-frontend
```

## Seguridad

- ✅ Usuario no-root (nextjs:nodejs)
- ✅ Imagen base mínima (Alpine Linux)
- ✅ Sin secretos en la imagen
- ✅ Variables de entorno en runtime
- ✅ Dependencias de producción solamente

## Recursos

- [Next.js Docker Documentation](https://nextjs.org/docs/deployment#docker-image)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
