# Laboratorio 2A - Modelado relacional (Parte básica)

## Por qué se ha realizado este modelado
Este modelado relacional se ha diseñado para priorizar los escenarios de lectura que marca el enunciado:

- Listado de cursos y navegación por área.
- Detalle de curso con sus vídeos y artículos.
- Página de lección mostrando autor.
- Página de autor con biografía.

Además, se han respetado las reglas funcionales indicadas:

- Un curso está compuesto por vídeos y artículos.
- Un vídeo pertenece a un único curso en esta versión.
- Un vídeo tiene un único autor.
- Un curso puede tener varios autores.
- Los recursos pesados se almacenan fuera de base de datos (S3/CMS), guardando solo identificadores.

La estructura de tablas permite integridad referencial clara con claves primarias y foráneas, y facilita consultas SQL mantenibles.

## Patrones aplicados y razonamiento

### 1) Entidad principal (`cursos`) con detalle 1:M
Patrón aplicado: **cabecera-detalle**.

Razón:
- `videos` y `articulos` dependen funcionalmente de `cursos`.
- Se modela de forma natural la composición de un curso.
- Permite orden estable por `orden` dentro de cada curso.

### 2) Relación muchos a muchos con tabla puente
Patrón aplicado: **tabla intermedia** (`cursos_autores`).

Razón:
- Resuelve correctamente la relación M:M entre cursos y autores.
- Evita duplicidades y simplifica extensiones (rol, fechas, etc.).
- Sigue la convención de modelado relacional clásica.

### 3) Catálogos normalizados
Patrón aplicado: **tablas de referencia** (`categorias`, `tematicas`).

Razón:
- Evita texto libre repetido y posibles inconsistencias.
- Facilita filtros, búsquedas y evolución del catálogo.
- Permite enlazar por FK desde `cursos` y `videos`.

### 4) Referencias a recursos externos
Patrón aplicado: **persistencia por identificador externo**.

Razón:
- El contenido real vive en S3/CMS.
- En PostgreSQL solo se guardan ids/urls de integración.
- Se reduce tamaño y complejidad de almacenamiento interno.

### 5) Restricciones de unicidad por contexto
Patrón aplicado: **unique compuestos** en detalle.

Razón:
- `unique (idCurso, slug)` y `unique (idCurso, orden)` en `videos` y `articulos`.
- Evita colisiones de rutas/orden dentro de un mismo curso.
- Garantiza consistencia en navegación y renderizado.

## Nota

El diagrama físico (DBML para dbdiagram.io) está en el fichero `diagrama.md` de esta carpeta.
El diagrama conceptual de Chen está en `chen.md`.
La ejecución de PostgreSQL + demo web para la parte básica está documentada en `despliegue.md`.

## Ejecución del entorno con Docker Compose

Desde la carpeta `basica`:

```bash
docker compose up -d --build
```

Con esto levantas PostgreSQL + demo web.

Para operar y validar:
- Interfaz web: `http://localhost:3000`
- Healthcheck: `http://localhost:3000/health`
- Consola SQL: `docker exec -it l2a-basica-postgres psql -U appuser -d elearning`

Para parar el entorno:

```bash
docker compose down
```

Para reinicializar desde cero (incluyendo datos seed):

```bash
docker compose down -v
docker compose up -d --build
```

## Cómo visualizar los diagramas

### 1) Modelo físico (DBML)

1. Abrir [https://dbdiagram.io](https://dbdiagram.io).
2. Crear un diagrama nuevo.
3. Copiar y pegar el bloque DBML del fichero `diagrama.md`.

### 2) Modelo conceptual (Chen con Mermaid)

1. Abrir [https://mermaid.live](https://mermaid.live).
2. Borrar el ejemplo que aparece por defecto.
3. Copiar y pegar el bloque `flowchart` del fichero `chen.md`.
4. El diagrama se renderiza automáticamente en el panel derecho.
