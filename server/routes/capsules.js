// routes/capsules.js — protected CRUD for /api/capsules.
// Every route below requires a valid JWT (see requireAuth) and every query
// is scoped to req.userId, which comes ONLY from the verified JWT — never
// from the request body or query string.

const express = require('express');
const db = require('../db');
const { requireAuth } = require('../auth');

const router = express.Router();

router.use(requireAuth);

function toBool(v) {
  return v ? 1 : 0;
}

// GET /api/capsules — read only the caller's own records
router.get('/', (req, res) => {
  const rows = db
    .prepare('SELECT * FROM capsules WHERE user_id = ? ORDER BY created_at DESC, id DESC')
    .all(req.userId);
  res.json(rows);
});

// POST /api/capsules — create a record owned by the caller
router.post('/', (req, res) => {
  const {
    project_name,
    prompt_title,
    prompt_version,
    prompt_text,
    response_summary,
    category,
    usefulness,
    reviewed,
    improved,
    screenshot_url,
    notes,
  } = req.body || {};

  if (!project_name || !prompt_title || !prompt_text) {
    return res.status(400).json({
      error: 'project_name, prompt_title and prompt_text are required.',
    });
  }

  const info = db
    .prepare(
      `INSERT INTO capsules (
        user_id, project_name, prompt_title, prompt_version, prompt_text,
        response_summary, category, usefulness, reviewed, improved,
        screenshot_url, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      req.userId,
      project_name,
      prompt_title,
      prompt_version || null,
      prompt_text,
      response_summary || null,
      category || null,
      usefulness || null,
      toBool(reviewed),
      toBool(improved),
      screenshot_url || null,
      notes || null
    );

  const created = db.prepare('SELECT * FROM capsules WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(created);
});

// PUT /api/capsules/:id — update only if owned by the caller
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const existing = db
    .prepare('SELECT * FROM capsules WHERE id = ? AND user_id = ?')
    .get(id, req.userId);

  if (!existing) {
    // Do not reveal whether the record exists under a different owner.
    return res.status(404).json({ error: 'Record not found.' });
  }

  const {
    project_name,
    prompt_title,
    prompt_version,
    prompt_text,
    response_summary,
    category,
    usefulness,
    reviewed,
    improved,
    screenshot_url,
    notes,
  } = req.body || {};

  db.prepare(
    `UPDATE capsules SET
      project_name = ?, prompt_title = ?, prompt_version = ?, prompt_text = ?,
      response_summary = ?, category = ?, usefulness = ?, reviewed = ?, improved = ?,
      screenshot_url = ?, notes = ?
    WHERE id = ? AND user_id = ?`
  ).run(
    project_name ?? existing.project_name,
    prompt_title ?? existing.prompt_title,
    prompt_version ?? existing.prompt_version,
    prompt_text ?? existing.prompt_text,
    response_summary ?? existing.response_summary,
    category ?? existing.category,
    usefulness ?? existing.usefulness,
    reviewed !== undefined ? toBool(reviewed) : existing.reviewed,
    improved !== undefined ? toBool(improved) : existing.improved,
    screenshot_url ?? existing.screenshot_url,
    notes ?? existing.notes,
    id,
    req.userId
  );

  const updated = db.prepare('SELECT * FROM capsules WHERE id = ?').get(id);
  res.json(updated);
});

// DELETE /api/capsules/:id — delete only if owned by the caller
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const existing = db
    .prepare('SELECT * FROM capsules WHERE id = ? AND user_id = ?')
    .get(id, req.userId);

  if (!existing) {
    return res.status(404).json({ error: 'Record not found.' });
  }

  db.prepare('DELETE FROM capsules WHERE id = ? AND user_id = ?').run(id, req.userId);
  res.json({ ok: true, id: Number(id) });
});

module.exports = router;
