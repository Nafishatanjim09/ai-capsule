// auth.js — application JWT helpers and the auth middleware that protects
// every /api/capsules route.
//
// This JWT is issued by THIS server after a successful GitHub OAuth login.
// It is a completely separate token from the GitHub OAuth access token.

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  // Fail loudly in any environment rather than silently signing with `undefined`.
  console.error('FATAL: JWT_SECRET is not set. Add it to your environment variables.');
  process.exit(1);
}

/**
 * Sign the application JWT for a user who has just completed OAuth login.
 * payload = { sub: <provider user id as string>, username: <display name> }
 */
function signAppToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });
}

/**
 * Express middleware: verifies the `token` HttpOnly cookie.
 * - No cookie            -> 401
 * - Cookie fails verify  -> 401
 * - Valid                -> req.userId / req.username set, next()
 */
function requireAuth(req, res, next) {
  const token = req.cookies ? req.cookies.token : undefined;

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.sub;
    req.username = decoded.username;
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

module.exports = { signAppToken, requireAuth, JWT_SECRET };
