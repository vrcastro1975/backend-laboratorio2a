# Diagrama relacional (opcional) - DBML

Pega este contenido en [dbdiagram.io](https://dbdiagram.io/) para visualizar el modelo.

```dbml
Table cursos {
  id uuid [pk]
  slug varchar(150) [not null, unique]
  titulo varchar(200) [not null]
  descripcionCorta text [not null]
  idCategoria uuid [not null]
  idContenidoCursoCms varchar(150) [not null]
  esPublico boolean [not null, default: false]
  publicadoEn timestamp
  creadoEn timestamp [not null]
  actualizadoEn timestamp
}

Table arbol_categorias {
  id uuid [pk]
  slug varchar(120) [not null, unique]
  nombre varchar(120) [not null]
  idCategoriaPadre uuid
  profundidad int [not null, default: 0]
  rutaSlug varchar(300)
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

Table autores {
  id uuid [pk]
  slug varchar(150) [not null, unique]
  nombreMostrado varchar(150) [not null]
  bioCorta text
  urlAvatar text
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
  idRecursoVideo varchar(200) [not null]
  idContenidoArticuloCms varchar(200) [not null]
  duracionSeg int
  nivelAcceso varchar(30) [not null, default: 'public']
  esPublico boolean [not null, default: false]
  estaPublicado boolean [not null, default: true]
  publicadoEn timestamp
  vistasCache int [not null, default: 0]
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
  idRecursoArticulo varchar(200) [not null]
  idContenidoArticuloCms varchar(200) [not null]
  numeroPag int
  nivelAcceso varchar(30) [not null, default: 'public']
  esPublico boolean [not null, default: false]
  publicadoEn timestamp
  vistasCache int [not null, default: 0]
  creadoEn timestamp [not null]
  actualizadoEn timestamp

  indexes {
    (idCurso, slug) [unique]
    (idCurso, orden) [unique]
  }
}

Table usuarios {
  id uuid [pk]
  email varchar(180) [not null, unique]
  nombreMostrado varchar(120) [not null]
  passwordHash varchar(255) [not null]
  creadoEn timestamp [not null]
  actualizadoEn timestamp
}

Table suscripciones {
  id uuid [pk]
  idUsuario uuid [not null]
  plan varchar(30) [not null]
  estado varchar(20) [not null]
  iniciaEn timestamp [not null]
  terminaEn timestamp [not null]
  creadoEn timestamp [not null]
}

Table usuarios_cursos {
  idUsuario uuid [not null]
  idCurso uuid [not null]
  compradoEn timestamp [not null]
  importe decimal(10,2) [not null]
  moneda char(3) [not null, default: 'EUR']

  indexes {
    (idUsuario, idCurso) [pk]
  }
}

Table tags {
  id uuid [pk]
  slug varchar(120) [not null, unique]
  nombre varchar(120) [not null]
}

Table cursos_tags {
  idCurso uuid [not null]
  idTag uuid [not null]
  indexes {
    (idCurso, idTag) [pk]
  }
}

Table videos_tags {
  idVideo uuid [not null]
  idTag uuid [not null]
  indexes {
    (idVideo, idTag) [pk]
  }
}

Table progreso_usuario_video {
  idUsuario uuid [not null]
  idVideo uuid [not null]
  progresoPorcentaje int [not null, default: 0]
  ultimoSegundo int [not null, default: 0]
  completado boolean [not null, default: false]
  actualizadoEn timestamp [not null]

  indexes {
    (idUsuario, idVideo) [pk]
  }
}

Table vistas_diarias_video {
  idVideo uuid [not null]
  dia date [not null]
  vistas int [not null, default: 0]

  indexes {
    (idVideo, dia) [pk]
  }
}

Ref: cursos.idCategoria > arbol_categorias.id
Ref: arbol_categorias.idCategoriaPadre > arbol_categorias.id
Ref: cursos_autores.idCurso > cursos.id
Ref: cursos_autores.idAutor > autores.id
Ref: videos.idCurso > cursos.id
Ref: videos.idAutor > autores.id
Ref: videos.idTematica > tematicas.id
Ref: articulos.idCurso > cursos.id
Ref: articulos.idAutor > autores.id
Ref: suscripciones.idUsuario > usuarios.id
Ref: usuarios_cursos.idUsuario > usuarios.id
Ref: usuarios_cursos.idCurso > cursos.id
Ref: cursos_tags.idCurso > cursos.id
Ref: cursos_tags.idTag > tags.id
Ref: videos_tags.idVideo > videos.id
Ref: videos_tags.idTag > tags.id
Ref: progreso_usuario_video.idUsuario > usuarios.id
Ref: progreso_usuario_video.idVideo > videos.id
Ref: vistas_diarias_video.idVideo > videos.id
```
