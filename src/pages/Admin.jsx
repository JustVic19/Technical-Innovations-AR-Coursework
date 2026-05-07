import React, { useState } from 'react';
import { useOutletContext, Navigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User } from '@/api/entities';
import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { UserPlus, Shield, ShieldAlert, ShieldCheck, Mail } from 'lucide-react';
import { ROLE_LABELS, can } from '@/lib/permissions';
import { logAudit } from '@/lib/audit';

const ROLE_CLR = {
  admin: 'border-red-500/30 text-red-400 bg-red-500/10',
  supervisor: 'border-amber-500/30 text-amber-400 bg-amber-500/10',
  technician: 'border-cyan-500/30 text-cyan-400 bg-cyan-500/10',
};

export default function Admin() {
  const { user } = useOutletContext();
  const qc = useQueryClient();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('technician');

  const { data: users = [] } = useQuery({
    queryKey: ['users'], queryFn: () => User.list('-created_date'),
  });

  const updateUser = useMutation({
    mutationFn: ({ id, data }) => User.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });

  const invite = useMutation({
    mutationFn: async () => {
      // Create user locally with default password 'changeme123'
      await User.create({ email: inviteEmail, role: inviteRole, full_name: '' });
    },
    onSuccess: async () => {
      await logAudit({ actor: user.email, actor_role: user.role, action: 'user_invited', details: `${inviteEmail} as ${inviteRole}` });
      setInviteOpen(false); setInviteEmail(''); setInviteRole('technician');
      qc.invalidateQueries({ queryKey: ['users'] });
    },
  });

  if (!can.manageUsers(user)) return <Navigate to="/" replace />;

  const changeRole = async (u, role) => {
    await updateUser.mutateAsync({ id: u.id, data: { role } });
    await logAudit({ actor: user.email, actor_role: user.role, action: 'user_role_changed', target_type: 'User', target_id: u.id, details: `${u.email} → ${role}` });
  };

  const toggleActive = async (u) => {
    await updateUser.mutateAsync({ id: u.id, data: { active: !u.active } });
    await logAudit({
      actor: user.email, actor_role: user.role,
      action: 'user_deactivated',
      target_type: 'User', target_id: u.id,
      details: `${u.email} ${u.active ? 'deactivated' : 'reactivated'}`,
      severity: 'warning',
    });
  };

  return (
    <div className="p-6 lg:p-10 max-w-[1600px] mx-auto">
      <PageHeader
        eyebrow="// ACCESS CONTROL"
        title="User Administration"
        description="Manage roles, clearance, and access for technicians, supervisors, and admins."
        actions={
          <Button onClick={() => setInviteOpen(true)} className="gap-2"><UserPlus className="w-4 h-4" /> Invite user</Button>
        }
      />

      <div className="rounded-lg border border-border bg-card/60 overflow-hidden">
        <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-border bg-secondary/40 text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-mono">
          <div className="col-span-4">User</div>
          <div className="col-span-3">Role</div>
          <div className="col-span-2">Clearance</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-1 text-right">Actions</div>
        </div>
        {users.map(u => (
          <div key={u.id} className="grid grid-cols-12 gap-4 px-5 py-4 border-b border-border/60 last:border-0 hover:bg-secondary/30">
            <div className="col-span-4 min-w-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-secondary border border-border flex items-center justify-center text-sm font-bold">
                  {(u.full_name || u.email || '?').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="font-medium truncate">{u.full_name || '—'}</div>
                  <div className="text-xs text-muted-foreground font-mono truncate">{u.email}</div>
                </div>
              </div>
            </div>
            <div className="col-span-3">
              <Select value={u.role || 'technician'} onValueChange={(v) => changeRole(u, v)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="technician">Technician</SelectItem>
                  <SelectItem value="supervisor">Supervisor</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              <span className={`mt-1 inline-block px-1.5 py-0.5 text-[10px] uppercase font-mono rounded border ${ROLE_CLR[u.role] || ROLE_CLR.technician}`}>
                <Shield className="w-2.5 h-2.5 inline mr-1" />{ROLE_LABELS[u.role] || 'Technician'}
              </span>
            </div>
            <div className="col-span-2 font-mono text-xs">{u.clearance_level || 'L1'}</div>
            <div className="col-span-2">
              {u.active === false ? (
                <span className="px-1.5 py-0.5 text-[10px] uppercase font-mono rounded border border-red-500/30 text-red-400 bg-red-500/10">
                  <ShieldAlert className="w-2.5 h-2.5 inline mr-1" />Inactive
                </span>
              ) : (
                <span className="px-1.5 py-0.5 text-[10px] uppercase font-mono rounded border border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
                  <ShieldCheck className="w-2.5 h-2.5 inline mr-1" />Active
                </span>
              )}
            </div>
            <div className="col-span-1 text-right">
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => toggleActive(u)}>
                {u.active === false ? 'Reactivate' : 'Disable'}
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display flex items-center gap-2"><Mail className="w-4 h-4" /> Invite new user</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="engineer@transit.gov" />
            </div>
            <div className="space-y-2">
              <Label>Initial role</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="technician">Field Technician</SelectItem>
                  <SelectItem value="supervisor">Supervisor / Engineer</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                </SelectContent>
              </Select>
              <div className="text-[10px] text-muted-foreground font-mono">New users are created with a default password: changeme123</div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setInviteOpen(false)}>Cancel</Button>
            <Button onClick={() => invite.mutate()} disabled={!inviteEmail || invite.isPending}>
              {invite.isPending ? 'Sending...' : 'Send invitation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}