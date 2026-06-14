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

async function listNews(req, res) {
  const limit = parseInteger(req.query.limit, 20, { min: 1, max: 100 });
  const offset = parseInteger(req.query.offset, 0, { min: 0 });
  const includeDrafts = req.query.includeDrafts === 'true' && Boolean(getAdminSession(req));

  const result = await query(
    `select id, title, slug, summary, content, image_url, status, tags, published_at, created_at, updated_at
       from news_posts
      where ($1::boolean = true or status = 'published')
      order by coalesce(published_at, created_at) desc
      limit $2 offset $3`,
    [includeDrafts, limit, offset]
  );

  return sendJson(res, 200, { items: result.rows.map(serializeNews) });
}

async function createNews(req, res) {
  const session = requireAdmin(req, res);
  if (!session) return;

  const body = await readJson(req);
  const title = requireString(body, 'title');
  const content = requireString(body, 'content');
  const slug = normalizeSlug(body.slug) || slugFromTitle(title);
  const status = normalizeStatus(body.status) || 'published';
  const publishedAt = body.publishedAt || (status === 'published' ? new Date().toISOString() : null);

  const result = await query(
    `insert into news_posts
      (title, slug, summary, content, image_url, status, tags, published_at, created_by)
     values ($1, $2, $3, $4, $5, $6, $7::text[], $8, $9)
     returning id, title, slug, summary, content, image_url, status, tags, published_at, created_at, updated_at`,
    [
      title,
      slug,
      body.summary || null,
      content,
      body.imageUrl || null,
      status,
      normalizeTags(body.tags),
      publishedAt,
      session.sub,
    ]
  );

  return sendJson(res, 201, { item: serializeNews(result.rows[0]) });
}

module.exports = async function handler(req, res) {
  try {
    if (req.method === 'GET') return listNews(req, res);
    if (req.method === 'POST') return createNews(req, res);
    return methodNotAllowed(res, ['GET', 'POST']);
  } catch (error) {
    const status = error.statusCode || (error.code === '23505' ? 409 : 500);
    return sendJson(res, status, { error: error.code || 'server_error' });
  }
};
