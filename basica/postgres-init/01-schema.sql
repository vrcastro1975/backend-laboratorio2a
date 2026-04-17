CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE categorias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug varchar(120) NOT NULL UNIQUE,
  nombre varchar(120) NOT NULL,
  "creadoEn" timestamp NOT NULL DEFAULT now(),
  "actualizadoEn" timestamp
);

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
  "idCategoria" uuid NOT NULL REFERENCES categorias(id),
  "idContenidoCursoCms" varchar(150) NOT NULL,
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
  "estaPublicado" boolean NOT NULL DEFAULT true,
  "publicadoEn" timestamp,
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
  "publicadoEn" timestamp,
  "creadoEn" timestamp NOT NULL DEFAULT now(),
  "actualizadoEn" timestamp,
  UNIQUE ("idCurso", slug),
  UNIQUE ("idCurso", orden)
);
