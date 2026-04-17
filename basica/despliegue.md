# Despliegue y prueba (parte básica)

Este documento explica como levantar, probar y parar la demo básica (PostgreSQL + web Node/TypeScript).

## Requisitos

- Docker
- Docker Compose (plugin `docker compose`)

## Levantar el proyecto

Desde la carpeta `basica`:

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

## URLs de prueba

- Interfaz web: [http://localhost:3000](http://localhost:3000)
- Healthcheck: [http://localhost:3000/health](http://localhost:3000/health)

## Probar conexion a PostgreSQL

```bash
docker exec -it l2a-basica-postgres psql -U appuser -d elearning
```

Dentro de `psql` puedes validar:

```sql
\dt
SELECT slug, titulo FROM cursos;
SELECT slug, "nombreMostrado" FROM autores;
```

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
