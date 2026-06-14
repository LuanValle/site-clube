const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { query } = require('./db');
const { getBearerToken, sendJson } = require('./http');

const TOKEN_TTL_SECONDS = 60 * 60 * 8;

function getJwtSecret() {
  const secret = process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('ADMIN_JWT_SECRET or JWT_SECRET is not configured');
  }
  return secret;
}

function base64UrlEncode(value) {
  return Buffer.from(value)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(value) {
  const padded = value.padEnd(value.length + ((4 - (value.length % 4)) % 4), '=');
  return Buffer.from(padded.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
}

function signToken(payload) {
  const now = Math.floor(Date.now() / 1000);
  const body = {
    ...payload,
    iat: now,
    exp: now + TOKEN_TTL_SECONDS,
  };
  const header = { alg: 'HS256', typ: 'JWT' };
  const unsigned = `${base64UrlEncode(JSON.stringify(header))}.${base64UrlEncode(JSON.stringify(body))}`;
  const signature = crypto.createHmac('sha256', getJwtSecret()).update(unsigned).digest();
  return `${unsigned}.${base64UrlEncode(signature)}`;
}

function verifyToken(token) {
  const parts = token ? token.split('.') : [];
  if (parts.length !== 3) {
    return null;
  }

  const [header, payload, signature] = parts;
  const unsigned = `${header}.${payload}`;
  const expected = base64UrlEncode(crypto.createHmac('sha256', getJwtSecret()).update(unsigned).digest());

  if (
    signature.length !== expected.length ||
    !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  ) {
    return null;
  }

  const decoded = JSON.parse(base64UrlDecode(payload).toString('utf8'));
  if (!decoded.exp || decoded.exp < Math.floor(Date.now() / 1000)) {
    return null;
  }

  return decoded;
}

async function authenticateAdmin(username, password) {
  const result = await query(
    `select id, username, password_hash
       from admin_users
      where username = $1
        and is_active = true
      limit 1`,
    [username]
  );

  const user = result.rows[0];
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return null;
  }

  return {
    id: user.id,
    username: user.username,
  };
}

function requireAdmin(req, res) {
  const session = getAdminSession(req);
  if (!session) {
    sendJson(res, 401, { error: 'unauthorized' });
    return null;
  }

  return session;
}

function getAdminSession(req) {
  try {
    const token = getBearerToken(req);
    const session = verifyToken(token);
    return session && session.role === 'admin' ? session : null;
  } catch (error) {
    return null;
  }
}

module.exports = {
  authenticateAdmin,
  getAdminSession,
  requireAdmin,
  signToken,
  TOKEN_TTL_SECONDS,
};
