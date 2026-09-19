# AI Capsule — Cloud-Deployed AI Prompt Manager

A full-stack CRUD application for saving and reviewing AI prompts. Built with a **React**
frontend and a **Node.js/Express** backend, authenticated with **GitHub OAuth**, protected by
an application **JWT** stored in a `Secure, HttpOnly` cookie, and backed by **SQLite**.

> Replace every `<...>` placeholder in this file with your own details before submission.

---

## 1. Deployed application

| | |
|---|---|
| **Public URL** | `<https://YOUR-APP-NAME.onrender.com>` |
| **Cloud platform** | `<Render / Azure App Service / other>` |
| **Repository** | `<link if applicable>` |

Open the URL above — it is the React frontend and the Express API served from the same
deployed app (no separate frontend URL, so there is nothing to configure for CORS or
cross-origin cookies).

---

## 2. Project structure

```
ai-capsule/
├── server/               # Express API + JWT auth + GitHub OAuth + SQLite
│   ├── index.js          # App entrypoint — mounts routes, serves the React build
│   ├── db.js             # SQLite connection + schema
│   ├── auth.js           # JWT sign/verify + requireAuth middleware
│   ├── routes/
│   │   ├── auth.js       # /login, /auth/github/callback, /api/me, /api/logout
│   │   └── capsules.js   # Protected CRUD routes for /api/capsules
│   ├── .env.example
│   └── package.json
├── client/               # React (Vite) frontend
│   ├── src/
│   │   ├── pages/Landing.jsx
│   │   ├── pages/Dashboard.jsx
│   │   ├── components/CapsuleForm.jsx
│   │   ├── components/CapsuleList.jsx
│   │   ├── api.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
├── render.yaml           # Optional Render blueprint
└── README.md
```

---

## 3. Installation and run instructions

### Prerequisites
- Node.js 18+ (needed for the built-in `fetch` used in the OAuth callback)
- A GitHub account, to register an OAuth App (see Section 5)

### Install dependencies
```bash
cd server && npm install
cd ../client && npm install
```

### Configure environment variables
```bash
cd server
cp .env.example .env
# then edit .env and fill in JWT_SECRET, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET
```

### Run in development (two terminals)
```bash
# Terminal 1 — API on http://localhost:5000
cd server
npm run dev

# Terminal 2 — React dev server on http://localhost:5173 (proxies /api, /login, /auth to :5000)
cd client
npm run dev
```
Visit `http://localhost:5173` for local development. Note: GitHub OAuth requires the
callback URL registered on GitHub to match `APP_BASE_URL` in `.env` — see Section 5.

### Run in production (single server, single URL — this is how it is deployed)
```bash
cd client && npm run build      # outputs client/dist
cd ../server && npm start       # serves the API AND the built React app on the same port
```
Visit `http://localhost:5000` (or `$PORT`) — everything is served from one origin.

---

## 4. Required routes

| Route | Access | Implemented in |
|---|---|---|
| `GET /` | Public | React (landing page) |
| `GET /login` | Public | `server/routes/auth.js` — redirects to GitHub's OAuth authorize URL |
| `GET /dashboard` | Protected | React (calls `GET /api/me` on load; redirected to `/` if not authenticated) |
| `GET /api/health` | Public | `server/index.js` — returns `{ "status": "ok" }` |
| `GET /api/capsules` | Protected | `server/routes/capsules.js` — lists the caller's own records |
| `POST /api/capsules` | Protected | `server/routes/capsules.js` — creates a record owned by the caller |
| `PUT /api/capsules/:id` | Protected | `server/routes/capsules.js` — updates only if owned by the caller |
| `DELETE /api/capsules/:id` | Protected | `server/routes/capsules.js` — deletes only if owned by the caller |

Additional routes used for the OAuth flow: `GET /auth/github/callback` (completes login),
`GET /api/me` (returns the signed-in user for the frontend), `POST /api/logout` (clears the
cookie). These do not replace or rename any required route.

The React frontend talks to Express entirely through `fetch()` calls in `client/src/api.js`,
using `credentials: "include"` so the `token` cookie is sent with every request. Because the
frontend and API share one origin in production, no `Authorization` header or CORS
configuration is needed.

---

## 5. OAuth, JWT and cookie handling

- **OAuth provider used:** `<GitHub (recommended) — or note here if you used the Google fallback and why>`
- **Flow:**
  1. The user clicks **"Login with GitHub"** on the landing page → browser navigates to `GET /login`.
  2. `/login` redirects to GitHub's `authorize` endpoint with the app's `GITHUB_CLIENT_ID`.
  3. GitHub redirects back to `GET /auth/github/callback?code=...`.
  4. The server exchanges the code for a GitHub access token, then fetches the GitHub profile
     (`GET https://api.github.com/user`) to obtain the GitHub numeric user ID.
  5. The server **signs its own application JWT** (`jsonwebtoken`, `HS256`, 1-day expiry) with
     `{ sub: githubUserId, username }` — this is **not** the GitHub access token.
  6. The JWT is set as a cookie named **`token`**, with `httpOnly: true`, `secure: true` in
     production, `sameSite: "lax"`.
  7. The browser is redirected to `/dashboard`.
- **Verification:** `server/auth.js` exports `requireAuth`, an Express middleware that reads
  the `token` cookie, verifies it with `jsonwebtoken.verify()` and `JWT_SECRET`, and attaches
  `req.userId`. Missing or invalid tokens short-circuit with `401 Unauthorized` before any
  database query runs. All four `/api/capsules` routes use this middleware.
- **Ownership:** every capsule query filters or checks `WHERE user_id = ?` using `req.userId`
  taken from the verified JWT — the frontend never sends a `user_id`, and the server ignores
  one if it were sent.

### Registering a GitHub OAuth App
1. GitHub → Settings → Developer settings → OAuth Apps → New OAuth App.
2. **Homepage URL:** your deployed URL (or `http://localhost:5000` for local dev).
3. **Authorization callback URL:** `<https://YOUR-APP>/auth/github/callback`
   (or `http://localhost:5000/auth/github/callback` locally).
4. Copy the generated **Client ID** and **Client Secret** into your environment variables.

---

## 6. Environment variables

Names only — real values are never committed (see `server/.env.example`):

| Variable | Purpose |
|---|---|
| `PORT` | Port the Express server listens on (cloud platforms usually set this automatically) |
| `NODE_ENV` | `production` on the deployed app (controls the `secure` flag on the cookie) |
| `APP_BASE_URL` | The public base URL, used to build the OAuth callback URL |
| `JWT_SECRET` | Secret used to sign/verify the application JWT |
| `GITHUB_CLIENT_ID` | GitHub OAuth App client ID |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth App client secret |
| `DATABASE_PATH` | Path to the SQLite file (defaults to `server/capsule.db`) |

---

## 7. Database and storage

- **Engine:** SQLite via `better-sqlite3`. Schema is created automatically on server start
  (`server/db.js`) — no manual migration step is required.
- **Ownership:** every row has a `user_id` column populated from the verified JWT's `sub`
  claim (the GitHub user ID), never from client input.
- **Persistence:** `<fill in after deployment>` — e.g. "Deployed on Render's free web
  service, so the container's filesystem is ephemeral: the SQLite file is reset on redeploy
  or after extended inactivity. This is a known limitation of the free tier; a persistent
  disk or a managed Postgres instance would be needed for durable storage in a real
  product."

---

## 8. Required cURL checks

Run these against the **deployed** URL before submission and paste the actual results here.

```bash
# Test 1 - no authentication
curl -i https://YOUR-APP/api/capsules
# Required: 401 Unauthorized

# Test 2 - fake / invalid JWT
curl -i -H "Cookie: token=fake-token-123" https://YOUR-APP/api/capsules
# Required: 401 Unauthorized
```

**Test 1 result:** `<paste the HTTP status line + body you received>`

**Test 2 result:** `<paste the HTTP status line + body you received>`

---

## 9. Known limitation

`<One honest limitation of the submitted application — e.g. SQLite storage is ephemeral on
the free hosting tier, there is no refresh-token flow so sessions expire after 24 hours and
require re-login, screenshot evidence is a URL field rather than a real file upload, etc.>`

---

## 10. AI-assisted development statement

- **AI tool(s) used:** `<e.g. Claude>`
- **What it helped with:** `<e.g. scaffolding the Express routes, the JWT middleware, the
  React CRUD components, and this README>`
- **What I personally completed:** `<e.g. registered the GitHub OAuth App, configured the
  environment variables and deployed the service on Render, and tested the full OAuth →
  dashboard → CRUD flow end to end>`
- **One problem found and corrected in AI-generated code/configuration:** `<describe it —
  e.g. "the initial cookie config didn't set sameSite, so the cookie wasn't sent after the
  GitHub redirect; I added sameSite: 'lax'.">`
- **How OAuth login, JWT verification and protected API behaviour were verified:** `<e.g.
  "logged in with my own GitHub account, inspected the token cookie in DevTools to confirm
  HttpOnly/Secure, and ran the two required cURL tests against the deployed URL to confirm
  401 responses.">`
- **How CRUD behaviour and user data ownership were verified:** `<e.g. "created records
  under one GitHub account, then logged in with a second GitHub account and confirmed
  GET /api/capsules only returned that account's own records, and that PUT/DELETE on the
  first account's record ID returned 404 for the second account.">`
- **One implementation/deployment decision I made and can explain:** `<e.g. "chose to serve
  the built React app as static files from the same Express app instead of deploying the
  frontend separately, to avoid cross-origin cookie issues with the HttpOnly JWT cookie.">`

---

## 11. Marking-criteria checklist (self-check before submission)

- [ ] Deployed URL loads and is not `localhost`
- [ ] `/api/health` returns `{ "status": "ok" }` on the deployed URL
- [ ] cURL Test 1 (no cookie) → `401 Unauthorized`
- [ ] cURL Test 2 (fake cookie) → `401 Unauthorized`
- [ ] GitHub OAuth login works end-to-end into `/dashboard`
- [ ] CREATE, READ, UPDATE, DELETE all work against the deployed app
- [ ] A second GitHub account cannot see or modify the first account's records
- [ ] Cloud environment-variable **names** are visible in the video, no secret values shown
- [ ] Source-code ZIP excludes `node_modules`, `client/dist`, and `.env`
