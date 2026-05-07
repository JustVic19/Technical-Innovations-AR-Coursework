import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db.js';

const router = Router();

// GET /api/sites
router.get('/', (req, res) => {
  const { order = '-created_date', limit = 100 } = req.query;
  const desc = order.startsWith('-');
  const col = order.replace(/^-/, '');
  const allowedCols = ['created_date', 'name', 'code', 'type'];
  const orderCol = allowedCols.includes(col) ? col : 'created_date';
  const dir = desc ? 'DESC' : 'ASC';

  const rows = db.prepare(`SELECT * FROM sites ORDER BY ${orderCol} ${dir} LIMIT ?`).all(Number(limit));
  res.json(rows);
});

// POST /api/sites
router.post('/', (req, res) => {
  const id = uuidv4();
  const now = new Date().toISOString();
  const {
    name, code, type, zone = 'restricted', location = '',
    schematic_url = '', active = 1
  } = req.body;

  db.prepare(`
    INSERT INTO sites (id, name, code, type, zone, location, schematic_url, active, created_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, name, code, type, zone, location, schematic_url, active ? 1 : 0, now);

  const row = db.prepare('SELECT * FROM sites WHERE id = ?').get(id);
  res.status(201).json(row);
});

// PUT /api/sites/:id
router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM sites WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Site not found' });

  const updates = { ...req.body };
  if ('active' in updates) updates.active = updates.active ? 1 : 0;

  const fields = Object.keys(updates);
  const setClause = fields.map(f => `${f} = ?`).join(', ');
  const values = fields.map(f => updates[f]);

  db.prepare(`UPDATE sites SET ${setClause} WHERE id = ?`).run(...values, req.params.id);

  const row = db.prepare('SELECT * FROM sites WHERE id = ?').get(req.params.id);
  res.json(row);
});

// DELETE /api/sites/:id
router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM sites WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Site not found' });
  res.json({ success: true });
});

export default router;
