import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { readFile } from "node:fs/promises";
import { join, extname } from "node:path";
import { Pool } from "pg";

const port = Number(process.env.PORT ?? 3000);
const pool = new Pool({
  host: process.env.DB_HOST ?? "postgres",
  port: Number(process.env.DB_PORT ?? 5432),
  user: process.env.DB_USER ?? "appuser",
  password: process.env.DB_PASSWORD ?? "apppass",
  database: process.env.DB_NAME ?? "elearning",
});

const publicDir = join(process.cwd(), "public");
const mimeTypes: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

const sendJson = (res: ServerResponse, statusCode: number, data: unknown) => {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(data));
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const ensureUniqueSlug = async (table: string, baseSlug: string) => {
  let slug = baseSlug;
  let i = 1;
  while (((await pool.query(`SELECT 1 FROM ${table} WHERE slug = $1`, [slug])).rowCount ?? 0) > 0) {
    slug = `${baseSlug}-${i}`;
    i += 1;
  }
  return slug;
};

const readBody = async (req: IncomingMessage): Promise<string> => {
  let body = "";
  for await (const chunk of req) body += chunk;
  return body;
};

const serveStatic = async (pathname: string, res: ServerResponse) => {
  try {
    const safePath = pathname === "/" ? "/index.html" : pathname;
    const filePath = join(publicDir, safePath);
    const content = await readFile(filePath);
    res.statusCode = 200;
    res.setHeader("Content-Type", mimeTypes[extname(filePath)] ?? "application/octet-stream");
    res.end(content);
    return true;
  } catch {
    return false;
  }
};

const server = createServer(async (req, res) => {
  try {
    if (!req.url) return sendJson(res, 404, { message: "No encontrado" });
    const url = new URL(req.url, `http://${req.headers.host ?? "localhost"}`);
    const pathname = url.pathname;

    if (pathname === "/health") return sendJson(res, 200, { ok: true });

    if (pathname === "/api/home" && req.method === "GET") {
      const { rows } = await pool.query(`
        SELECT ac_root.nombre AS categoria,
               c.slug AS "cursoSlug",
               c.titulo AS "cursoTitulo",
               v.slug AS "videoSlug",
               v.titulo AS "videoTitulo",
               v."publicadoEn"
        FROM videos v
        JOIN cursos c ON c.id = v."idCurso"
        JOIN arbol_categorias ac ON ac.id = c."idCategoria"
        LEFT JOIN arbol_categorias ac_root ON ac_root.slug = split_part(COALESCE(ac."rutaSlug", ac.slug), '/', 1)
        WHERE v."estaPublicado" = true
        ORDER BY categoria ASC, v."publicadoEn" DESC NULLS LAST
      `);
      const grouped = new Map<string, any[]>();
      for (const row of rows) {
        const key = row.categoria ?? "Sin categoria";
        if (!grouped.has(key)) grouped.set(key, []);
        const arr = grouped.get(key)!;
        if (arr.length < 5) arr.push(row);
      }
      return sendJson(res, 200, Array.from(grouped.entries()).map(([categoria, videos]) => ({ categoria, videos })));
    }

    if (pathname === "/api/categorias" && req.method === "GET") {
      const { rows } = await pool.query(
        `SELECT slug, nombre, profundidad FROM arbol_categorias ORDER BY profundidad ASC, nombre ASC`
      );
      return sendJson(res, 200, rows);
    }

    if (pathname === "/api/arbol-categorias" && req.method === "GET") {
      const { rows } = await pool.query(`
        WITH RECURSIVE tree AS (
          SELECT id, slug, nombre, "idCategoriaPadre", profundidad, "rutaSlug",
                 nombre::text AS "rutaLegible", 0 AS lvl
          FROM arbol_categorias
          WHERE "idCategoriaPadre" IS NULL
          UNION ALL
          SELECT c.id, c.slug, c.nombre, c."idCategoriaPadre", c.profundidad, c."rutaSlug",
                 tree."rutaLegible" || ' >> ' || c.nombre, tree.lvl + 1
          FROM arbol_categorias c
          JOIN tree ON c."idCategoriaPadre" = tree.id
        )
        SELECT id, slug, nombre, profundidad, "rutaSlug", "rutaLegible"
        FROM tree
        ORDER BY "rutaLegible" ASC
      `);
      return sendJson(res, 200, rows);
    }

    if (pathname === "/api/tags-nube" && req.method === "GET") {
      const { rows } = await pool.query(`
        SELECT t.slug, t.nombre,
          (SELECT COUNT(*)::int FROM cursos_tags ct WHERE ct."idTag" = t.id) AS "usosEnCursos",
          (SELECT COUNT(*)::int FROM videos_tags vt WHERE vt."idTag" = t.id) AS "usosEnVideos"
        FROM tags t
        ORDER BY t.nombre ASC
      `);
      return sendJson(res, 200, rows);
    }

    if (pathname === "/api/usuarios" && req.method === "GET") {
      const { rows } = await pool.query(
        `SELECT id, email, "nombreMostrado" FROM usuarios ORDER BY email ASC`
      );
      return sendJson(res, 200, rows);
    }

    if (pathname === "/api/panel-demo" && req.method === "GET") {
      const email = url.searchParams.get("email")?.trim();
      if (!email) return sendJson(res, 400, { message: "Parametro email obligatorio" });

      const uResult = await pool.query(
        `SELECT id, email, "nombreMostrado" FROM usuarios WHERE email = $1`,
        [email]
      );
      if ((uResult.rowCount ?? 0) === 0) return sendJson(res, 404, { message: "Usuario no encontrado" });
      const usuario = uResult.rows[0];

      const subResult = await pool.query(
        `
          SELECT plan, estado, "iniciaEn", "terminaEn"
          FROM suscripciones
          WHERE "idUsuario" = $1 AND estado = 'active' AND "terminaEn" > now()
          ORDER BY "terminaEn" DESC
          LIMIT 1
        `,
        [usuario.id]
      );

      const compras = await pool.query(
        `
          SELECT c.slug, c.titulo, uc."compradoEn", uc.importe, uc.moneda
          FROM usuarios_cursos uc
          JOIN cursos c ON c.id = uc."idCurso"
          WHERE uc."idUsuario" = $1
          ORDER BY uc."compradoEn" DESC
        `,
        [usuario.id]
      );

      const progreso = await pool.query(
        `
          SELECT c.slug AS "cursoSlug", c.titulo AS "cursoTitulo", v.slug AS "videoSlug", v.titulo AS "videoTitulo",
                 p."progresoPorcentaje", p."ultimoSegundo", p.completado, p."actualizadoEn"
          FROM progreso_usuario_video p
          JOIN videos v ON v.id = p."idVideo"
          JOIN cursos c ON c.id = v."idCurso"
          WHERE p."idUsuario" = $1
          ORDER BY c.titulo ASC, v.orden ASC
        `,
        [usuario.id]
      );

      const vistasDiarias = await pool.query(
        `
          SELECT v.slug AS "videoSlug", v.titulo AS "videoTitulo", c.slug AS "cursoSlug", c.titulo AS "cursoTitulo",
                 vd.dia, vd.vistas
          FROM vistas_diarias_video vd
          JOIN videos v ON v.id = vd."idVideo"
          JOIN cursos c ON c.id = v."idCurso"
          WHERE c.id IN (
            SELECT "idCurso" FROM usuarios_cursos WHERE "idUsuario" = $1
            UNION
            SELECT DISTINCT v2."idCurso"
            FROM progreso_usuario_video p
            JOIN videos v2 ON v2.id = p."idVideo"
            WHERE p."idUsuario" = $1
          )
          ORDER BY vd.dia DESC, c.titulo ASC, v.slug ASC
          LIMIT 40
        `,
        [usuario.id]
      );

      return sendJson(res, 200, {
        usuario: { email: usuario.email, nombreMostrado: usuario.nombreMostrado },
        suscripcionActiva: subResult.rows[0] ?? null,
        cursosComprados: compras.rows,
        progresoEnVideos: progreso.rows,
        vistasDiariasRecientes: vistasDiarias.rows,
      });
    }

    if (pathname === "/api/cursos" && req.method === "GET") {
      const categoria = url.searchParams.get("categoria");
      const params: unknown[] = [];
      let where = "";
      if (categoria) {
        params.push(categoria);
        where = `WHERE ac.slug = $1 OR ac."rutaSlug" LIKE $1 || '/%'`;
      }
      const { rows } = await pool.query(
        `
          SELECT c.slug, c.titulo, c."descripcionCorta", c."publicadoEn", c."esPublico",
                 ac.nombre AS categoria,
                 cat_path.path AS "categoriaRutaLegible"
          FROM cursos c
          JOIN arbol_categorias ac ON ac.id = c."idCategoria"
          LEFT JOIN LATERAL (
            WITH RECURSIVE anc AS (
              SELECT id, nombre, "idCategoriaPadre", 0 AS lvl FROM arbol_categorias WHERE id = ac.id
              UNION ALL
              SELECT p.id, p.nombre, p."idCategoriaPadre", anc.lvl + 1
              FROM arbol_categorias p
              INNER JOIN anc ON p.id = anc."idCategoriaPadre"
            )
            SELECT string_agg(nombre, ' >> ' ORDER BY lvl DESC) AS path FROM anc
          ) cat_path ON TRUE
          ${where}
          ORDER BY c."publicadoEn" DESC NULLS LAST, c.titulo ASC
        `,
        params
      );
      return sendJson(res, 200, rows);
    }

    if (pathname === "/api/cursos" && req.method === "POST") {
      const payload = JSON.parse((await readBody(req)) || "{}");
      const titulo = String(payload.titulo ?? "").trim();
      const descripcionCorta = String(payload.descripcionCorta ?? "").trim();
      const categoriaSlug = String(payload.categoriaSlug ?? "").trim();
      const autorSlug = String(payload.autorSlug ?? "").trim();
      const esPublico = Boolean(payload.esPublico);

      if (!titulo || !descripcionCorta || !categoriaSlug || !autorSlug) {
        return sendJson(res, 400, { message: "Faltan campos obligatorios" });
      }

      const categoria = await pool.query(`SELECT id FROM arbol_categorias WHERE slug = $1`, [categoriaSlug]);
      if (categoria.rowCount === 0) return sendJson(res, 400, { message: "Categoria no valida" });

      const autor = await pool.query(`SELECT id FROM autores WHERE slug = $1`, [autorSlug]);
      if (autor.rowCount === 0) return sendJson(res, 400, { message: "Autor no valido" });

      const slug = await ensureUniqueSlug("cursos", slugify(titulo));
      const insert = await pool.query(
        `INSERT INTO cursos (slug, titulo, "descripcionCorta", "idCategoria", "idContenidoCursoCms", "esPublico", "publicadoEn", "creadoEn")
         VALUES ($1,$2,$3,$4,$5,$6,now(),now()) RETURNING id`,
        [slug, titulo, descripcionCorta, categoria.rows[0].id, `cms-auto-${slug}`, esPublico]
      );

      await pool.query(`INSERT INTO cursos_autores ("idCurso", "idAutor", rol, "creadoEn") VALUES ($1,$2,'autor',now())`, [
        insert.rows[0].id,
        autor.rows[0].id,
      ]);

      return sendJson(res, 201, { slug, message: "Curso creado" });
    }

    if (pathname.startsWith("/api/cursos/") && req.method === "PUT") {
      const slug = pathname.replace("/api/cursos/", "");
      const payload = JSON.parse((await readBody(req)) || "{}");
      const titulo = String(payload.titulo ?? "").trim();
      const descripcionCorta = String(payload.descripcionCorta ?? "").trim();
      const esPublico = payload.esPublico;

      const course = await pool.query(`SELECT id FROM cursos WHERE slug = $1`, [slug]);
      if (course.rowCount === 0) return sendJson(res, 404, { message: "Curso no encontrado" });

      const updates: string[] = [];
      const values: unknown[] = [];
      let idx = 1;
      if (titulo) { updates.push(`titulo = $${idx++}`); values.push(titulo); }
      if (descripcionCorta) { updates.push(`"descripcionCorta" = $${idx++}`); values.push(descripcionCorta); }
      if (typeof esPublico === "boolean") { updates.push(`"esPublico" = $${idx++}`); values.push(esPublico); }
      updates.push(`"actualizadoEn" = now()`);
      values.push(slug);

      await pool.query(`UPDATE cursos SET ${updates.join(", ")} WHERE slug = $${idx}`, values);
      return sendJson(res, 200, { message: "Curso actualizado" });
    }

    if (pathname.startsWith("/api/cursos/") && req.method === "DELETE") {
      const slug = pathname.replace("/api/cursos/", "");
      const courseResult = await pool.query(`SELECT id FROM cursos WHERE slug = $1`, [slug]);
      if (courseResult.rowCount === 0) return sendJson(res, 404, { message: "Curso no encontrado" });
      const courseId = courseResult.rows[0].id;

      const videos = await pool.query(`SELECT id FROM videos WHERE "idCurso" = $1`, [courseId]);
      for (const row of videos.rows) {
        await pool.query(`DELETE FROM videos_tags WHERE "idVideo" = $1`, [row.id]);
        await pool.query(`DELETE FROM progreso_usuario_video WHERE "idVideo" = $1`, [row.id]);
        await pool.query(`DELETE FROM vistas_diarias_video WHERE "idVideo" = $1`, [row.id]);
      }

      await pool.query(`DELETE FROM cursos_tags WHERE "idCurso" = $1`, [courseId]);
      await pool.query(`DELETE FROM usuarios_cursos WHERE "idCurso" = $1`, [courseId]);
      await pool.query(`DELETE FROM cursos_autores WHERE "idCurso" = $1`, [courseId]);
      await pool.query(`DELETE FROM videos WHERE "idCurso" = $1`, [courseId]);
      await pool.query(`DELETE FROM articulos WHERE "idCurso" = $1`, [courseId]);
      await pool.query(`DELETE FROM cursos WHERE id = $1`, [courseId]);

      return sendJson(res, 200, { message: "Curso eliminado" });
    }

    if (pathname.startsWith("/api/cursos/") && req.method === "GET") {
      const slug = pathname.replace("/api/cursos/", "");
      const cursoResult = await pool.query(
        `
          SELECT c.id, c.slug, c.titulo, c."descripcionCorta", c."esPublico", c."publicadoEn", c."idCategoria",
                 COALESCE((SELECT SUM(v2."vistasCache") FROM videos v2 WHERE v2."idCurso" = c.id), 0)::int AS "vistasTotalesVideos",
                 COALESCE((SELECT SUM(ar."vistasCache") FROM articulos ar WHERE ar."idCurso" = c.id), 0)::int AS "vistasTotalesArticulos"
          FROM cursos c
          WHERE c.slug = $1
        `,
        [slug]
      );
      if ((cursoResult.rowCount ?? 0) === 0) return sendJson(res, 404, { message: "Curso no encontrado" });
      const curso = cursoResult.rows[0];

      const pathResult = await pool.query(
        `
          WITH RECURSIVE anc AS (
            SELECT id, nombre, "idCategoriaPadre", 0 AS lvl FROM arbol_categorias WHERE id = $1
            UNION ALL
            SELECT p.id, p.nombre, p."idCategoriaPadre", anc.lvl + 1
            FROM arbol_categorias p
            INNER JOIN anc ON p.id = anc."idCategoriaPadre"
          )
          SELECT string_agg(nombre, ' >> ' ORDER BY lvl DESC) AS "categoriaRutaLegible" FROM anc
        `,
        [curso.idCategoria]
      );

      const tagsCurso = await pool.query(
        `
          SELECT t.slug, t.nombre
          FROM tags t
          JOIN cursos_tags ct ON ct."idTag" = t.id
          WHERE ct."idCurso" = $1
          ORDER BY t.nombre ASC
        `,
        [curso.id]
      );

      const videosResult = await pool.query(
        `
          SELECT v.slug, v.titulo, v."nivelAcceso", v."vistasCache",
                 a.slug AS "autorSlug", a."nombreMostrado" AS "autorNombre",
                 COALESCE((
                   SELECT json_agg(json_build_object('slug', t.slug, 'nombre', t.nombre))
                   FROM videos_tags vt
                   JOIN tags t ON t.id = vt."idTag"
                   WHERE vt."idVideo" = v.id
                 ), '[]'::json) AS tags,
                 COALESCE((
                   SELECT SUM(vd.vistas)::int FROM vistas_diarias_video vd WHERE vd."idVideo" = v.id
                 ), 0) AS "vistasDiariasTotales"
          FROM videos v
          JOIN autores a ON a.id = v."idAutor"
          WHERE v."idCurso" = $1
          ORDER BY v.orden ASC
        `,
        [curso.id]
      );

      const articulosResult = await pool.query(
        `
          SELECT ar.slug, ar.titulo, ar."numeroPag", ar."vistasCache", ar."nivelAcceso",
                 a.slug AS "autorSlug", a."nombreMostrado" AS "autorNombre"
          FROM articulos ar
          JOIN autores a ON a.id = ar."idAutor"
          WHERE ar."idCurso" = $1
          ORDER BY ar.orden ASC
        `,
        [curso.id]
      );

      return sendJson(res, 200, {
        slug: curso.slug,
        titulo: curso.titulo,
        descripcionCorta: curso.descripcionCorta,
        esPublico: curso.esPublico,
        publicadoEn: curso.publicadoEn,
        categoriaRutaLegible: pathResult.rows[0]?.categoriaRutaLegible ?? null,
        vistasTotalesVideos: curso.vistasTotalesVideos,
        vistasTotalesArticulos: curso.vistasTotalesArticulos,
        vistasTotalesCache: curso.vistasTotalesVideos,
        tagsCurso: tagsCurso.rows,
        videos: videosResult.rows,
        articulos: articulosResult.rows,
      });
    }

    if (pathname === "/api/autores" && req.method === "GET") {
      const { rows } = await pool.query(
        `SELECT slug, "nombreMostrado", "bioCorta" FROM autores ORDER BY "nombreMostrado" ASC`
      );
      return sendJson(res, 200, rows);
    }

    if (pathname === "/api/autores" && req.method === "POST") {
      const payload = JSON.parse((await readBody(req)) || "{}");
      const nombreMostrado = String(payload?.nombreMostrado ?? "").trim();
      const bioCorta = String(payload?.bioCorta ?? "").trim();
      if (!nombreMostrado) return sendJson(res, 400, { message: "nombreMostrado es obligatorio" });

      const slug = await ensureUniqueSlug("autores", slugify(nombreMostrado));
      await pool.query(
        `INSERT INTO autores (slug, "nombreMostrado", "bioCorta", "creadoEn") VALUES ($1, $2, $3, now())`,
        [slug, nombreMostrado, bioCorta]
      );

      return sendJson(res, 201, { slug, message: "Autor creado" });
    }

    if (pathname.startsWith("/api/autores/") && req.method === "PUT") {
      const slug = pathname.replace("/api/autores/", "");
      const payload = JSON.parse((await readBody(req)) || "{}");
      const nombreMostrado = String(payload.nombreMostrado ?? "").trim();
      const bioCorta = String(payload.bioCorta ?? "").trim();

      const author = await pool.query(`SELECT id FROM autores WHERE slug = $1`, [slug]);
      if (author.rowCount === 0) return sendJson(res, 404, { message: "Autor no encontrado" });

      const updates: string[] = [];
      const values: unknown[] = [];
      let idx = 1;
      if (nombreMostrado) { updates.push(`"nombreMostrado" = $${idx++}`); values.push(nombreMostrado); }
      if (payload.bioCorta !== undefined) { updates.push(`"bioCorta" = $${idx++}`); values.push(bioCorta); }
      updates.push(`"actualizadoEn" = now()`);
      values.push(slug);

      await pool.query(`UPDATE autores SET ${updates.join(", ")} WHERE slug = $${idx}`, values);
      return sendJson(res, 200, { message: "Autor actualizado" });
    }

    if (pathname.startsWith("/api/autores/") && req.method === "DELETE") {
      const slug = pathname.replace("/api/autores/", "");
      const author = await pool.query(`SELECT id FROM autores WHERE slug = $1`, [slug]);
      if (author.rowCount === 0) return sendJson(res, 404, { message: "Autor no encontrado" });
      const authorId = author.rows[0].id;

      const used = await pool.query(
        `SELECT 1 FROM videos WHERE "idAutor" = $1 UNION SELECT 1 FROM articulos WHERE "idAutor" = $1 LIMIT 1`,
        [authorId]
      );
      if ((used.rowCount ?? 0) > 0) return sendJson(res, 409, { message: "No se puede borrar: autor referenciado" });

      await pool.query(`DELETE FROM cursos_autores WHERE "idAutor" = $1`, [authorId]);
      await pool.query(`DELETE FROM autores WHERE id = $1`, [authorId]);
      return sendJson(res, 200, { message: "Autor eliminado" });
    }

    if (pathname.startsWith("/api/autores/") && req.method === "GET") {
      const slug = pathname.replace("/api/autores/", "");
      const authorResult = await pool.query(
        `SELECT id, slug, "nombreMostrado", "bioCorta" FROM autores WHERE slug = $1`,
        [slug]
      );
      if (authorResult.rowCount === 0) return sendJson(res, 404, { message: "Autor no encontrado" });
      const author = authorResult.rows[0];

      const cursosResult = await pool.query(
        `
          SELECT DISTINCT c.slug, c.titulo, c."descripcionCorta"
          FROM cursos c
          JOIN cursos_autores ca ON ca."idCurso" = c.id
          WHERE ca."idAutor" = $1
          ORDER BY c.titulo ASC
        `,
        [author.id]
      );

      return sendJson(res, 200, {
        slug: author.slug,
        nombreMostrado: author.nombreMostrado,
        bioCorta: author.bioCorta,
        cursos: cursosResult.rows,
      });
    }

    if (await serveStatic(pathname, res)) return;
    return sendJson(res, 404, { message: "No encontrado" });
  } catch (error: any) {
    return sendJson(res, 500, { message: "Error interno", detail: error?.message ?? "unknown" });
  }
});

const start = async () => {
  await pool.query("SELECT 1");
  server.listen(port, () => {
    console.log(`Demo L2A escuchando en http://localhost:${port}`);
  });
};

start().catch((error) => {
  console.error("Error iniciando demo L2A:", error);
  process.exit(1);
});
