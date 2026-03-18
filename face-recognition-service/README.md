# Face Recognition Service (Production Grade)

Servicio robusto de reconocimiento facial usando DeepFace y Facenet512, compatible con el backend Django.

## Características

- ✅ **Reconocimiento facial real** usando DeepFace con modelo Facenet512
- ✅ **Embeddings de 512 dimensiones** para alta precisión
- ✅ **Detección automática de rostros** con OpenCV
- ✅ **Similitud por coseno** para comparación robusta
- ✅ Funciona con diferentes ángulos, iluminación y expresiones
- ✅ Registro de rostros (`POST /register`)
- ✅ Búsqueda de rostros (`POST /search`)
- ✅ Eliminación de rostros (`POST /remove`)
- ✅ Lista de usuarios (`GET /user_list`)
- ✅ Health check (`GET /health`)

## Tecnología

- **DeepFace**: Biblioteca de reconocimiento facial de grado producción
- **Facenet512**: Modelo de deep learning que genera embeddings de 512 dimensiones
- **OpenCV**: Detector de rostros rápido y confiable
- **Similitud coseno**: Métrica precisa para comparar embeddings faciales
- **Threshold por defecto**: 0.6 (60% de similitud)

## Instalación y Uso

### Opción 1: Usar con Docker

```bash
# Detener el servicio anterior si está corriendo
docker stop intelligent-face-recognition
docker rm intelligent-face-recognition

# Construir e iniciar el nuevo servicio
cd face-recognition-service
docker-compose up --build -d
```

### Opción 2: Ejecutar directamente con Python

```bash
cd face-recognition-service

# Crear entorno virtual
python -m venv venv

# Activar entorno virtual
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt

# Ejecutar servicio
python app.py
```

## Verificar que funciona

```bash
# Health check
curl http://localhost:8080/health

# Debería devolver:
# {"status":"healthy","service":"face-recognition"}
```

## Endpoints

### POST /register
Registra un nuevo rostro.

**Request:**
```json
{
  "id": "user123",
  "image": "base64_encoded_image..."
}
```

**Response:**
```json
{
  "success": true,
  "id": "user123",
  "message": "Face registered successfully"
}
```

### POST /search
Busca un rostro coincidente.

**Request:**
```json
{
  "image": "base64_encoded_image...",
  "threshold": 0.7
}
```

**Response:**
```json
{
  "success": true,
  "id": "user123",
  "similarity": 1.0,
  "message": "Face found"
}
```

### POST /remove
Elimina un rostro registrado.

**Request:**
```json
{
  "id": "user123"
}
```

## Ventajas sobre servicios cloud

Este servicio es **100% local y privado**:
- ✅ Sin enviar datos faciales a terceros (AWS, Azure, etc.)
- ✅ Sin costos por API call
- ✅ Total privacidad de datos biométricos
- ✅ Funciona offline
- ✅ Control total sobre el modelo y parámetros

## Próximos pasos (opcionales)

Para escalar a millones de usuarios, considera:
- Base de datos vectorial (Pinecone, Milvus, Weaviate) para búsqueda rápida
- GPU para procesamiento más rápido
- Cache de embeddings en Redis
- Múltiples workers con Gunicorn
