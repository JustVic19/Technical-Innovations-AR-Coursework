import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db.js';

const router = Router();

// GET /api/audit-logs
router.get('/', (req, res) => {
  const { order = '-created_date', limit = 500 } = req.query;
  const desc = order.startsWith('-');
  const col = order.replace(/^-/, '');
  const allowedCols = ['created_date', 'action', 'severity', 'actor'];
  const orderCol = allowedCols.includes(col) ? col : 'created_date';
  const dir = desc ? 'DESC' : 'ASC';

  const rows = db.prepare(`SELECT * FROM audit_logs ORDER BY ${orderCol} ${dir} LIMIT ?`).all(Number(limit));
  res.json(rows);
});

// POST /api/audit-logs
router.post('/', (req, res) => {
  const id = uuidv4();
  const now = new Date().toISOString();
  const {
    actor, actor_role = '', action, target_type = '', target_id = '',
    details = '', ip_address = '', device_id = '', severity = 'info'
  } = req.body;

  db.prepare(`
    INSERT INTO audit_logs (id, actor, actor_role, action, target_type, target_id, details, ip_address, device_id, severity, created_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, actor, actor_role, action, target_type, target_id, details, ip_address, device_id, severity, now);

  const row = db.prepare('SELECT * FROM audit_logs WHERE id = ?').get(id);
  res.status(201).json(row);
});

export default router;
