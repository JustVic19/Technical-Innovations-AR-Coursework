import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db.js';
import { signToken, authenticateToken } from '../middleware/auth.js';

const router = Router();

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ? AND active = 1').get(email);

  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const valid = bcrypt.compareSync(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = signToken({
    id: user.id,
    email: user.email,
    role: user.role,
    full_name: user.full_name,
  });

  // Return user info (without password_hash) + token
  const { password_hash, ...safeUser } = user;
  safeUser.assigned_site_ids = JSON.parse(safeUser.assigned_site_ids || '[]');

  res.json({ token, user: safeUser });
});

// GET /api/auth/me (requires valid token)
router.get('/me', authenticateToken, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ? AND active = 1').get(req.user.id);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const { password_hash, ...safeUser } = user;
  safeUser.assigned_site_ids = JSON.parse(safeUser.assigned_site_ids || '[]');

  res.json(safeUser);
});

export default router;
