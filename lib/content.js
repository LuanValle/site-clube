function normalizeSlug(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

function slugFromTitle(title) {
  const slug = normalizeSlug(title);
  return slug || `item-${Date.now()}`;
}

function normalizeTags(tags) {
  if (Array.isArray(tags)) {
    return tags.map((tag) => String(tag).trim()).filter(Boolean);
  }

  if (typeof tags === 'string') {
    return tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
  }

  return [];
}

function normalizeStatus(status) {
  if (status === undefined || status === null || status === '') {
    return null;
  }

  if (status === 'draft' || status === 'published') {
    return status;
  }

  const error = new Error('status must be draft or published');
  error.statusCode = 400;
  error.code = 'validation_error';
  throw error;
}

function requireString(body, field) {
  const value = String(body[field] || '').trim();
  if (!value) {
    const error = new Error(`${field} is required`);
    error.statusCode = 400;
    error.code = 'validation_error';
    throw error;
  }
  return value;
}

function optionalValue(body, field) {
  if (!Object.prototype.hasOwnProperty.call(body, field)) {
    return undefined;
  }

  return body[field] === '' ? null : body[field];
}

module.exports = {
  normalizeSlug,
  normalizeStatus,
  normalizeTags,
  optionalValue,
  requireString,
  slugFromTitle,
};
