const { query } = require('../../lib/db');
const { getAdminSession, requireAdmin } = require('../../lib/auth');
const { methodNotAllowed, readJson, sendJson } = require('../../lib/http');
const { normalizeSlug, normalizeStatus, normalizeTags, optionalValue } = require('../../lib/content');

function serializeNews(row) {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    summary: row.summary,
    content: row.content,
    imageUrl: row.image_url,
    status: row.status,
    tags: row.tags || [],
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function getId(req) {
  return String(req.query.id || '').trim();
}

async function getNews(req, res) {
  const canSeeDrafts = Boolean(getAdminSession(req));
  const result = await query(
    `select id, title, slug, summary, content, image_url, status, tags, published_at, created_at, updated_at
       from news_posts
      where id = $1
        and ($2::boolean = true or status = 'published')
      limit 1`,
    [getId(req), canSeeDrafts]
  );

  if (!result.rows[0]) {
    return sendJson(res, 404, { error: 'not_found' });
  }

  return sendJson(res, 200, { item: serializeNews(result.rows[0]) });
}

async function updateNews(req, res) {
  const session = requireAdmin(req, res);
  if (!session) return;

  const body = await readJson(req);
  const summary = optionalValue(body, 'summary');
  const imageUrl = optionalValue(body, 'imageUrl');
  const result = await query(
    `update news_posts
        set title = coalesce($2, title),
            slug = coalesce($3, slug),
            summary = case when $4::boolean then $5 else summary end,
            content = coalesce($6, content),
            image_url = case when $7::boolean then $8 else image_url end,
            status = coalesce($9, status),
            tags = coalesce($10::text[], tags),
            published_at = coalesce($11, published_at),
            updated_at = now(),
            updated_by = $12
      where id = $1
      returning id, title, slug, summary, content, image_url, status, tags, published_at, created_at, updated_at`,
    [
      getId(req),
      body.title || null,
      body.slug ? normalizeSlug(body.slug) : null,
      summary !== undefined,
      summary,
      body.content || null,
      imageUrl !== undefined,
      imageUrl,
      normalizeStatus(body.status),
      Array.isArray(body.tags) || typeof body.tags === 'string' ? normalizeTags(body.tags) : null,
      body.publishedAt || null,
      session.sub,
    ]
  );

  if (!result.rows[0]) {
    return sendJson(res, 404, { error: 'not_found' });
  }

  return sendJson(res, 200, { item: serializeNews(result.rows[0]) });
}

async function deleteNews(req, res) {
  const session = requireAdmin(req, res);
  if (!session) return;

  const result = await query('delete from news_posts where id = $1 returning id', [getId(req)]);
  if (!result.rows[0]) {
    return sendJson(res, 404, { error: 'not_found' });
  }

  return sendJson(res, 200, { ok: true });
}

module.exports = async function handler(req, res) {
  try {
    if (req.method === 'GET') return getNews(req, res);
    if (req.method === 'PUT' || req.method === 'PATCH') return updateNews(req, res);
    if (req.method === 'DELETE') return deleteNews(req, res);
    return methodNotAllowed(res, ['GET', 'PUT', 'PATCH', 'DELETE']);
  } catch (error) {
    const status = error.statusCode || (error.code === '23505' ? 409 : 500);
    return sendJson(res, status, { error: error.code || 'server_error' });
  }
};
