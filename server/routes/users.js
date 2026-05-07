import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import db from '../db.js';

const router = Router();

// GET /api/users
router.get('/', (req, res) => {
  const { order = '-created_date' } = req.query;
  const desc = order.startsWith('-');
  const col = order.replace(/^-/, '');
  const allowedCols = ['created_date', 'full_name', 'email', 'role'];
  const orderCol = allowedCols.includes(col) ? col : 'created_date';
  const dir = desc ? 'DESC' : 'ASC';

  const rows = db.prepare(`SELECT * FROM users ORDER BY ${orderCol} ${dir}`).all();

  // Strip password hashes and parse JSON fields
  res.json(rows.map(({ password_hash, ...u }) => ({
    ...u,
    assigned_site_ids: JSON.parse(u.assigned_site_ids || '[]'),
  })));
});

// PUT /api/users/:id
router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'User not found' });

  const updates = { ...req.body };
  if ('active' in updates) updates.active = updates.active ? 1 : 0;
  if (updates.assigned_site_ids) updates.assigned_site_ids = JSON.stringify(updates.assigned_site_ids);
  // Don't allow updating password_hash through this route
  delete updates.password_hash;

  const fields = Object.keys(updates);
  if (fields.length === 0) return res.json(existing);

  const setClause = fields.map(f => `${f} = ?`).join(', ');
  const values = fields.map(f => updates[f]);

  db.prepare(`UPDATE users SET ${setClause} WHERE id = ?`).run(...values, req.params.id);

  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  const { password_hash, ...safeUser } = row;
  safeUser.assigned_site_ids = JSON.parse(safeUser.assigned_site_ids || '[]');
  res.json(safeUser);
});

// POST /api/users/invite — create a new user with a default password
router.post('/invite', (req, res) => {
  const { email, role = 'technician', full_name = '' } = req.body;

  if (!email) return res.status(400).json({ error: 'Email is required' });

  const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (exists) return res.status(409).json({ error: 'User already exists' });

  const id = uuidv4();
  const password_hash = bcrypt.hashSync('changeme123', 10);
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO users (id, email, password_hash, full_name, role, created_date)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, email, password_hash, full_name || email.split('@')[0], role, now);

  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  const { password_hash: _, ...safeUser } = row;
  safeUser.assigned_site_ids = JSON.parse(safeUser.assigned_site_ids || '[]');
  res.status(201).json(safeUser);
});

export default router;
