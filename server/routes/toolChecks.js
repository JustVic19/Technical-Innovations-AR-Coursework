import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db.js';

const router = Router();

// GET /api/tool-checks
router.get('/', (req, res) => {
  const { order = '-created_date', limit = 50 } = req.query;
  const desc = order.startsWith('-');
  const col = order.replace(/^-/, '');
  const allowedCols = ['created_date', 'result', 'check_type'];
  const orderCol = allowedCols.includes(col) ? col : 'created_date';
  const dir = desc ? 'DESC' : 'ASC';

  const rows = db.prepare(`SELECT * FROM tool_checks ORDER BY ${orderCol} ${dir} LIMIT ?`).all(Number(limit));

  res.json(rows.map(r => ({
    ...r,
    expected_tools: JSON.parse(r.expected_tools || '[]'),
    scanned_tools: JSON.parse(r.scanned_tools || '[]'),
    missing_tools: JSON.parse(r.missing_tools || '[]'),
    extra_tools: JSON.parse(r.extra_tools || '[]'),
  })));
});

// POST /api/tool-checks
router.post('/', (req, res) => {
  const id = uuidv4();
  const now = new Date().toISOString();
  const {
    kit_id, site_id = '', check_type = 'pre_job', expected_tools = [],
    scanned_tools = [], missing_tools = [], extra_tools = [],
    result = 'pass', technician = '', fault_id = ''
  } = req.body;

  db.prepare(`
    INSERT INTO tool_checks (id, kit_id, site_id, check_type, expected_tools, scanned_tools, missing_tools, extra_tools, result, technician, fault_id, created_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, kit_id, site_id, check_type,
    JSON.stringify(expected_tools), JSON.stringify(scanned_tools),
    JSON.stringify(missing_tools), JSON.stringify(extra_tools),
    result, technician, fault_id, now);

  const row = db.prepare('SELECT * FROM tool_checks WHERE id = ?').get(id);
  res.status(201).json({
    ...row,
    expected_tools: JSON.parse(row.expected_tools || '[]'),
    scanned_tools: JSON.parse(row.scanned_tools || '[]'),
    missing_tools: JSON.parse(row.missing_tools || '[]'),
    extra_tools: JSON.parse(row.extra_tools || '[]'),
  });
});

// PUT /api/tool-checks/:id
router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM tool_checks WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'ToolCheck not found' });

  const updates = { ...req.body };
  if (updates.expected_tools) updates.expected_tools = JSON.stringify(updates.expected_tools);
  if (updates.scanned_tools) updates.scanned_tools = JSON.stringify(updates.scanned_tools);
  if (updates.missing_tools) updates.missing_tools = JSON.stringify(updates.missing_tools);
  if (updates.extra_tools) updates.extra_tools = JSON.stringify(updates.extra_tools);

  const fields = Object.keys(updates);
  const setClause = fields.map(f => `${f} = ?`).join(', ');
  const values = fields.map(f => updates[f]);

  db.prepare(`UPDATE tool_checks SET ${setClause} WHERE id = ?`).run(...values, req.params.id);

  const row = db.prepare('SELECT * FROM tool_checks WHERE id = ?').get(req.params.id);
  res.json({
    ...row,
    expected_tools: JSON.parse(row.expected_tools || '[]'),
    scanned_tools: JSON.parse(row.scanned_tools || '[]'),
    missing_tools: JSON.parse(row.missing_tools || '[]'),
    extra_tools: JSON.parse(row.extra_tools || '[]'),
  });
});

// DELETE /api/tool-checks/:id
router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM tool_checks WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'ToolCheck not found' });
  res.json({ success: true });
});

export default router;
