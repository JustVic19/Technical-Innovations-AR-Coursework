// Role-based permission helpers
export const ROLES = {
  ADMIN: 'admin',
  SUPERVISOR: 'supervisor',
  TECHNICIAN: 'technician',
};

export const ROLE_LABELS = {
  admin: 'Administrator',
  supervisor: 'Supervisor / Engineer',
  technician: 'Field Technician',
};

export const can = {
  manageUsers: (u) => u?.role === 'admin',
  viewAuditLog: (u) => u?.role === 'admin',
  manageSites: (u) => u?.role === 'admin',
  manageDevices: (u) => u?.role === 'admin',
  approveFault: (u) => u?.role === 'admin' || u?.role === 'supervisor',
  assignFault: (u) => u?.role === 'admin' || u?.role === 'supervisor',
  rejectFault: (u) => u?.role === 'admin' || u?.role === 'supervisor',
  createFault: (u) => !!u,
  resolveFault: (u) => !!u,
  runToolCheck: (u) => !!u,
  viewAnalytics: (u) => u?.role === 'admin' || u?.role === 'supervisor',
  manageTools: (u) => u?.role === 'admin' || u?.role === 'supervisor',
};

export const SEVERITY_COLORS = {
  low: 'hsl(var(--severity-low))',
  medium: 'hsl(var(--severity-medium))',
  high: 'hsl(var(--severity-high))',
  critical: 'hsl(var(--severity-critical))',
};

export const SEVERITY_CLASSES = {
  low: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  medium: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  high: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  critical: 'bg-red-500/15 text-red-400 border-red-500/30',
};

export const STATUS_CLASSES = {
  reported: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
  acknowledged: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
  in_progress: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  resolved: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  rejected: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
};