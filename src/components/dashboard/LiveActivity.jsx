import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { AuditLog } from '@/api/entities';
import { formatDistanceToNow } from 'date-fns';
import { Radio, AlertCircle, Shield, Wrench } from 'lucide-react';

const ICONS = {
  fault_created: AlertCircle,
  fault_resolved: Shield,
  tool_check_run: Wrench,
  login: Radio,
  anomaly_detected: AlertCircle,
};

export default function LiveActivity() {
  const { data: logs = [] } = useQuery({
    queryKey: ['recentAudit'],
    queryFn: () => AuditLog.list('-created_date', 12),
    refetchInterval: 15000,
  });

  return (
    <div className="rounded-lg border border-border bg-card/60 backdrop-blur-sm p-5 h-full">
      <div className="flex items-center gap-2 mb-4">
        <span className="w-2 h-2 rounded-full bg-emerald-400 pulse-ring" />
        <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-mono">Live feed</div>
      </div>
      <div className="font-display text-lg font-semibold mb-4">Recent activity</div>

      <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
        {logs.length === 0 && (
          <div className="text-xs text-muted-foreground font-mono">No activity yet.</div>
        )}
        {logs.map(log => {
          const Icon = ICONS[log.action] || Radio;
          return (
            <div key={log.id} className="flex gap-3 text-xs border-l-2 border-border pl-3 hover:border-primary transition-colors">
              <Icon className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="truncate">
                  <span className="font-medium">{log.actor?.split('@')[0]}</span>{' '}
                  <span className="text-muted-foreground">{(log.action || '').replace(/_/g, ' ')}</span>
                </div>
                <div className="text-muted-foreground/70 font-mono text-[10px]">
                  {log.created_date && formatDistanceToNow(new Date(log.created_date), { addSuffix: true })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}