import React, { useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Fault, Site } from '@/api/entities';
import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, AlertTriangle } from 'lucide-react';
import FaultFormDialog from '@/components/faults/FaultFormDialog';
import FaultDetailDialog from '@/components/faults/FaultDetailDialog';
import FaultRow from '@/components/faults/FaultRow';
import { can } from '@/lib/permissions';
import { logAudit } from '@/lib/audit';

export default function Faults() {
  const { user } = useOutletContext();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');

  const { data: faults = [], isLoading } = useQuery({
    queryKey: ['faults'],
    queryFn: () => Fault.list('-created_date', 200),
  });
  const { data: sites = [] } = useQuery({
    queryKey: ['sites'],
    queryFn: () => Site.list(),
  });

  const filtered = useMemo(() => {
    return faults.filter(f => {
      if (statusFilter !== 'all' && f.status !== statusFilter) return false;
      if (severityFilter !== 'all' && f.severity !== severityFilter) return false;
      if (search) {
        const s = search.toLowerCase();
        return (f.title || '').toLowerCase().includes(s) ||
               (f.marker_id || '').toLowerCase().includes(s) ||
               (f.description || '').toLowerCase().includes(s);
      }
      return true;
    });
  }, [faults, search, statusFilter, severityFilter]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (editing) {
        await Fault.update(editing.id, data);
        await logAudit({ actor: user.email, actor_role: user.role, action: 'fault_updated', target_type: 'Fault', target_id: editing.id, details: data.title });
      } else {
        const created = await Fault.create(data);
        await logAudit({ actor: user.email, actor_role: user.role, action: 'fault_created', target_type: 'Fault', target_id: created.id, details: data.title, severity: data.severity === 'critical' ? 'critical' : 'info' });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['faults'] });
      setShowForm(false); setEditing(null);
    },
  });

  return (
    <div className="p-6 lg:p-10 max-w-[1600px] mx-auto">
      <PageHeader
        eyebrow="// FAULT REGISTER"
        title="Faults"
        description="Logged anomalies across all assigned sites with full audit chain."
        actions={
          can.createFault(user) && (
            <Button onClick={() => { setEditing(null); setShowForm(true); }} className="gap-2">
              <Plus className="w-4 h-4" /> Log fault
            </Button>
          )
        }
      />

      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search by title, marker, description..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="md:w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            <SelectItem value="reported">Reported</SelectItem>
            <SelectItem value="acknowledged">Acknowledged</SelectItem>
            <SelectItem value="in_progress">In progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="md:w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All severity</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border border-border bg-card/60 backdrop-blur-sm overflow-hidden">
        <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-border bg-secondary/40 text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-mono">
          <div className="col-span-5 md:col-span-4">Fault</div>
          <div className="col-span-3 md:col-span-2">Site</div>
          <div className="hidden md:block md:col-span-2">Severity</div>
          <div className="col-span-2 md:col-span-2">Status</div>
          <div className="col-span-2 md:col-span-2 text-right">Logged</div>
        </div>

        {isLoading ? (
          <div className="p-10 text-center text-muted-foreground font-mono text-sm">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center">
            <AlertTriangle className="w-8 h-8 mx-auto text-muted-foreground mb-3" />
            <div className="text-sm text-muted-foreground">No faults match your filters.</div>
          </div>
        ) : (
          filtered.map(f => (
            <FaultRow
              key={f.id}
              fault={f}
              site={sites.find(s => s.id === f.site_id)}
              onClick={() => setSelected(f)}
            />
          ))
        )}
      </div>

      <FaultFormDialog
        open={showForm}
        onOpenChange={setShowForm}
        fault={editing}
        sites={sites}
        onSubmit={(data) => saveMutation.mutate(data)}
        loading={saveMutation.isPending}
      />

      <FaultDetailDialog
        fault={selected}
        sites={sites}
        user={user}
        onOpenChange={(o) => !o && setSelected(null)}
        onEdit={() => { setEditing(selected); setSelected(null); setShowForm(true); }}
      />
    </div>
  );
}