# Diagrama de Chen (parte básica)

El modelo de Chen representa el nivel conceptual:
- **Entidades** (rectángulos)
- **Atributos** (óvalos)
- **Relaciones** (rombos)

```mermaid
flowchart LR
  %% Entidades
  CURSOS[CURSOS]
  AUTORES[AUTORES]
  CATEGORIAS[CATEGORIAS]
  TEMATICAS[TEMATICAS]
  VIDEOS[VIDEOS]
  ARTICULOS[ARTICULOS]

  %% Relaciones (rombos)
  R1{CLASIFICA}
  R2{TIENE_VIDEO}
  R3{TIENE_ARTICULO}
  R4{CREA_VIDEO}
  R5{CREA_ARTICULO}
  R6{SE_CLASIFICA_EN}
  R7{PARTICIPA_EN}

  %% Atributos principales
  c_id((id))
  c_slug((slug))
  c_titulo((titulo))
  c_desc((descripcionCorta))
  c_cms((idContenidoCursoCms))

  a_id((id))
  a_slug((slug))
  a_nombre((nombreMostrado))
  a_bio((bioCorta))

  cat_id((id))
  cat_slug((slug))
  cat_nombre((nombre))

  t_id((id))
  t_slug((slug))
  t_nombre((nombre))

  v_id((id))
  v_slug((slug))
  v_titulo((titulo))
  v_orden((orden))
  v_recurso((idRecursoVideo))

  ar_id((id))
  ar_slug((slug))
  ar_titulo((titulo))
  ar_orden((orden))
  ar_recurso((idRecursoArticulo))

  %% Conexiones entidad-atributo
  CURSOS --- c_id
  CURSOS --- c_slug
  CURSOS --- c_titulo
  CURSOS --- c_desc
  CURSOS --- c_cms

  AUTORES --- a_id
  AUTORES --- a_slug
  AUTORES --- a_nombre
  AUTORES --- a_bio

  CATEGORIAS --- cat_id
  CATEGORIAS --- cat_slug
  CATEGORIAS --- cat_nombre

  TEMATICAS --- t_id
  TEMATICAS --- t_slug
  TEMATICAS --- t_nombre

  VIDEOS --- v_id
  VIDEOS --- v_slug
  VIDEOS --- v_titulo
  VIDEOS --- v_orden
  VIDEOS --- v_recurso

  ARTICULOS --- ar_id
  ARTICULOS --- ar_slug
  ARTICULOS --- ar_titulo
  ARTICULOS --- ar_orden
  ARTICULOS --- ar_recurso

  %% Conexiones entidad-relacion-entidad
  CURSOS --- R1 --- CATEGORIAS
  CURSOS --- R2 --- VIDEOS
  CURSOS --- R3 --- ARTICULOS
  AUTORES --- R4 --- VIDEOS
  AUTORES --- R5 --- ARTICULOS
  VIDEOS --- R6 --- TEMATICAS
  AUTORES --- R7 --- CURSOS
```

## Cardinalidades (lectura de Chen)

- `CATEGORIAS 1:N CURSOS`
- `CURSOS 1:N VIDEOS`
- `CURSOS 1:N ARTICULOS`
- `AUTORES 1:N VIDEOS`
- `AUTORES 1:N ARTICULOS`
- `TEMATICAS 1:N VIDEOS`
- `AUTORES N:M CURSOS` (en físico se resuelve con `cursos_autores`)
