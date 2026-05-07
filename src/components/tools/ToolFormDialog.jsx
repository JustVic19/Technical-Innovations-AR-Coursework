import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const empty = { tool_id: '', name: '', category: 'wrench', serial_number: '', assigned_kit: '', status: 'available' };

export default function ToolFormDialog({ open, onOpenChange, tool, onSubmit, loading }) {
  const [d, setD] = useState(empty);
  useEffect(() => { if (open) setD(tool ? { ...empty, ...tool } : empty); }, [open, tool]);
  const set = (k, v) => setD(p => ({ ...p, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle className="font-display">{tool ? 'Edit tool' : 'Register tool'}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-2">
          <div className="space-y-2">
            <Label>Asset tag</Label>
            <Input value={d.tool_id} onChange={e => set('tool_id', e.target.value)} className="font-mono" placeholder="TL-0001" />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={d.category} onValueChange={v => set('category', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {['wrench','spanner','hammer','screwdriver','pliers','multimeter','torch','drill','cutter','other'].map(c =>
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2 space-y-2">
            <Label>Name</Label>
            <Input value={d.name} onChange={e => set('name', e.target.value)} placeholder="15mm Combination Spanner" />
          </div>
          <div className="space-y-2">
            <Label>Serial number</Label>
            <Input value={d.serial_number} onChange={e => set('serial_number', e.target.value)} className="font-mono" />
          </div>
          <div className="space-y-2">
            <Label>Kit ID</Label>
            <Input value={d.assigned_kit} onChange={e => set('assigned_kit', e.target.value)} className="font-mono" placeholder="KIT-A" />
          </div>
          <div className="space-y-2 col-span-2">
            <Label>Status</Label>
            <Select value={d.status} onValueChange={v => set('status', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="checked_out">Checked out</SelectItem>
                <SelectItem value="in_use">In use</SelectItem>
                <SelectItem value="missing">Missing</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => onSubmit(d)} disabled={loading || !d.tool_id || !d.name}>
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}