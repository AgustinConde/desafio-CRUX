# Gestión de puntos geográficos

Aplicación web desarrollada para el ejercicio técnico de CRUX MARINE. Permite
registrar, consultar, editar y eliminar puntos geográficos sobre un mapa
interactivo.

## Tecnologías

- Python 3.10+
- Django 5.2
- SQLite
- HTML, CSS y JavaScript
- Leaflet
- Docker y Docker Compose

## Funcionalidades

- Crear puntos seleccionando una ubicación en el mapa.
- Editar y eliminar puntos desde modales.
- Visualizar puntos activos e inactivos con diferentes marcadores.
- Buscar por nombre o descripción.
- Filtrar por estado.
- Centrar el mapa en un punto específico.
- Validar nombre, latitud y longitud.
- Mantener la posición del mapa entre recargas.
- Limitar el mapa a coordenadas geográficas válidas.
- Exponer los puntos mediante `GET /api/points/`.

## Ejecución con Docker

Requisitos:

- Docker Desktop con Docker Compose.

Desde la raíz del proyecto:

```bash
docker compose up --build
```

La aplicación estará disponible en:

```text
http://localhost:8000/
```

Para detener los contenedores:

```bash
docker compose down
```

La base SQLite se guarda en `data/db.sqlite3`, que está montada como volumen
del contenedor. Por eso los puntos se conservan al reiniciar el servicio.

## Configuración

Docker Compose incluye valores de desarrollo por defecto. Para sobrescribirlos,
se pueden definir variables de entorno o crear un archivo `.env` en la raíz:

```env
SECRET_KEY=una-clave-segura
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
```

También se puede partir de [.env.example](.env.example).

## Datos de ejemplo

Al iniciar el contenedor se ejecuta `seed_points`. Si la base está vacía,
carga automáticamente:

- **UTN Haedo**: `-34.640556, -58.601944`. 
- **CRUX MARINE**: `-34.661603, -58.641822`.
- **Obelisco de Buenos Aires**: `-34.603700, -58.381600`.
- **Puerto Madero**: `-34.611800, -58.363700` (inactivo).

Si la base ya contiene puntos, no se agregan ni se modifican datos existentes.

Para cargar los datos manualmente en un entorno local:

```bash
python manage.py seed_points
```

## Ejecución local

Crear y activar un entorno virtual:

```bash
python -m venv .venv
```

En Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
```

En macOS/Linux:

```bash
source .venv/bin/activate
```

Para ejecutar el servidor local con archivos estáticos:

En Windows PowerShell:

```powershell
$env:DEBUG="True"
```

En macOS/Linux:

```bash
export DEBUG=True
```

Instalar dependencias y preparar la base:

```bash
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_points
python manage.py runserver
```

## Tests

```bash
python manage.py check
python manage.py test
```

## Estructura principal

```text
config/                 Configuración y URLs del proyecto Django
points/
├── fixtures/           Datos iniciales
├── management/         Comandos de gestión personalizados
├── migrations/         Migraciones de la base de datos
├── static/             CSS, JavaScript e imágenes
├── templates/          Templates HTML
├── forms.py            Validación de formularios
├── models.py           Modelo Point
├── urls.py             Rutas de la aplicación
└── views.py            Vistas CRUD y endpoint JSON
docker/
└── entrypoint.sh       Migraciones, datos iniciales y servidor
data/                   SQLite persistente (ignorado por Git)
```

## Endpoints principales

| Método | URL | Uso |
| --- | --- | --- |
| `GET` | `/` | Listado y mapa |
| `POST` | `/points/new/` | Crear un punto |
| `POST` | `/points/<id>/edit/` | Editar un punto |
| `POST` | `/points/<id>/delete/` | Eliminar un punto |
| `GET` | `/api/points/` | Obtener puntos en JSON |

Las operaciones de escritura utilizan formularios Django protegidos con
CSRF. Los endpoints CRUD no aceptan solicitudes `GET`.
