import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Site, Fault } from '@/api/entities';
import PageHeader from '@/components/PageHeader';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import SchematicView from '@/components/ar/SchematicView';
import CameraOverlay from '@/components/ar/CameraOverlay';
import FaultDetailDialog from '@/components/faults/FaultDetailDialog';
import { Monitor, Camera } from 'lucide-react';

export default function ARView() {
  const { user } = useOutletContext();
  const [siteId, setSiteId] = useState('all');
  const [selected, setSelected] = useState(null);

  const { data: sites = [] } = useQuery({
    queryKey: ['sites'],
    queryFn: () => Site.list(),
  });
  const { data: faults = [] } = useQuery({
    queryKey: ['faults'],
    queryFn: () => Fault.list('-created_date', 200),
  });

  const visibleFaults = siteId === 'all' ? faults : faults.filter(f => f.site_id === siteId);
  const activeSite = sites.find(s => s.id === siteId);

  return (
    <div className="p-6 lg:p-10 max-w-[1600px] mx-auto">
      <PageHeader
        eyebrow="// AR FIELD VIEW"
        title="Augmented Reality Inspection"
        description="Visualise fault markers in schematic or live camera mode. Tap markers to inspect."
        actions={
          <Select value={siteId} onValueChange={setSiteId}>
            <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All authorised sites</SelectItem>
              {sites.map(s => <SelectItem key={s.id} value={s.id}>{s.code} — {s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        }
      />

      <Tabs defaultValue="schematic" className="w-full">
        <TabsList className="bg-card/60 border border-border">
          <TabsTrigger value="schematic" className="gap-2"><Monitor className="w-4 h-4" /> Schematic</TabsTrigger>
          <TabsTrigger value="camera" className="gap-2"><Camera className="w-4 h-4" /> Live Camera</TabsTrigger>
        </TabsList>

        <TabsContent value="schematic" className="mt-4">
          <SchematicView site={activeSite} faults={visibleFaults} onSelect={setSelected} />
        </TabsContent>
        <TabsContent value="camera" className="mt-4">
          <CameraOverlay faults={visibleFaults} onSelect={setSelected} />
        </TabsContent>
      </Tabs>

      <FaultDetailDialog
        fault={selected}
        sites={sites}
        user={user}
        onOpenChange={(o) => !o && setSelected(null)}
        onEdit={() => setSelected(null)}
      />
    </div>
  );
}