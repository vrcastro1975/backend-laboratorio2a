# Despliegue y prueba (parte opcional)

Este documento explica como levantar, probar y parar la demo opcional (PostgreSQL + web Node/TypeScript).

## Requisitos

- Docker
- Docker Compose (plugin `docker compose`)

## Levantar el proyecto

Desde la carpeta `opcional`:

```bash
docker compose up -d --build
```

Esto levanta:

- `postgres`: base de datos PostgreSQL
- `demo`: aplicacion web Node + TypeScript (sin Express)

## Probar que todo esta levantado

```bash
docker compose ps
```

Deberias ver ambos servicios en estado `Up`.

## Probar conexion a PostgreSQL

```bash
docker exec -it l2a-postgres psql -U appuser -d elearning
```

Una vez dentro de `psql` puedes validar, por ejemplo:

```sql
\dt
SELECT slug, titulo FROM cursos;
SELECT slug, "nombreMostrado" FROM autores;
```

## URLs de prueba

- Interfaz web: [http://localhost:3000](http://localhost:3000)
- Healthcheck: [http://localhost:3000/health](http://localhost:3000/health)

La interfaz carga datos de ejemplo sobre jerarquia de areas, tags, panel de alumno (suscripcion, compras, progreso, vistas diarias) y detalle de curso ampliado. Endpoints JSON utiles:

- [http://localhost:3000/api/arbol-categorias](http://localhost:3000/api/arbol-categorias)
- [http://localhost:3000/api/tags-nube](http://localhost:3000/api/tags-nube)
- [http://localhost:3000/api/usuarios](http://localhost:3000/api/usuarios)
- [http://localhost:3000/api/panel-demo?email=alumno1@example.com](http://localhost:3000/api/panel-demo?email=alumno1@example.com)

## Parar el proyecto

```bash
docker compose down
```

## Reinicializar esquema y datos de ejemplo

Los scripts de `postgres-init` solo se ejecutan al crear el volumen por primera vez.
Si quieres reconstruir desde cero:

```bash
docker compose down -v
docker compose up -d --build
```
