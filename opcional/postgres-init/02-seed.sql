INSERT INTO arbol_categorias (id, slug, nombre, profundidad) VALUES
  ('00000000-0000-0000-0000-000000000001', 'frontend', 'Front End', 0),
  ('00000000-0000-0000-0000-000000000002', 'react', 'React', 1),
  ('00000000-0000-0000-0000-000000000003', 'backend', 'Backend', 0),
  ('00000000-0000-0000-0000-000000000004', 'nodejs', 'Node.js', 1),
  ('00000000-0000-0000-0000-000000000005', 'devops', 'DevOps', 0)
ON CONFLICT DO NOTHING;

UPDATE arbol_categorias SET "idCategoriaPadre" = '00000000-0000-0000-0000-000000000001', "rutaSlug" = 'frontend/react' WHERE id = '00000000-0000-0000-0000-000000000002';
UPDATE arbol_categorias SET "idCategoriaPadre" = '00000000-0000-0000-0000-000000000003', "rutaSlug" = 'backend/nodejs' WHERE id = '00000000-0000-0000-0000-000000000004';

INSERT INTO arbol_categorias (id, slug, nombre, profundidad) VALUES
  ('00000000-0000-0000-0000-000000000006', 'angular', 'Angular', 1),
  ('00000000-0000-0000-0000-000000000007', 'testing', 'Testing', 2),
  ('00000000-0000-0000-0000-000000000008', 'docker', 'Docker', 1),
  ('00000000-0000-0000-0000-000000000009', 'serverless', 'Serverless', 1),
  ('00000000-0000-0000-0000-00000000000a', 'mongo', 'MongoDB', 1),
  ('00000000-0000-0000-0000-00000000000b', 'express', 'Express', 2)
ON CONFLICT DO NOTHING;

UPDATE arbol_categorias SET "idCategoriaPadre" = '00000000-0000-0000-0000-000000000001', "rutaSlug" = 'frontend/angular', profundidad = 1 WHERE id = '00000000-0000-0000-0000-000000000006';
UPDATE arbol_categorias SET "idCategoriaPadre" = '00000000-0000-0000-0000-000000000002', "rutaSlug" = 'frontend/react/testing', profundidad = 2 WHERE id = '00000000-0000-0000-0000-000000000007';
UPDATE arbol_categorias SET "idCategoriaPadre" = '00000000-0000-0000-0000-000000000005', "rutaSlug" = 'devops/docker', profundidad = 1 WHERE id = '00000000-0000-0000-0000-000000000008';
UPDATE arbol_categorias SET "idCategoriaPadre" = '00000000-0000-0000-0000-000000000005', "rutaSlug" = 'devops/serverless', profundidad = 1 WHERE id = '00000000-0000-0000-0000-000000000009';
UPDATE arbol_categorias SET "idCategoriaPadre" = '00000000-0000-0000-0000-000000000003', "rutaSlug" = 'backend/mongo', profundidad = 1 WHERE id = '00000000-0000-0000-0000-00000000000a';
UPDATE arbol_categorias SET "idCategoriaPadre" = '00000000-0000-0000-0000-000000000004', "rutaSlug" = 'backend/nodejs/express', profundidad = 2 WHERE id = '00000000-0000-0000-0000-00000000000b';

INSERT INTO tematicas (id, slug, nombre) VALUES
  ('10000000-0000-0000-0000-000000000001', 'frontend', 'Front End'),
  ('10000000-0000-0000-0000-000000000002', 'backend', 'Backend'),
  ('10000000-0000-0000-0000-000000000003', 'devops', 'DevOps')
ON CONFLICT DO NOTHING;

INSERT INTO autores (id, slug, "nombreMostrado", "bioCorta", "urlAvatar") VALUES
  ('20000000-0000-0000-0000-000000000001', 'daniel-sanchez', 'Daniel Sanchez', 'Autor especializado en Front End.', 'https://cdn.example.com/autores/daniel.png'),
  ('20000000-0000-0000-0000-000000000002', 'laura-martin', 'Laura Martin', 'Ingeniera backend y arquitecta de APIs.', 'https://cdn.example.com/autores/laura.png')
ON CONFLICT DO NOTHING;

INSERT INTO cursos (id, slug, titulo, "descripcionCorta", "idCategoria", "idContenidoCursoCms", "esPublico", "publicadoEn") VALUES
  ('30000000-0000-0000-0000-000000000001', 'introduccion-react', 'Introduccion a React', 'Curso base de React con TypeScript.', '00000000-0000-0000-0000-000000000002', 'cms-curso-react-001', true, now()),
  ('30000000-0000-0000-0000-000000000002', 'backend-nodejs-api', 'Backend Node.js API', 'Curso de diseño e implementacion de APIs.', '00000000-0000-0000-0000-000000000004', 'cms-curso-node-001', false, now())
ON CONFLICT DO NOTHING;

INSERT INTO cursos_autores ("idCurso", "idAutor", rol) VALUES
  ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'autor'),
  ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 'autor')
ON CONFLICT DO NOTHING;

INSERT INTO videos (
  id, "idCurso", "idAutor", "idTematica", orden, slug, titulo, resumen,
  "idRecursoVideo", "idContenidoArticuloCms", "duracionSeg",
  "nivelAcceso", "esPublico", "estaPublicado", "publicadoEn", "vistasCache"
) VALUES
  ('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 1, 'base', 'Base de React', 'Introduccion al ecosistema.', 's3://videos/react/base.mp4', 'cms-art-react-base', 600, 'public', true, true, now(), 1200),
  ('40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 1, 'arquitectura-api', 'Arquitectura API', 'Diseño por capas.', 's3://videos/node/api.mp4', 'cms-art-node-api', 900, 'subscribers', false, true, now(), 800),
  ('40000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 2, 'testing-react', 'Testing en React', 'Pruebas e2e y unitarias.', 's3://videos/react/testing.mp4', 'cms-art-react-test', 720, 'subscribers', false, true, now(), 400)
ON CONFLICT DO NOTHING;

INSERT INTO articulos (
  id, "idCurso", "idAutor", orden, slug, titulo, resumen,
  "idRecursoArticulo", "idContenidoArticuloCms", "numeroPag",
  "nivelAcceso", "esPublico", "publicadoEn", "vistasCache"
) VALUES
  ('50000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 1, 'guia-react', 'Guia React', 'Material de apoyo en PDF.', 's3://articulos/react/guia.pdf', 'cms-art-react-guia', 15, 'public', true, now(), 300),
  ('50000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 1, 'checklist-api', 'Checklist API', 'Checklist de buenas practicas.', 's3://articulos/node/checklist.pdf', 'cms-art-node-check', 10, 'subscribers', false, now(), 120)
ON CONFLICT DO NOTHING;

INSERT INTO usuarios (id, email, "nombreMostrado", "passwordHash") VALUES
  ('60000000-0000-0000-0000-000000000001', 'alumno1@example.com', 'Alumno Uno', 'hash-demo-1'),
  ('60000000-0000-0000-0000-000000000002', 'alumno2@example.com', 'Alumno Dos', 'hash-demo-2')
ON CONFLICT DO NOTHING;

INSERT INTO suscripciones (id, "idUsuario", plan, estado, "iniciaEn", "terminaEn") VALUES
  ('70000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000001', 'monthly', 'active', now(), now() + interval '30 day')
ON CONFLICT DO NOTHING;

INSERT INTO usuarios_cursos ("idUsuario", "idCurso", "compradoEn", importe, moneda) VALUES
  ('60000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', now(), 49.00, 'EUR')
ON CONFLICT DO NOTHING;

INSERT INTO tags (id, slug, nombre) VALUES
  ('80000000-0000-0000-0000-000000000001', 'typescript', 'TypeScript'),
  ('80000000-0000-0000-0000-000000000002', 'api', 'API')
ON CONFLICT DO NOTHING;

INSERT INTO cursos_tags ("idCurso", "idTag") VALUES
  ('30000000-0000-0000-0000-000000000001', '80000000-0000-0000-0000-000000000001'),
  ('30000000-0000-0000-0000-000000000002', '80000000-0000-0000-0000-000000000002')
ON CONFLICT DO NOTHING;

INSERT INTO videos_tags ("idVideo", "idTag") VALUES
  ('40000000-0000-0000-0000-000000000001', '80000000-0000-0000-0000-000000000001'),
  ('40000000-0000-0000-0000-000000000002', '80000000-0000-0000-0000-000000000002'),
  ('40000000-0000-0000-0000-000000000003', '80000000-0000-0000-0000-000000000001')
ON CONFLICT DO NOTHING;

INSERT INTO progreso_usuario_video ("idUsuario", "idVideo", "progresoPorcentaje", "ultimoSegundo", completado, "actualizadoEn") VALUES
  ('60000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 60, 360, false, now()),
  ('60000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000003', 25, 180, false, now()),
  ('60000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000002', 100, 900, true, now())
ON CONFLICT DO NOTHING;

INSERT INTO vistas_diarias_video ("idVideo", dia, vistas) VALUES
  ('40000000-0000-0000-0000-000000000001', current_date, 220),
  ('40000000-0000-0000-0000-000000000002', current_date, 140),
  ('40000000-0000-0000-0000-000000000003', current_date, 55)
ON CONFLICT DO NOTHING;
