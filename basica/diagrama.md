# Diagrama relacional (básica) - DBML

Pega este contenido en [dbdiagram.io](https://dbdiagram.io/) para visualizar el modelo.

```dbml
Table cursos {
  id uuid [pk]
  slug varchar(150) [not null, unique]
  titulo varchar(200) [not null]
  descripcionCorta text [not null]
  idCategoria uuid [not null]
  idContenidoCursoCms varchar(150) [not null, note: 'GUID/ID en CMS externo']
  publicadoEn timestamp
  creadoEn timestamp [not null]
  actualizadoEn timestamp
}

Table autores {
  id uuid [pk]
  slug varchar(150) [not null, unique]
  nombreMostrado varchar(150) [not null]
  bioCorta text
  urlAvatar text
  creadoEn timestamp [not null]
  actualizadoEn timestamp
}

Table categorias {
  id uuid [pk]
  slug varchar(120) [not null, unique]
  nombre varchar(120) [not null]
  creadoEn timestamp [not null]
  actualizadoEn timestamp
}

Table tematicas {
  id uuid [pk]
  slug varchar(120) [not null, unique]
  nombre varchar(120) [not null]
  creadoEn timestamp [not null]
  actualizadoEn timestamp
}

Table cursos_autores {
  idCurso uuid [not null]
  idAutor uuid [not null]
  rol varchar(50) [not null, default: 'autor']
  creadoEn timestamp [not null]

  indexes {
    (idCurso, idAutor) [pk]
  }
}

Table videos {
  id uuid [pk]
  idCurso uuid [not null]
  idAutor uuid [not null]
  idTematica uuid [not null]
  orden int [not null]
  slug varchar(150) [not null]
  titulo varchar(200) [not null]
  resumen text
  idRecursoVideo varchar(200) [not null, note: 'GUID/URL en S3/CDN']
  idContenidoArticuloCms varchar(200) [not null, note: 'GUID/ID en CMS']
  duracionSeg int
  estaPublicado boolean [not null, default: true]
  publicadoEn timestamp
  creadoEn timestamp [not null]
  actualizadoEn timestamp

  indexes {
    (idCurso, slug) [unique]
    (idCurso, orden) [unique]
  }
}

Table articulos {
  id uuid [pk]
  idCurso uuid [not null]
  idAutor uuid [not null]
  orden int [not null]
  slug varchar(150) [not null]
  titulo varchar(200) [not null]
  resumen text
  idRecursoArticulo varchar(200) [not null, note: 'GUID/URL en S3']
  idContenidoArticuloCms varchar(200) [not null, note: 'GUID/ID en CMS']
  numeroPag int
  publicadoEn timestamp
  creadoEn timestamp [not null]
  actualizadoEn timestamp

  indexes {
    (idCurso, slug) [unique]
    (idCurso, orden) [unique]
  }
}

Ref: cursos.idCategoria > categorias.id
Ref: cursos_autores.idCurso > cursos.id
Ref: cursos_autores.idAutor > autores.id

Ref: videos.idCurso > cursos.id
Ref: videos.idAutor > autores.id
Ref: videos.idTematica > tematicas.id

Ref: articulos.idCurso > cursos.id
Ref: articulos.idAutor > autores.id
```
