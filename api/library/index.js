const { query } = require('../../lib/db');
const { getAdminSession, requireAdmin } = require('../../lib/auth');
const { methodNotAllowed, parseInteger, readJson, sendJson } = require('../../lib/http');
const {
  normalizeSlug,
  normalizeStatus,
  normalizeTags,
  requireString,
  slugFromTitle,
} = require('../../lib/content');

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

async function listLibrary(req, res) {
  const limit = parseInteger(req.query.limit, 20, { min: 1, max: 100 });
  const offset = parseInteger(req.query.offset, 0, { min: 0 });
  const category = req.query.category ? String(req.query.category).trim() : null;
  const search = req.query.q ? `%${String(req.query.q).trim()}%` : null;
  const includeDrafts = req.query.includeDrafts === 'true' && Boolean(getAdminSession(req));

  const result = await query(
    `select id, title, slug, description, category, author, year, cover_image_url,
            drive_url, external_url, status, tags, created_at, updated_at
       from library_items
      where ($1::boolean = true or status = 'published')
        and ($2::text is null or category = $2)
        and ($3::text is null or title ilike $3 or description ilike $3 or author ilike $3)
      order by created_at desc
      limit $4 offset $5`,
    [includeDrafts, category, search, limit, offset]
  );

  return sendJson(res, 200, { items: result.rows.map(serializeLibraryItem) });
}

async function createLibraryItem(req, res) {
  const session = requireAdmin(req, res);
  if (!session) return;

  const body = await readJson(req);
  const title = requireString(body, 'title');
  const slug = normalizeSlug(body.slug) || slugFromTitle(title);
  const status = normalizeStatus(body.status) || 'published';

  const result = await query(
    `insert into library_items
      (title, slug, description, category, author, year, cover_image_url, drive_url,
       external_url, status, tags, created_by)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::text[], $12)
     returning id, title, slug, description, category, author, year, cover_image_url,
               drive_url, external_url, status, tags, created_at, updated_at`,
    [
      title,
      slug,
      body.description || null,
      body.category || null,
      body.author || null,
      body.year || null,
      body.coverImageUrl || null,
      body.driveUrl || null,
      body.externalUrl || null,
      status,
      normalizeTags(body.tags),
      session.sub,
    ]
  );

  return sendJson(res, 201, { item: serializeLibraryItem(result.rows[0]) });
}

module.exports = async function handler(req, res) {
  try {
    if (req.method === 'GET') return listLibrary(req, res);
    if (req.method === 'POST') return createLibraryItem(req, res);
    return methodNotAllowed(res, ['GET', 'POST']);
  } catch (error) {
    const status = error.statusCode || (error.code === '23505' ? 409 : 500);
    return sendJson(res, status, { error: error.code || 'server_error' });
  }
};
