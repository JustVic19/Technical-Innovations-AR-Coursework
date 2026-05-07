import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db.js';

const router = Router();

// GET /api/faults
router.get('/', (req, res) => {
  const { order = '-created_date', limit = 200 } = req.query;
  const desc = order.startsWith('-');
  const col = order.replace(/^-/, '');
  // Whitelist columns to prevent SQL injection
  const allowedCols = ['created_date', 'updated_date', 'severity', 'status', 'title'];
  const orderCol = allowedCols.includes(col) ? col : 'created_date';
  const dir = desc ? 'DESC' : 'ASC';

  const rows = db.prepare(`SELECT * FROM faults ORDER BY ${orderCol} ${dir} LIMIT ?`).all(Number(limit));

  // Parse JSON fields
  res.json(rows.map(r => ({
    ...r,
    position: JSON.parse(r.position || '{}'),
    ar_anchor: JSON.parse(r.ar_anchor || '{}'),
    annotations: JSON.parse(r.annotations || '[]'),
  })));
});

// POST /api/faults
router.post('/', (req, res) => {
  const id = uuidv4();
  const now = new Date().toISOString();
  const {
    marker_id = '', site_id = '', title, description = '', category,
    severity = 'medium', status = 'reported', position = {}, ar_anchor = {},
    image_url = '', annotations = [], assigned_to = '', approved_by = '',
    resolution_notes = '', predicted_failure_days = null
  } = req.body;

  db.prepare(`
    INSERT INTO faults (id, marker_id, site_id, title, description, category, severity, status, position, ar_anchor, image_url, annotations, assigned_to, approved_by, resolution_notes, predicted_failure_days, created_date, updated_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, marker_id, site_id, title, description, category, severity, status,
    JSON.stringify(position), JSON.stringify(ar_anchor), image_url, JSON.stringify(annotations),
    assigned_to, approved_by, resolution_notes, predicted_failure_days, now, now);

  const row = db.prepare('SELECT * FROM faults WHERE id = ?').get(id);
  res.status(201).json({
    ...row,
    position: JSON.parse(row.position || '{}'),
    ar_anchor: JSON.parse(row.ar_anchor || '{}'),
    annotations: JSON.parse(row.annotations || '[]'),
  });
});

// PUT /api/faults/:id
router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM faults WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Fault not found' });

  const updates = { ...req.body };
  if (updates.position) updates.position = JSON.stringify(updates.position);
  if (updates.ar_anchor) updates.ar_anchor = JSON.stringify(updates.ar_anchor);
  if (updates.annotations) updates.annotations = JSON.stringify(updates.annotations);
  updates.updated_date = new Date().toISOString();

  const fields = Object.keys(updates);
  const setClause = fields.map(f => `${f} = ?`).join(', ');
  const values = fields.map(f => updates[f]);

  db.prepare(`UPDATE faults SET ${setClause} WHERE id = ?`).run(...values, req.params.id);

  const row = db.prepare('SELECT * FROM faults WHERE id = ?').get(req.params.id);
  res.json({
    ...row,
    position: JSON.parse(row.position || '{}'),
    ar_anchor: JSON.parse(row.ar_anchor || '{}'),
    annotations: JSON.parse(row.annotations || '[]'),
  });
});

// DELETE /api/faults/:id
router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM faults WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Fault not found' });
  res.json({ success: true });
});

export default router;
