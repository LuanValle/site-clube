const { query } = require('../../lib/db');
const { getAdminSession, requireAdmin } = require('../../lib/auth');
const { methodNotAllowed, readJson, sendJson } = require('../../lib/http');
const { normalizeSlug, normalizeStatus, normalizeTags, optionalValue } = require('../../lib/content');

function serializeLibraryItem(row) {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    category: row.category,
    author: row.author,
    year: row.year,
    coverImageUrl: row.cover_image_url,
    driveUrl: row.drive_url,
    externalUrl: row.external_url,
    status: row.status,
    tags: row.tags || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function getId(req) {
  return String(req.query.id || '').trim();
}

async function getLibraryItem(req, res) {
  const canSeeDrafts = Boolean(getAdminSession(req));
  const result = await query(
    `select id, title, slug, description, category, author, year, cover_image_url,
            drive_url, external_url, status, tags, created_at, updated_at
       from library_items
      where id = $1
        and ($2::boolean = true or status = 'published')
      limit 1`,
    [getId(req), canSeeDrafts]
  );

  if (!result.rows[0]) {
    return sendJson(res, 404, { error: 'not_found' });
  }

  return sendJson(res, 200, { item: serializeLibraryItem(result.rows[0]) });
}

async function updateLibraryItem(req, res) {
  const session = requireAdmin(req, res);
  if (!session) return;

  const body = await readJson(req);
  const description = optionalValue(body, 'description');
  const category = optionalValue(body, 'category');
  const author = optionalValue(body, 'author');
  const year = optionalValue(body, 'year');
  const coverImageUrl = optionalValue(body, 'coverImageUrl');
  const driveUrl = optionalValue(body, 'driveUrl');
  const externalUrl = optionalValue(body, 'externalUrl');
  const result = await query(
    `update library_items
        set title = coalesce($2, title),
            slug = coalesce($3, slug),
            description = case when $4::boolean then $5 else description end,
            category = case when $6::boolean then $7 else category end,
            author = case when $8::boolean then $9 else author end,
            year = case when $10::boolean then $11 else year end,
            cover_image_url = case when $12::boolean then $13 else cover_image_url end,
            drive_url = case when $14::boolean then $15 else drive_url end,
            external_url = case when $16::boolean then $17 else external_url end,
            status = coalesce($18, status),
            tags = coalesce($19::text[], tags),
            updated_at = now(),
            updated_by = $20
      where id = $1
      returning id, title, slug, description, category, author, year, cover_image_url,
                drive_url, external_url, status, tags, created_at, updated_at`,
    [
      getId(req),
      body.title || null,
      body.slug ? normalizeSlug(body.slug) : null,
      description !== undefined,
      description,
      category !== undefined,
      category,
      author !== undefined,
      author,
      year !== undefined,
      year,
      coverImageUrl !== undefined,
      coverImageUrl,
      driveUrl !== undefined,
      driveUrl,
      externalUrl !== undefined,
      externalUrl,
      normalizeStatus(body.status),
      Array.isArray(body.tags) || typeof body.tags === 'string' ? normalizeTags(body.tags) : null,
      session.sub,
    ]
  );

  if (!result.rows[0]) {
    return sendJson(res, 404, { error: 'not_found' });
  }

  return sendJson(res, 200, { item: serializeLibraryItem(result.rows[0]) });
}

async function deleteLibraryItem(req, res) {
  const session = requireAdmin(req, res);
  if (!session) return;

  const result = await query('delete from library_items where id = $1 returning id', [getId(req)]);
  if (!result.rows[0]) {
    return sendJson(res, 404, { error: 'not_found' });
  }

  return sendJson(res, 200, { ok: true });
}

module.exports = async function handler(req, res) {
  try {
    if (req.method === 'GET') return getLibraryItem(req, res);
    if (req.method === 'PUT' || req.method === 'PATCH') return updateLibraryItem(req, res);
    if (req.method === 'DELETE') return deleteLibraryItem(req, res);
    return methodNotAllowed(res, ['GET', 'PUT', 'PATCH', 'DELETE']);
  } catch (error) {
    const status = error.statusCode || (error.code === '23505' ? 409 : 500);
    return sendJson(res, status, { error: error.code || 'server_error' });
  }
};
