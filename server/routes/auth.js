// routes/auth.js — GitHub OAuth login flow, plus /api/me and /api/logout.
//
// GET  /login                    -> starts OAuth login (redirects to GitHub)
// GET  /auth/github/callback     -> completes OAuth login, issues the app JWT
// GET  /api/me                   -> returns the signed-in user (used by the React app)
// POST /api/logout               -> clears the session cookie

const express = require('express');
const jwt = require('jsonwebtoken');
const { signAppToken, JWT_SECRET } = require('../auth');

const router = express.Router();

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const APP_BASE_URL = process.env.APP_BASE_URL || 'http://localhost:5000';
const CALLBACK_URL = `${APP_BASE_URL.replace(/\/$/, '')}/auth/github/callback`;

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000, // 1 day, matches the JWT expiry
  };
}

// GET /login — starts OAuth login
router.get('/login', (req, res) => {
  if (!GITHUB_CLIENT_ID) {
    return res
      .status(500)
      .send('GITHUB_CLIENT_ID is not configured on the server.');
  }

  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    redirect_uri: CALLBACK_URL,
    scope: 'read:user',
  });

  res.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
});

// GET /auth/github/callback — GitHub redirects here after the user approves login
router.get('/auth/github/callback', async (req, res) => {
  const { code, error } = req.query;

  if (error) {
    return res.status(401).send(`GitHub login was not completed: ${error}`);
  }
  if (!code) {
    return res.status(400).send('Missing OAuth code from GitHub.');
  }

  try {
    // Step 1: exchange the temporary code for a GitHub access token
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: CALLBACK_URL,
      }),
    });
    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      console.error('GitHub token exchange failed:', tokenData);
      return res.status(401).send('GitHub authentication failed.');
    }

    // Step 2: use the GitHub access token to fetch the user's profile
    const profileRes = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        'User-Agent': 'ai-capsule-app',
      },
    });
    const ghUser = await profileRes.json();

    if (!ghUser || !ghUser.id) {
      console.error('GitHub profile fetch failed:', ghUser);
      return res.status(401).send('Could not read GitHub profile.');
    }

    // Step 3: issue OUR OWN application JWT — not the GitHub token.
    const appToken = signAppToken({
      sub: String(ghUser.id),
      username: ghUser.login,
    });

    // Step 4: store it in a Secure, HttpOnly cookie named "token"
    res.cookie('token', appToken, cookieOptions());

    // Step 5: send the browser into the protected dashboard
    res.redirect('/dashboard');
  } catch (err) {
    console.error('OAuth callback error:', err);
    res.status(500).send('Something went wrong completing GitHub login.');
  }
});

// GET /api/me — lets the React app know who is signed in (401 if not)
router.get('/api/me', (req, res) => {
  const token = req.cookies ? req.cookies.token : undefined;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ userId: decoded.sub, username: decoded.username });
  } catch {
    res.status(401).json({ error: 'Unauthorized' });
  }
});

// POST /api/logout — clears the session cookie
router.post('/api/logout', (req, res) => {
  res.clearCookie('token', cookieOptions());
  res.json({ ok: true });
});

module.exports = router;
