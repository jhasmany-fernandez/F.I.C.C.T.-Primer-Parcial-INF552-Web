# Backend Intelligent - Django REST API

Django REST API backend for the Intelligent Admin Dashboard with PostgreSQL database and JWT authentication.

## Tech Stack

- **Django 5.0.1** - Python web framework
- **Django REST Framework 3.14.0** - RESTful API toolkit
- **PostgreSQL 16** - Relational database
- **JWT Authentication** - Token-based authentication
- **Docker & Docker Compose** - Containerization
- **Swagger/OpenAPI** - API documentation

## Project Structure

```
backend-intelligent/
├── backend_intelligent/       # Main Django project
│   ├── __init__.py
│   ├── settings.py           # Django settings
│   ├── urls.py              # URL routing
│   ├── wsgi.py              # WSGI config
│   └── asgi.py              # ASGI config
├── apps/                     # Django applications
├── static/                   # Static files
├── media/                    # Media uploads
├── requirements/            # Python dependencies
│   ├── base.txt            # Core dependencies
│   ├── dev.txt             # Development tools
│   └── prod.txt            # Production dependencies
├── manage.py               # Django management
├── Dockerfile              # Docker configuration
├── docker-compose.yml      # Docker Compose setup
├── .env.example           # Environment variables template
└── .gitignore             # Git ignore rules
```

## Features

- ✅ Django REST Framework API
- ✅ PostgreSQL database
- ✅ JWT authentication
- ✅ CORS configuration for Next.js frontend
- ✅ Swagger/OpenAPI documentation
- ✅ Docker containerization
- ✅ Production-ready configuration

## Getting Started

### Prerequisites

- Python 3.11+
- PostgreSQL 16+ (or use Docker)
- Docker & Docker Compose (recommended)

### Installation

#### Option 1: Using Docker (Recommended)

1. **Copy environment variables**
   ```bash
   cp .env.example .env
   ```

2. **Build and start containers**
   ```bash
   docker-compose up --build
   ```

3. **Access the API**
   - API: http://localhost:8000
   - Admin: http://localhost:8000/admin
   - Swagger: http://localhost:8000/swagger
   - ReDoc: http://localhost:8000/redoc

#### Option 2: Manual Setup

1. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements/dev.txt
   ```

3. **Setup environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

4. **Create PostgreSQL database**
   ```bash
   createdb backend_intelligent_db
   ```

5. **Run migrations**
   ```bash
   python manage.py migrate
   ```

6. **Create superuser**
   ```bash
   python manage.py createsuperuser
   ```

7. **Start development server**
   ```bash
   python manage.py runserver
   ```

## Environment Variables

Create a `.env` file based on `.env.example`:

```env
# Django Settings
SECRET_KEY=your-secret-key-here-change-in-production
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database PostgreSQL
DB_NAME=backend_intelligent_db
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost  # Use 'db' when running with Docker
DB_PORT=5432

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

## API Documentation

Once the server is running, access the API documentation:

- **Swagger UI**: http://localhost:8000/swagger
- **ReDoc**: http://localhost:8000/redoc

## Development

### Create a new Django app

```bash
python manage.py startapp app_name apps/app_name
```

### Run migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

### Create superuser

```bash
python manage.py createsuperuser
```

### Run tests

```bash
python manage.py test
```

### Code formatting and linting

```bash
black .
flake8
pylint apps/
```

## Docker Commands

### Start containers

```bash
docker-compose up
```

### Start in detached mode

```bash
docker-compose up -d
```

### Stop containers

```bash
docker-compose down
```

### View logs

```bash
docker-compose logs -f web
```

### Run Django commands in container

```bash
docker-compose exec web python manage.py migrate
docker-compose exec web python manage.py createsuperuser
docker-compose exec web python manage.py collectstatic
```

### Rebuild containers

```bash
docker-compose up --build
```

## Production Deployment

For production deployment:

1. **Update environment variables**
   - Set `DEBUG=False`
   - Generate new `SECRET_KEY`
   - Update `ALLOWED_HOSTS`
   - Configure production database

2. **Use production requirements**
   ```bash
   pip install -r requirements/prod.txt
   ```

3. **Collect static files**
   ```bash
   python manage.py collectstatic
   ```

4. **Use production server (Gunicorn)**
   ```bash
   gunicorn backend_intelligent.wsgi:application --bind 0.0.0.0:8000
   ```

## Integration with Frontend

This backend is configured to work with the Next.js frontend at:
- http://localhost:3000
- http://localhost:3001

CORS is already configured for these origins.

## License

MIT License
