import React, { useMemo } from 'react';
import { AlertTriangle } from 'lucide-react';

// Simple heuristic anomaly detection over recent logs
export default function AnomalyBanner({ logs }) {
  const anomalies = useMemo(() => {
    const out = [];
    const recent = logs.filter(l => Date.now() - new Date(l.created_date).getTime() < 24 * 3600 * 1000);

    // Burst of failed logins
    const failedLogins = recent.filter(l => l.action === 'login_failed');
    if (failedLogins.length >= 5) {
      out.push(`${failedLogins.length} failed login attempts in last 24h`);
    }

    // Multiple criticals
    const criticals = recent.filter(l => l.severity === 'critical');
    if (criticals.length >= 3) {
      out.push(`${criticals.length} critical events in last 24h`);
    }

    // Off-hours activity (00:00 - 05:00)
    const offHours = recent.filter(l => {
      const h = new Date(l.created_date).getHours();
      return h >= 0 && h < 5;
    });
    if (offHours.length >= 5) {
      out.push(`${offHours.length} off-hours actions detected (00:00–05:00)`);
    }

    // Repeated tool-missing events
    const missing = recent.filter(l => l.action === 'tool_missing' || (l.action === 'tool_check_run' && (l.details || '').includes('fail')));
    if (missing.length >= 2) {
      out.push(`${missing.length} tool-check failures recorded`);
    }

    return out;
  }, [logs]);

  if (anomalies.length === 0) return null;

  return (
    <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-4 mb-4 flex gap-3">
      <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
      <div className="flex-1">
        <div className="font-display font-semibold text-red-400 mb-1">Anomaly detection — {anomalies.length} alert{anomalies.length > 1 ? 's' : ''}</div>
        <ul className="text-xs text-red-300/90 space-y-0.5 font-mono">
          {anomalies.map((a, i) => <li key={i}>• {a}</li>)}
        </ul>
      </div>
    </div>
  );
}