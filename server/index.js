import express from 'express';
import cors from 'cors';
import { authenticateToken } from './middleware/auth.js';
import authRoutes from './routes/auth.js';
import faultsRoutes from './routes/faults.js';
import sitesRoutes from './routes/sites.js';
import toolsRoutes from './routes/tools.js';
import toolChecksRoutes from './routes/toolChecks.js';
import auditLogsRoutes from './routes/auditLogs.js';
import usersRoutes from './routes/users.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// Public routes — login doesn't need a token
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api/faults', authenticateToken, faultsRoutes);
app.use('/api/sites', authenticateToken, sitesRoutes);
app.use('/api/tools', authenticateToken, toolsRoutes);
app.use('/api/tool-checks', authenticateToken, toolChecksRoutes);
app.use('/api/audit-logs', authenticateToken, auditLogsRoutes);
app.use('/api/users', authenticateToken, usersRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Serve frontend in production
import path from 'path';
import { fileURLToPath } from 'url';

if (process.env.NODE_ENV === 'production') {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  app.use(express.static(path.join(__dirname, '..', 'dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '..', 'dist', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`\n  🛡️  SentinelAR API running at http://localhost:${PORT}`);
  console.log(`     Health check: http://localhost:${PORT}/api/health\n`);
});
