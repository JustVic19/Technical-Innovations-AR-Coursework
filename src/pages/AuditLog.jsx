import React, { useState, useMemo } from 'react';
import { useOutletContext, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AuditLog as AuditLogEntity } from '@/api/entities';
import PageHeader from '@/components/PageHeader';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Shield, AlertCircle, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { can } from '@/lib/permissions';
import AnomalyBanner from '@/components/audit/AnomalyBanner';

const SEV_CLR = {
  info: 'border-sky-500/30 text-sky-400 bg-sky-500/5',
  warning: 'border-amber-500/30 text-amber-400 bg-amber-500/5',
  critical: 'border-red-500/30 text-red-400 bg-red-500/5',
};

export default function AuditLog() {
  const { user } = useOutletContext();
  const [search, setSearch] = useState('');
  const [severity, setSeverity] = useState('all');

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['audit'],
    queryFn: () => AuditLogEntity.list('-created_date', 500),
    refetchInterval: 10000,
  });

  const filtered = useMemo(() => logs.filter(l => {
    if (severity !== 'all' && l.severity !== severity) return false;
    if (search) {
      const s = search.toLowerCase();
      return [l.actor, l.action, l.details, l.target_id].some(x => (x || '').toLowerCase().includes(s));
    }
    return true;
  }), [logs, search, severity]);

  if (!can.viewAuditLog(user)) return <Navigate to="/" replace />;

  return (
    <div className="p-6 lg:p-10 max-w-[1600px] mx-auto">
      <PageHeader
        eyebrow="// SECURITY AUDIT"
        title="Audit Log"
        description="Tamper-evident chronological record of all authenticated activity across the system."
      />

      <AnomalyBanner logs={logs} />

      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search by actor, action, target..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={severity} onValueChange={setSeverity}>
          <SelectTrigger className="md:w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All severity</SelectItem>
            <SelectItem value="info">Info</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border border-border bg-card/60 overflow-hidden font-mono text-xs">
        {isLoading ? (
          <div className="p-10 text-center text-muted-foreground">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground flex flex-col items-center gap-2">
            <Shield className="w-8 h-8" /> No audit entries.
          </div>
        ) : (
          filtered.map((l, i) => (
            <div key={l.id} className="grid grid-cols-12 gap-3 px-4 py-2.5 border-b border-border/50 last:border-0 hover:bg-secondary/30">
              <div className="col-span-2 text-muted-foreground">
                {l.created_date && format(new Date(l.created_date), 'dd MMM HH:mm:ss')}
              </div>
              <div className="col-span-1">
                <span className={`px-1.5 py-0.5 rounded border ${SEV_CLR[l.severity] || SEV_CLR.info}`}>
                  {l.severity || 'info'}
                </span>
              </div>
              <div className="col-span-3 truncate">{l.actor}</div>
              <div className="col-span-2 text-primary uppercase tracking-wider">{l.action}</div>
              <div className="col-span-4 text-muted-foreground truncate">{l.details || (l.target_type ? `${l.target_type}/${l.target_id}` : '')}</div>
            </div>
          ))
        )}
      </div>

      <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-mono mt-4 flex items-center gap-2">
        <Activity className="w-3 h-3 text-emerald-400" /> Live · auto-refresh every 10s · {filtered.length} entries
      </div>
    </div>
  );
}