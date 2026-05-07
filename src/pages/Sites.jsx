import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Site, Fault } from '@/api/entities';
import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, MapPin, Lock, Pencil, Train, Bus } from 'lucide-react';
import { can } from '@/lib/permissions';

const ZONE_CLR = {
  public: 'border-sky-500/30 text-sky-400 bg-sky-500/10',
  restricted: 'border-amber-500/30 text-amber-400 bg-amber-500/10',
  high_security: 'border-red-500/30 text-red-400 bg-red-500/10',
};

const empty = { name: '', code: '', type: 'rail_station', zone: 'restricted', location: '', active: true };

export default function Sites() {
  const { user } = useOutletContext();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [d, setD] = useState(empty);

  const { data: sites = [] } = useQuery({
    queryKey: ['sites'], queryFn: () => Site.list(),
  });
  const { data: faults = [] } = useQuery({
    queryKey: ['faults'], queryFn: () => Fault.list('-created_date', 200),
  });

  const save = useMutation({
    mutationFn: async (v) => {
      if (editing) await Site.update(editing.id, v);
      else await Site.create(v);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sites'] }); setOpen(false); setEditing(null); },
  });

  const startEdit = (s) => { setEditing(s); setD({ ...empty, ...s }); setOpen(true); };
  const startNew = () => { setEditing(null); setD(empty); setOpen(true); };

  return (
    <div className="p-6 lg:p-10 max-w-[1600px] mx-auto">
      <PageHeader
        eyebrow="// SITE REGISTRY"
        title="Sites"
        description="Authorised maintenance locations across rail, metro, tram, and bus networks."
        actions={
          can.manageSites(user) && (
            <Button onClick={startNew} className="gap-2"><Plus className="w-4 h-4" /> Add site</Button>
          )
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sites.map(s => {
          const siteFaults = faults.filter(f => f.site_id === s.id && !['resolved','rejected'].includes(f.status));
          const Icon = s.type?.includes('bus') ? Bus : Train;
          return (
            <div key={s.id} className="rounded-lg border border-border bg-card/60 p-5 hover:border-primary/30 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 rounded border border-primary/30 bg-primary/5 text-primary">
                  <Icon className="w-5 h-5" />
                </div>
                <span className={`px-1.5 py-0.5 text-[10px] uppercase font-mono rounded border ${ZONE_CLR[s.zone] || ''}`}>
                  <Lock className="w-2.5 h-2.5 inline mr-1" />{s.zone?.replace('_',' ')}
                </span>
              </div>
              <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-mono">{s.code}</div>
              <div className="font-display text-lg font-semibold leading-tight mt-0.5">{s.name}</div>
              <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {s.location || '—'} · {s.type?.replace('_',' ')}
              </div>
              <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                <div>
                  <div className="font-display text-2xl font-bold">{siteFaults.length}</div>
                  <div className="text-[10px] uppercase tracking-[0.2em] font-mono text-muted-foreground">Open faults</div>
                </div>
                {can.manageSites(user) && (
                  <Button size="sm" variant="ghost" className="gap-2" onClick={() => startEdit(s)}>
                    <Pencil className="w-3 h-3" /> Edit
                  </Button>
                )}
              </div>
            </div>
          );
        })}
        {sites.length === 0 && (
          <div className="col-span-full rounded-lg border border-border bg-card/60 p-12 text-center text-sm text-muted-foreground">
            No sites registered yet.
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display">{editing ? 'Edit site' : 'Add site'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-2"><Label>Code</Label><Input value={d.code} onChange={e => setD({ ...d, code: e.target.value })} className="font-mono" placeholder="KX-01" /></div>
            <div className="col-span-2 space-y-2"><Label>Name</Label><Input value={d.name} onChange={e => setD({ ...d, name: e.target.value })} placeholder="King's Cross Station" /></div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={d.type} onValueChange={v => setD({ ...d, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['rail_station','metro_station','tram_depot','bus_depot','tunnel','service_corridor','plant_room'].map(t =>
                    <SelectItem key={t} value={t}>{t.replace('_',' ')}</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Zone</Label>
              <Select value={d.zone} onValueChange={v => setD({ ...d, zone: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="restricted">Restricted</SelectItem>
                  <SelectItem value="high_security">High security</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-2"><Label>Location</Label><Input value={d.location} onChange={e => setD({ ...d, location: e.target.value })} placeholder="London, UK" /></div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => save.mutate(d)} disabled={save.isPending || !d.name || !d.code}>
              {save.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}