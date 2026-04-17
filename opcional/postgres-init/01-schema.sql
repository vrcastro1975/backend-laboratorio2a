CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE arbol_categorias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug varchar(120) NOT NULL UNIQUE,
  nombre varchar(120) NOT NULL,
  "idCategoriaPadre" uuid NULL,
  profundidad int NOT NULL DEFAULT 0,
  "rutaSlug" varchar(300),
  "creadoEn" timestamp NOT NULL DEFAULT now(),
  "actualizadoEn" timestamp
);

ALTER TABLE arbol_categorias
  ADD CONSTRAINT fk_arbol_categorias_padre
  FOREIGN KEY ("idCategoriaPadre") REFERENCES arbol_categorias(id);

CREATE TABLE tematicas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug varchar(120) NOT NULL UNIQUE,
  nombre varchar(120) NOT NULL,
  "creadoEn" timestamp NOT NULL DEFAULT now(),
  "actualizadoEn" timestamp
);

CREATE TABLE autores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug varchar(150) NOT NULL UNIQUE,
  "nombreMostrado" varchar(150) NOT NULL,
  "bioCorta" text,
  "urlAvatar" text,
  "creadoEn" timestamp NOT NULL DEFAULT now(),
  "actualizadoEn" timestamp
);

CREATE TABLE cursos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug varchar(150) NOT NULL UNIQUE,
  titulo varchar(200) NOT NULL,
  "descripcionCorta" text NOT NULL,
  "idCategoria" uuid NOT NULL REFERENCES arbol_categorias(id),
  "idContenidoCursoCms" varchar(150) NOT NULL,
  "esPublico" boolean NOT NULL DEFAULT false,
  "publicadoEn" timestamp,
  "creadoEn" timestamp NOT NULL DEFAULT now(),
  "actualizadoEn" timestamp
);

CREATE TABLE cursos_autores (
  "idCurso" uuid NOT NULL REFERENCES cursos(id),
  "idAutor" uuid NOT NULL REFERENCES autores(id),
  rol varchar(50) NOT NULL DEFAULT 'autor',
  "creadoEn" timestamp NOT NULL DEFAULT now(),
  PRIMARY KEY ("idCurso", "idAutor")
);

CREATE TABLE videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "idCurso" uuid NOT NULL REFERENCES cursos(id),
  "idAutor" uuid NOT NULL REFERENCES autores(id),
  "idTematica" uuid NOT NULL REFERENCES tematicas(id),
  orden int NOT NULL,
  slug varchar(150) NOT NULL,
  titulo varchar(200) NOT NULL,
  resumen text,
  "idRecursoVideo" varchar(200) NOT NULL,
  "idContenidoArticuloCms" varchar(200) NOT NULL,
  "duracionSeg" int,
  "nivelAcceso" varchar(30) NOT NULL DEFAULT 'public',
  "esPublico" boolean NOT NULL DEFAULT false,
  "estaPublicado" boolean NOT NULL DEFAULT true,
  "publicadoEn" timestamp,
  "vistasCache" int NOT NULL DEFAULT 0,
  "creadoEn" timestamp NOT NULL DEFAULT now(),
  "actualizadoEn" timestamp,
  UNIQUE ("idCurso", slug),
  UNIQUE ("idCurso", orden)
);

CREATE TABLE articulos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "idCurso" uuid NOT NULL REFERENCES cursos(id),
  "idAutor" uuid NOT NULL REFERENCES autores(id),
  orden int NOT NULL,
  slug varchar(150) NOT NULL,
  titulo varchar(200) NOT NULL,
  resumen text,
  "idRecursoArticulo" varchar(200) NOT NULL,
  "idContenidoArticuloCms" varchar(200) NOT NULL,
  "numeroPag" int,
  "nivelAcceso" varchar(30) NOT NULL DEFAULT 'public',
  "esPublico" boolean NOT NULL DEFAULT false,
  "publicadoEn" timestamp,
  "vistasCache" int NOT NULL DEFAULT 0,
  "creadoEn" timestamp NOT NULL DEFAULT now(),
  "actualizadoEn" timestamp,
  UNIQUE ("idCurso", slug),
  UNIQUE ("idCurso", orden)
);

CREATE TABLE usuarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email varchar(180) NOT NULL UNIQUE,
  "nombreMostrado" varchar(120) NOT NULL,
  "passwordHash" varchar(255) NOT NULL,
  "creadoEn" timestamp NOT NULL DEFAULT now(),
  "actualizadoEn" timestamp
);

CREATE TABLE suscripciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "idUsuario" uuid NOT NULL REFERENCES usuarios(id),
  plan varchar(30) NOT NULL,
  estado varchar(20) NOT NULL,
  "iniciaEn" timestamp NOT NULL,
  "terminaEn" timestamp NOT NULL,
  "creadoEn" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE usuarios_cursos (
  "idUsuario" uuid NOT NULL REFERENCES usuarios(id),
  "idCurso" uuid NOT NULL REFERENCES cursos(id),
  "compradoEn" timestamp NOT NULL,
  importe numeric(10,2) NOT NULL,
  moneda char(3) NOT NULL DEFAULT 'EUR',
  PRIMARY KEY ("idUsuario", "idCurso")
);

CREATE TABLE tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug varchar(120) NOT NULL UNIQUE,
  nombre varchar(120) NOT NULL
);

CREATE TABLE cursos_tags (
  "idCurso" uuid NOT NULL REFERENCES cursos(id),
  "idTag" uuid NOT NULL REFERENCES tags(id),
  PRIMARY KEY ("idCurso", "idTag")
);

CREATE TABLE videos_tags (
  "idVideo" uuid NOT NULL REFERENCES videos(id),
  "idTag" uuid NOT NULL REFERENCES tags(id),
  PRIMARY KEY ("idVideo", "idTag")
);

CREATE TABLE progreso_usuario_video (
  "idUsuario" uuid NOT NULL REFERENCES usuarios(id),
  "idVideo" uuid NOT NULL REFERENCES videos(id),
  "progresoPorcentaje" int NOT NULL DEFAULT 0,
  "ultimoSegundo" int NOT NULL DEFAULT 0,
  completado boolean NOT NULL DEFAULT false,
  "actualizadoEn" timestamp NOT NULL DEFAULT now(),
  PRIMARY KEY ("idUsuario", "idVideo")
);

CREATE TABLE vistas_diarias_video (
  "idVideo" uuid NOT NULL REFERENCES videos(id),
  dia date NOT NULL,
  vistas int NOT NULL DEFAULT 0,
  PRIMARY KEY ("idVideo", dia)
);
