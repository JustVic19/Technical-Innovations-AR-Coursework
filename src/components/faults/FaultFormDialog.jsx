import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const empty = {
  title: '', description: '', marker_id: '', site_id: '',
  category: 'structural_wear', severity: 'medium', status: 'reported',
  position: { x: 50, y: 50 },
};

export default function FaultFormDialog({ open, onOpenChange, fault, sites, onSubmit, loading }) {
  const [data, setData] = useState(empty);

  useEffect(() => {
    if (open) setData(fault ? { ...empty, ...fault } : empty);
  }, [open, fault]);

  const set = (k, v) => setData(d => ({ ...d, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display">{fault ? 'Edit fault' : 'Log new fault'}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-2">
          <div className="col-span-2 space-y-2">
            <Label>Title</Label>
            <Input value={data.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Suspension fault — bay 4" />
          </div>

          <div className="space-y-2">
            <Label>AR Marker ID</Label>
            <Input value={data.marker_id} onChange={e => set('marker_id', e.target.value)} placeholder="MK-0042" className="font-mono" />
          </div>

          <div className="space-y-2">
            <Label>Site</Label>
            <Select value={data.site_id} onValueChange={v => set('site_id', v)}>
              <SelectTrigger><SelectValue placeholder="Select site" /></SelectTrigger>
              <SelectContent>
                {sites.map(s => <SelectItem key={s.id} value={s.id}>{s.code} — {s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={data.category} onValueChange={v => set('category', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="structural_wear">Structural wear</SelectItem>
                <SelectItem value="material_stress">Material stress</SelectItem>
                <SelectItem value="electrical">Electrical</SelectItem>
                <SelectItem value="signalling">Signalling</SelectItem>
                <SelectItem value="equipment_degradation">Equipment degradation</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Severity</Label>
            <Select value={data.severity} onValueChange={v => set('severity', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="col-span-2 space-y-2">
            <Label>Description</Label>
            <Textarea value={data.description} onChange={e => set('description', e.target.value)} rows={3} placeholder="Observed symptoms, suspected cause..." />
          </div>

          <div className="space-y-2">
            <Label>Position X (% schematic)</Label>
            <Input type="number" min={0} max={100} value={data.position?.x ?? 50}
              onChange={e => set('position', { ...data.position, x: parseFloat(e.target.value) })} className="font-mono" />
          </div>
          <div className="space-y-2">
            <Label>Position Y (% schematic)</Label>
            <Input type="number" min={0} max={100} value={data.position?.y ?? 50}
              onChange={e => set('position', { ...data.position, y: parseFloat(e.target.value) })} className="font-mono" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => onSubmit(data)} disabled={loading || !data.title || !data.site_id}>
            {loading ? 'Saving...' : (fault ? 'Update fault' : 'Log fault')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}