import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { SeverityBadge, StatusBadge } from '@/components/SeverityBadge';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Fault } from '@/api/entities';
import { format } from 'date-fns';
import { can } from '@/lib/permissions';
import { logAudit } from '@/lib/audit';
import { Pencil, CheckCircle2, XCircle, MessageSquare, Hash, MapPin, User as UserIcon } from 'lucide-react';

export default function FaultDetailDialog({ fault, sites, user, onOpenChange, onEdit }) {
  const qc = useQueryClient();
  const [note, setNote] = useState('');

  const update = useMutation({
    mutationFn: async (patch) => {
      const merged = { ...fault, ...patch };
      // strip read-only system fields
      delete merged.id; delete merged.created_date; delete merged.updated_date; delete merged.created_by;
      await Fault.update(fault.id, merged);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['faults'] }),
  });

  if (!fault) return null;
  const site = sites.find(s => s.id === fault.site_id);

  const acknowledge = async () => {
    await update.mutateAsync({ status: 'acknowledged' });
    await logAudit({ actor: user.email, actor_role: user.role, action: 'fault_updated', target_type: 'Fault', target_id: fault.id, details: 'acknowledged' });
  };
  const resolve = async () => {
    await update.mutateAsync({ status: 'resolved', approved_by: user.email });
    await logAudit({ actor: user.email, actor_role: user.role, action: 'fault_resolved', target_type: 'Fault', target_id: fault.id, details: fault.title });
  };
  const reject = async () => {
    await update.mutateAsync({ status: 'rejected', approved_by: user.email });
    await logAudit({ actor: user.email, actor_role: user.role, action: 'fault_rejected', target_type: 'Fault', target_id: fault.id, details: fault.title, severity: 'warning' });
  };

  const addAnnotation = async () => {
    if (!note.trim()) return;
    const annotations = [...(fault.annotations || []), { author: user.email, text: note, timestamp: new Date().toISOString() }];
    await update.mutateAsync({ annotations });
    setNote('');
  };

  return (
    <Dialog open={!!fault} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-3 flex-wrap">
            {fault.title}
            <SeverityBadge severity={fault.severity} />
            <StatusBadge status={fault.status} />
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 py-2 text-xs">
          <Meta icon={Hash} label="Marker" value={fault.marker_id || '—'} />
          <Meta icon={MapPin} label="Site" value={site ? `${site.code}` : '—'} />
          <Meta icon={UserIcon} label="Reported by" value={fault.created_by?.split('@')[0] || '—'} />
          <Meta icon={UserIcon} label="Approved by" value={fault.approved_by?.split('@')[0] || '—'} />
        </div>

        <div className="rounded-md border border-border bg-secondary/40 p-3 text-sm">
          {fault.description || <span className="text-muted-foreground italic">No description provided.</span>}
        </div>

        <div className="rounded-md border border-border p-3">
          <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-mono mb-2 flex items-center gap-2">
            <MessageSquare className="w-3 h-3" /> Annotations
          </div>
          <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
            {(fault.annotations || []).length === 0 && (
              <div className="text-xs text-muted-foreground italic">No annotations yet.</div>
            )}
            {(fault.annotations || []).map((a, i) => (
              <div key={i} className="text-xs border-l-2 border-primary/40 pl-2">
                <div className="text-muted-foreground font-mono text-[10px]">
                  {a.author} · {a.timestamp && format(new Date(a.timestamp), 'd MMM HH:mm')}
                </div>
                <div>{a.text}</div>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Add annotation..." rows={2} className="text-sm" />
            <Button size="sm" onClick={addAnnotation} disabled={!note.trim()}>Add</Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
          <Button size="sm" variant="outline" onClick={onEdit} className="gap-2">
            <Pencil className="w-3.5 h-3.5" /> Edit
          </Button>
          {fault.status === 'reported' && (
            <Button size="sm" variant="outline" onClick={acknowledge}>Acknowledge</Button>
          )}
          {can.approveFault(user) && fault.status !== 'resolved' && (
            <Button size="sm" onClick={resolve} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
              <CheckCircle2 className="w-3.5 h-3.5" /> Approve resolution
            </Button>
          )}
          {can.rejectFault(user) && fault.status !== 'rejected' && fault.status !== 'resolved' && (
            <Button size="sm" variant="outline" onClick={reject} className="gap-2 text-red-400 border-red-500/30 hover:bg-red-500/10">
              <XCircle className="w-3.5 h-3.5" /> Reject
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Meta({ icon: Icon, label, value }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-mono flex items-center gap-1 mb-1">
        <Icon className="w-3 h-3" />{label}
      </div>
      <div className="font-mono">{value}</div>
    </div>
  );
}