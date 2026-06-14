const { authenticateAdmin, signToken, TOKEN_TTL_SECONDS } = require('../lib/auth');
const { methodNotAllowed, readJson, sendJson } = require('../lib/http');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return methodNotAllowed(res, ['POST']);
  }

  try {
    const body = await readJson(req);
    const username = String(body.username || '').trim();
    const password = String(body.password || '');

    if (!username || !password) {
      return sendJson(res, 400, { error: 'missing_credentials' });
    }

    const admin = await authenticateAdmin(username, password);
    if (!admin) {
      return sendJson(res, 401, { error: 'invalid_credentials' });
    }

    const token = signToken({
      sub: admin.id,
      username: admin.username,
      role: 'admin',
    });

    return sendJson(res, 200, {
      token,
      tokenType: 'Bearer',
      expiresIn: TOKEN_TTL_SECONDS,
      admin: {
        id: admin.id,
        username: admin.username,
      },
    });
  } catch (error) {
    const status = error.statusCode || 500;
    return sendJson(res, status, { error: error.code || 'server_error' });
  }
};
