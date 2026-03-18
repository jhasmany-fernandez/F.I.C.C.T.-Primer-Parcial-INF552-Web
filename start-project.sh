#!/bin/bash

# Script para levantar el proyecto completo Intelligent en Docker

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "========================================"
echo " Proyecto Intelligent - Docker Setup"
echo "========================================"
echo ""

# Verificar si Docker esta corriendo
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}[ERROR]${NC} Docker no esta corriendo. Por favor, inicia Docker."
    exit 1
fi

echo -e "${GREEN}[OK]${NC} Docker esta corriendo"
echo ""

# Verificar si existe .env
if [ ! -f .env ]; then
    echo -e "${YELLOW}[INFO]${NC} Creando archivo .env desde .env.example..."
    cp .env.example .env
    echo -e "${GREEN}[OK]${NC} Archivo .env creado"
    echo ""
fi

# Verificar .env en frontend
if [ ! -f frontend-intelligent/.env ]; then
    echo -e "${YELLOW}[INFO]${NC} Creando .env en frontend..."
    cp frontend-intelligent/.env.example frontend-intelligent/.env
    echo -e "${GREEN}[OK]${NC} .env del frontend creado"
    echo ""
fi

echo "========================================"
echo " Construyendo e iniciando servicios..."
echo "========================================"
echo ""
echo "Servicios que se van a levantar:"
echo " - PostgreSQL Database (puerto 5432)"
echo " - Django Backend (puerto 8000)"
echo " - Face Recognition API (puerto 8080)"
echo " - Next.js Frontend (puerto 3000)"
echo ""

docker-compose up --build -d

echo ""
echo "========================================"
echo " Servicios iniciados correctamente!"
echo "========================================"
echo ""
echo "Accede a las aplicaciones en:"
echo -e " - Frontend:          ${GREEN}http://localhost:3000${NC}"
echo -e " - Backend API:       ${GREEN}http://localhost:8000${NC}"
echo -e " - Backend Admin:     ${GREEN}http://localhost:8000/admin${NC}"
echo -e " - Swagger API Docs:  ${GREEN}http://localhost:8000/swagger${NC}"
echo -e " - Face Recognition:  ${GREEN}http://localhost:8080${NC}"
echo ""
echo "Ver logs en tiempo real:"
echo "  docker-compose logs -f"
echo ""
echo "Ver estado de servicios:"
echo "  docker-compose ps"
echo ""
echo "Detener todos los servicios:"
echo "  docker-compose down"
echo ""

# Mostrar logs
echo "Mostrando logs de inicio..."
sleep 3
docker-compose logs
