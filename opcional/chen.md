# Diagrama de Chen (parte opcional)

Este diagrama conceptual amplía la parte básica con:
- Jerarquía de categorías.
- Acceso público/privado.
- Suscripciones y compras.
- Tags, progreso y visualizaciones.

```mermaid
flowchart LR
  %% Entidades
  CURSOS[CURSOS]
  ARBOL[ARBOL_CATEGORIAS]
  AUTORES[AUTORES]
  TEMATICAS[TEMATICAS]
  VIDEOS[VIDEOS]
  ARTICULOS[ARTICULOS]
  USUARIOS[USUARIOS]
  SUSCRIPCIONES[SUSCRIPCIONES]
  USUARIOS_CURSOS[USUARIOS_CURSOS]
  TAGS[TAGS]
  PROGRESO[PROGRESO_USUARIO_VIDEO]
  VISTAS[VISTAS_DIARIAS_VIDEO]

  %% Relaciones (rombos)
  R1{PERTENECE_A}
  R2{SUBCATEGORIA_DE}
  R3{TIENE_VIDEO}
  R4{TIENE_ARTICULO}
  R5{CREA_VIDEO}
  R6{CREA_ARTICULO}
  R7{SE_CLASIFICA_EN}
  R8{PARTICIPA_EN}
  R9{SE_SUSCRIBE}
  R10{COMPRA}
  R11{ETIQUETA_CURSO}
  R12{ETIQUETA_VIDEO}
  R13{PROGRESA_EN}
  R14{ACUMULA_VISTAS}

  %% Atributos clave opcionales
  cur_pub((esPublico))
  vid_acc((nivelAcceso))
  art_acc((nivelAcceso))
  arb_padre((idCategoriaPadre))
  arb_ruta((rutaSlug))
  sub_plan((plan))
  sub_estado((estado))
  uc_importe((importe))
  prog_pct((progresoPorcentaje))
  vistas_num((vistas))

  CURSOS --- cur_pub
  VIDEOS --- vid_acc
  ARTICULOS --- art_acc
  ARBOL --- arb_padre
  ARBOL --- arb_ruta
  SUSCRIPCIONES --- sub_plan
  SUSCRIPCIONES --- sub_estado
  USUARIOS_CURSOS --- uc_importe
  PROGRESO --- prog_pct
  VISTAS --- vistas_num

  %% Conexiones principales
  CURSOS --- R1 --- ARBOL
  ARBOL --- R2 --- ARBOL
  CURSOS --- R3 --- VIDEOS
  CURSOS --- R4 --- ARTICULOS
  AUTORES --- R5 --- VIDEOS
  AUTORES --- R6 --- ARTICULOS
  VIDEOS --- R7 --- TEMATICAS
  AUTORES --- R8 --- CURSOS
  USUARIOS --- R9 --- SUSCRIPCIONES
  USUARIOS --- R10 --- CURSOS
  CURSOS --- R11 --- TAGS
  VIDEOS --- R12 --- TAGS
  USUARIOS --- R13 --- VIDEOS
  VIDEOS --- R14 --- VISTAS
```

## Cardinalidades (lectura de Chen)

- `ARBOL_CATEGORIAS 1:N CURSOS`
- `ARBOL_CATEGORIAS 1:N ARBOL_CATEGORIAS` (autorrelación padre-hijo)
- `CURSOS 1:N VIDEOS`
- `CURSOS 1:N ARTICULOS`
- `AUTORES 1:N VIDEOS`
- `AUTORES 1:N ARTICULOS`
- `AUTORES N:M CURSOS`
- `USUARIOS 1:N SUSCRIPCIONES`
- `USUARIOS N:M CURSOS` (compra puntual)
- `CURSOS N:M TAGS`
- `VIDEOS N:M TAGS`
- `USUARIOS N:M VIDEOS` (progreso)
- `VIDEOS 1:N VISTAS_DIARIAS_VIDEO`
