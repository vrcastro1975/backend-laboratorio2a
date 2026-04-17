INSERT INTO categorias (id, slug, nombre) VALUES
  ('00000000-0000-0000-0000-000000000101', 'frontend', 'Front End'),
  ('00000000-0000-0000-0000-000000000102', 'backend', 'Backend'),
  ('00000000-0000-0000-0000-000000000103', 'devops', 'DevOps')
ON CONFLICT DO NOTHING;

INSERT INTO tematicas (id, slug, nombre) VALUES
  ('10000000-0000-0000-0000-000000000101', 'frontend', 'Front End'),
  ('10000000-0000-0000-0000-000000000102', 'backend', 'Backend'),
  ('10000000-0000-0000-0000-000000000103', 'devops', 'DevOps')
ON CONFLICT DO NOTHING;

INSERT INTO autores (id, slug, "nombreMostrado", "bioCorta", "urlAvatar") VALUES
  ('20000000-0000-0000-0000-000000000101', 'daniel-sanchez', 'Daniel Sanchez', 'Autor especializado en Front End.', 'https://cdn.example.com/autores/daniel.png'),
  ('20000000-0000-0000-0000-000000000102', 'laura-martin', 'Laura Martin', 'Ingeniera backend y arquitecta de APIs.', 'https://cdn.example.com/autores/laura.png')
ON CONFLICT DO NOTHING;

INSERT INTO cursos (id, slug, titulo, "descripcionCorta", "idCategoria", "idContenidoCursoCms", "publicadoEn") VALUES
  ('30000000-0000-0000-0000-000000000101', 'introduccion-react', 'Introduccion a React', 'Curso base de React con TypeScript.', '00000000-0000-0000-0000-000000000101', 'cms-curso-react-001', now()),
  ('30000000-0000-0000-0000-000000000102', 'backend-nodejs-api', 'Backend Node.js API', 'Curso de diseño e implementacion de APIs.', '00000000-0000-0000-0000-000000000102', 'cms-curso-node-001', now())
ON CONFLICT DO NOTHING;

INSERT INTO cursos_autores ("idCurso", "idAutor", rol) VALUES
  ('30000000-0000-0000-0000-000000000101', '20000000-0000-0000-0000-000000000101', 'autor'),
  ('30000000-0000-0000-0000-000000000102', '20000000-0000-0000-0000-000000000102', 'autor')
ON CONFLICT DO NOTHING;

INSERT INTO videos (
  id, "idCurso", "idAutor", "idTematica", orden, slug, titulo, resumen,
  "idRecursoVideo", "idContenidoArticuloCms", "duracionSeg", "estaPublicado", "publicadoEn"
) VALUES
  ('40000000-0000-0000-0000-000000000101', '30000000-0000-0000-0000-000000000101', '20000000-0000-0000-0000-000000000101', '10000000-0000-0000-0000-000000000101', 1, 'base', 'Base de React', 'Introduccion al ecosistema.', 's3://videos/react/base.mp4', 'cms-art-react-base', 600, true, now()),
  ('40000000-0000-0000-0000-000000000102', '30000000-0000-0000-0000-000000000102', '20000000-0000-0000-0000-000000000102', '10000000-0000-0000-0000-000000000102', 1, 'arquitectura-api', 'Arquitectura API', 'Diseño por capas.', 's3://videos/node/api.mp4', 'cms-art-node-api', 900, true, now())
ON CONFLICT DO NOTHING;

INSERT INTO articulos (
  id, "idCurso", "idAutor", orden, slug, titulo, resumen,
  "idRecursoArticulo", "idContenidoArticuloCms", "numeroPag", "publicadoEn"
) VALUES
  ('50000000-0000-0000-0000-000000000101', '30000000-0000-0000-0000-000000000101', '20000000-0000-0000-0000-000000000101', 1, 'guia-react', 'Guia React', 'Material de apoyo en PDF.', 's3://articulos/react/guia.pdf', 'cms-art-react-guia', 15, now()),
  ('50000000-0000-0000-0000-000000000102', '30000000-0000-0000-0000-000000000102', '20000000-0000-0000-0000-000000000102', 1, 'checklist-api', 'Checklist API', 'Checklist de buenas practicas.', 's3://articulos/node/checklist.pdf', 'cms-art-node-check', 10, now())
ON CONFLICT DO NOTHING;
