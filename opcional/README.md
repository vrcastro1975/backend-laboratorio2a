# Laboratorio 2A - Modelado relacional (Parte opcional)

## Por qué se ha realizado este modelado
La ampliación opcional extiende el modelo base para cubrir escenarios de negocio más avanzados sin perder claridad en el diseño relacional:

- Jerarquía de áreas y subáreas.
- Contenido público y contenido restringido.
- Monetización por suscripción y compra puntual.
- Métricas de progreso y visualizaciones.

Se ha mantenido continuidad estructural con la parte básica para que el modelo sea coherente, escalable y fácil de implementar en PostgreSQL.

## Patrones aplicados y razonamiento

### 1) Jerarquía de categorías
Patrón aplicado: **árbol por autorrelación**.

Razón:
- `arbol_categorias.idCategoriaPadre -> arbol_categorias.id` permite modelar ramas como `Front End > React > Testing`.
- Escala mejor que un único nivel plano de categorías.
- Facilita navegación por ramas y filtros jerárquicos.

### 2) Control de acceso a nivel de contenido
Patrón aplicado: **metadatos de acceso por fila**.

Razón:
- `cursos.esPublico`, `videos.nivelAcceso` y `articulos.nivelAcceso` permiten combinar contenido abierto y restringido.
- Cubre los escenarios de curso 100% público y curso mixto.
- Evita separar en tablas duplicadas por visibilidad.

### 3) Monetización híbrida
Patrón aplicado: **separación de modelos de acceso**.

Razón:
- `suscripciones` gestiona acceso recurrente.
- `usuarios_cursos` gestiona compra puntual por curso.
- Permite reglas claras de autorización y auditoría de acceso.

### 4) Búsqueda flexible con tags
Patrón aplicado: **N:M con tablas puente** (`cursos_tags`, `videos_tags`).

Razón:
- Permite etiquetado múltiple en curso y vídeo.
- Mejora descubrimiento y filtrado temático.
- Mantiene normalización e integridad relacional.

### 5) Analítica y progreso no tiempo real
Patrón aplicado: **preagregación y tracking**.

Razón:
- `vistas_diarias_video` para estadísticas agregadas.
- `progreso_usuario_video` para avance de alumno.
- Reduce coste de cálculo en lectura respecto a agregaciones en caliente.

## Demo opcional con Node + TypeScript y PostgreSQL

Además del modelado, esta carpeta incluye una demo práctica muy parecida a la del laboratorio 1A:

- Base de datos PostgreSQL con esquema y seed automáticos.
- API + servidor HTTP en Node/TypeScript (sin Express).
- Interfaz web simple para validar home, cursos por área, detalle de curso y autor.

Para instrucciones completas de arranque, verificación y parada, consulta `despliegue.md`.

## Nota

El diagrama físico (DBML para dbdiagram.io) está en el fichero `diagrama.md` de esta carpeta.
El diagrama conceptual de Chen está en `chen.md`.

## Ejecución del entorno con Docker Compose

Desde la carpeta `opcional`:

```bash
docker compose up -d --build
```

Con esto levantas PostgreSQL + demo web.

Para operar y validar:
- Interfaz web: `http://localhost:3000`
- Healthcheck: `http://localhost:3000/health`
- Consola SQL: `docker exec -it l2a-postgres psql -U appuser -d elearning`

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
