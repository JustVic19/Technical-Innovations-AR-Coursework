import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'sentinel-ar-local-dev-secret';

export function authenticateToken(req, res, next) {
  // Skip auth for login endpoint
  if (req.path === '/api/auth/login' && req.method === 'POST') {
    return next();
  }

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer <token>"

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}
