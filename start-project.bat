@echo off
REM Script para levantar el proyecto completo Intelligent en Docker

echo ========================================
echo  Proyecto Intelligent - Docker Setup
echo ========================================
echo.

REM Verificar si Docker esta corriendo
docker info >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker no esta corriendo. Por favor, inicia Docker Desktop.
    pause
    exit /b 1
)

echo [OK] Docker esta corriendo
echo.

REM Verificar si existe .env
if not exist .env (
    echo [INFO] Creando archivo .env desde .env.example...
    copy .env.example .env
    echo [OK] Archivo .env creado
    echo.
)

REM Verificar .env en frontend
if not exist frontend-intelligent\.env (
    echo [INFO] Creando .env en frontend...
    copy frontend-intelligent\.env.example frontend-intelligent\.env
    echo [OK] .env del frontend creado
    echo.
)

echo ========================================
echo  Construyendo e iniciando servicios...
echo ========================================
echo.
echo Servicios que se van a levantar:
echo  - PostgreSQL Database (puerto 5432)
echo  - Django Backend (puerto 8000)
echo  - Face Recognition API (puerto 8080)
echo  - Next.js Frontend (puerto 3000)
echo.

docker-compose up --build -d

if errorlevel 1 (
    echo.
    echo [ERROR] Hubo un error al construir o iniciar los servicios
    pause
    exit /b 1
)

echo.
echo ========================================
echo  Servicios iniciados correctamente!
echo ========================================
echo.
echo Accede a las aplicaciones en:
echo  - Frontend:          http://localhost:3000
echo  - Backend API:       http://localhost:8000
echo  - Backend Admin:     http://localhost:8000/admin
echo  - Swagger API Docs:  http://localhost:8000/swagger
echo  - Face Recognition:  http://localhost:8080
echo.
echo Ver logs en tiempo real:
echo   docker-compose logs -f
echo.
echo Ver estado de servicios:
echo   docker-compose ps
echo.
echo Detener todos los servicios:
echo   docker-compose down
echo.

REM Mostrar logs por 5 segundos
echo Mostrando logs de inicio (Ctrl+C para salir)...
timeout /t 3 >nul
docker-compose logs

echo.
pause
