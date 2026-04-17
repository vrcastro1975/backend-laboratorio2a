import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { readFile } from "node:fs/promises";
import { join, extname } from "node:path";
import { Pool } from "pg";

const pool = new Pool({
  host: process.env.DB_HOST ?? "postgres",
  port: Number(process.env.DB_PORT ?? 5432),
  user: process.env.DB_USER ?? "appuser",
  password: process.env.DB_PASSWORD ?? "apppass",
  database: process.env.DB_NAME ?? "elearning",
});

const port = Number(process.env.PORT ?? 3000);
const publicDir = join(process.cwd(), "public");

const mimeTypes: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

const sendJson = (res: ServerResponse, status: number, payload: unknown) => {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
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
    const filePath = join(publicDir, pathname === "/" ? "/index.html" : pathname);
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

    if (pathname === "/api/categorias" && req.method === "GET") {
      const { rows } = await pool.query(`SELECT slug, nombre FROM categorias ORDER BY nombre ASC`);
      return sendJson(res, 200, rows);
    }

    if (pathname === "/api/home" && req.method === "GET") {
      const { rows } = await pool.query(`
        SELECT cat.nombre AS categoria,
               c.slug AS "cursoSlug",
               c.titulo AS "cursoTitulo",
               v.slug AS "videoSlug",
               v.titulo AS "videoTitulo",
               v."publicadoEn"
        FROM videos v
        JOIN cursos c ON c.id = v."idCurso"
        JOIN categorias cat ON cat.id = c."idCategoria"
        WHERE v."estaPublicado" = true
        ORDER BY cat.nombre ASC, v."publicadoEn" DESC NULLS LAST
      `);

      const grouped = new Map<string, any[]>();
      for (const row of rows) {
        if (!grouped.has(row.categoria)) grouped.set(row.categoria, []);
        const list = grouped.get(row.categoria)!;
        if (list.length < 5) list.push(row);
      }
      return sendJson(res, 200, Array.from(grouped.entries()).map(([categoria, videos]) => ({ categoria, videos })));
    }

    if (pathname === "/api/cursos" && req.method === "GET") {
      const categoria = url.searchParams.get("categoria");
      const params: unknown[] = [];
      let where = "";
      if (categoria) {
        params.push(categoria);
        where = "WHERE cat.slug = $1";
      }
      const { rows } = await pool.query(
        `
          SELECT c.slug, c.titulo, c."descripcionCorta", c."publicadoEn", cat.nombre AS categoria
          FROM cursos c
          JOIN categorias cat ON cat.id = c."idCategoria"
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

      if (!titulo || !descripcionCorta || !categoriaSlug || !autorSlug) {
        return sendJson(res, 400, { message: "Faltan campos obligatorios" });
      }

      const categoria = await pool.query(`SELECT id FROM categorias WHERE slug = $1`, [categoriaSlug]);
      if (categoria.rowCount === 0) return sendJson(res, 400, { message: "Categoria no valida" });

      const autor = await pool.query(`SELECT id FROM autores WHERE slug = $1`, [autorSlug]);
      if (autor.rowCount === 0) return sendJson(res, 400, { message: "Autor no valido" });

      const slug = await ensureUniqueSlug("cursos", slugify(titulo));
      const cmsId = `cms-auto-${slug}`;
      const insert = await pool.query(
        `INSERT INTO cursos (slug, titulo, "descripcionCorta", "idCategoria", "idContenidoCursoCms", "publicadoEn", "creadoEn")
         VALUES ($1,$2,$3,$4,$5,now(),now()) RETURNING id`,
        [slug, titulo, descripcionCorta, categoria.rows[0].id, cmsId]
      );

      await pool.query(
        `INSERT INTO cursos_autores ("idCurso", "idAutor", rol, "creadoEn") VALUES ($1, $2, 'autor', now())`,
        [insert.rows[0].id, autor.rows[0].id]
      );

      return sendJson(res, 201, { slug, message: "Curso creado" });
    }

    if (pathname.startsWith("/api/cursos/") && req.method === "PUT") {
      const slug = pathname.replace("/api/cursos/", "");
      const payload = JSON.parse((await readBody(req)) || "{}");
      const titulo = String(payload.titulo ?? "").trim();
      const descripcionCorta = String(payload.descripcionCorta ?? "").trim();

      const curso = await pool.query(`SELECT id FROM cursos WHERE slug = $1`, [slug]);
      if (curso.rowCount === 0) return sendJson(res, 404, { message: "Curso no encontrado" });

      const updates: string[] = [];
      const values: unknown[] = [];
      let idx = 1;
      if (titulo) {
        updates.push(`titulo = $${idx++}`);
        values.push(titulo);
      }
      if (descripcionCorta) {
        updates.push(`"descripcionCorta" = $${idx++}`);
        values.push(descripcionCorta);
      }
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

      await pool.query(`DELETE FROM cursos_autores WHERE "idCurso" = $1`, [courseId]);
      await pool.query(`DELETE FROM videos WHERE "idCurso" = $1`, [courseId]);
      await pool.query(`DELETE FROM articulos WHERE "idCurso" = $1`, [courseId]);
      await pool.query(`DELETE FROM cursos WHERE id = $1`, [courseId]);

      return sendJson(res, 200, { message: "Curso eliminado" });
    }

    if (pathname.startsWith("/api/cursos/") && req.method === "GET") {
      const slug = pathname.replace("/api/cursos/", "");
      const cursoResult = await pool.query(
        `SELECT id, slug, titulo, "descripcionCorta", "publicadoEn" FROM cursos WHERE slug = $1`,
        [slug]
      );
      if (cursoResult.rowCount === 0) return sendJson(res, 404, { message: "Curso no encontrado" });
      const curso = cursoResult.rows[0];

      const videosResult = await pool.query(
        `
          SELECT v.slug, v.titulo, a."nombreMostrado" AS "autorNombre"
          FROM videos v
          JOIN autores a ON a.id = v."idAutor"
          WHERE v."idCurso" = $1
          ORDER BY v.orden ASC
        `,
        [curso.id]
      );

      const articulosResult = await pool.query(
        `
          SELECT ar.slug, ar.titulo, a."nombreMostrado" AS "autorNombre"
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
        publicadoEn: curso.publicadoEn,
        videos: videosResult.rows,
        articulos: articulosResult.rows,
      });
    }

    if (pathname === "/api/autores" && req.method === "GET") {
      const { rows } = await pool.query(`SELECT slug, "nombreMostrado", "bioCorta" FROM autores ORDER BY "nombreMostrado"`);
      return sendJson(res, 200, rows);
    }

    if (pathname === "/api/autores" && req.method === "POST") {
      const payload = JSON.parse((await readBody(req)) || "{}");
      const nombreMostrado = String(payload.nombreMostrado ?? "").trim();
      const bioCorta = String(payload.bioCorta ?? "").trim();
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
      if (nombreMostrado) {
        updates.push(`"nombreMostrado" = $${idx++}`);
        values.push(nombreMostrado);
      }
      if (payload.bioCorta !== undefined) {
        updates.push(`"bioCorta" = $${idx++}`);
        values.push(bioCorta);
      }
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

      const coursesResult = await pool.query(
        `
          SELECT DISTINCT c.slug, c.titulo, c."descripcionCorta"
          FROM cursos c
          JOIN cursos_autores ca ON ca."idCurso" = c.id
          WHERE ca."idAutor" = $1
          ORDER BY c.titulo
        `,
        [author.id]
      );

      return sendJson(res, 200, {
        slug: author.slug,
        nombreMostrado: author.nombreMostrado,
        bioCorta: author.bioCorta,
        cursos: coursesResult.rows,
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
    console.log(`Demo L2A basica escuchando en http://localhost:${port}`);
  });
};

start().catch((error) => {
  console.error("Error iniciando demo basica:", error);
  process.exit(1);
});
