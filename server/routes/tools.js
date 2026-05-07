import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db.js';

const router = Router();

// GET /api/tools
router.get('/', (req, res) => {
  const { order = '-created_date', limit = 200 } = req.query;
  const desc = order.startsWith('-');
  const col = order.replace(/^-/, '');
  const allowedCols = ['created_date', 'name', 'category', 'status'];
  const orderCol = allowedCols.includes(col) ? col : 'created_date';
  const dir = desc ? 'DESC' : 'ASC';

  const rows = db.prepare(`SELECT * FROM tools ORDER BY ${orderCol} ${dir} LIMIT ?`).all(Number(limit));
  res.json(rows);
});

// POST /api/tools
router.post('/', (req, res) => {
  const id = uuidv4();
  const now = new Date().toISOString();
  const {
    tool_id, name, category, serial_number = '', status = 'available',
    assigned_kit = '', checked_out_by = '', checked_out_at = '', image_url = ''
  } = req.body;

  db.prepare(`
    INSERT INTO tools (id, tool_id, name, category, serial_number, status, assigned_kit, checked_out_by, checked_out_at, image_url, created_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, tool_id, name, category, serial_number, status, assigned_kit, checked_out_by, checked_out_at, image_url, now);

  const row = db.prepare('SELECT * FROM tools WHERE id = ?').get(id);
  res.status(201).json(row);
});

// PUT /api/tools/:id
router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM tools WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Tool not found' });

  const updates = { ...req.body };
  const fields = Object.keys(updates);
  const setClause = fields.map(f => `${f} = ?`).join(', ');
  const values = fields.map(f => updates[f]);

  db.prepare(`UPDATE tools SET ${setClause} WHERE id = ?`).run(...values, req.params.id);

  const row = db.prepare('SELECT * FROM tools WHERE id = ?').get(req.params.id);
  res.json(row);
});

// DELETE /api/tools/:id
router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM tools WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Tool not found' });
  res.json({ success: true });
});

export default router;
