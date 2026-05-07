import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tool, ToolCheck } from '@/api/entities';
import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Plus, ScanLine, Wrench } from 'lucide-react';
import ToolFormDialog from '@/components/tools/ToolFormDialog';
import ToolsList from '@/components/tools/ToolsList';
import ToolCheckRunner from '@/components/tools/ToolCheckRunner';
import ToolCheckHistory from '@/components/tools/ToolCheckHistory';
import { can } from '@/lib/permissions';
import { logAudit } from '@/lib/audit';

export default function Tools() {
  const { user } = useOutletContext();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const { data: tools = [] } = useQuery({
    queryKey: ['tools'], queryFn: () => Tool.list('-created_date', 200),
  });
  const { data: checks = [] } = useQuery({
    queryKey: ['toolChecks'], queryFn: () => ToolCheck.list('-created_date', 50),
  });

  const save = useMutation({
    mutationFn: async (d) => {
      if (editing) await Tool.update(editing.id, d);
      else await Tool.create(d);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tools'] }); setShowForm(false); setEditing(null); },
  });
  const del = useMutation({
    mutationFn: (id) => Tool.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tools'] }),
  });

  return (
    <div className="p-6 lg:p-10 max-w-[1600px] mx-auto">
      <PageHeader
        eyebrow="// TOOL ACCOUNTABILITY"
        title="Tools & Kits"
        description="AR-assisted tool tracking, kit verification, and historical pre/post-job checks."
        actions={
          can.manageTools(user) && (
            <Button onClick={() => { setEditing(null); setShowForm(true); }} className="gap-2">
              <Plus className="w-4 h-4" /> Register tool
            </Button>
          )
        }
      />

      <Tabs defaultValue="inventory">
        <TabsList className="bg-card/60 border border-border">
          <TabsTrigger value="inventory" className="gap-2"><Wrench className="w-4 h-4" /> Inventory</TabsTrigger>
          <TabsTrigger value="check" className="gap-2"><ScanLine className="w-4 h-4" /> AR Tool Check</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="mt-4">
          <ToolsList
            tools={tools}
            canEdit={can.manageTools(user)}
            onEdit={(t) => { setEditing(t); setShowForm(true); }}
            onDelete={(id) => del.mutate(id)}
          />
        </TabsContent>

        <TabsContent value="check" className="mt-4">
          <ToolCheckRunner
            tools={tools}
            user={user}
            onComplete={async (record) => {
              await logAudit({
                actor: user.email, actor_role: user.role,
                action: 'tool_check_run', target_type: 'ToolCheck', target_id: record.id,
                details: `${record.kit_id} · ${record.result}`,
                severity: record.result === 'fail' ? 'warning' : 'info',
              });
              qc.invalidateQueries({ queryKey: ['toolChecks'] });
              qc.invalidateQueries({ queryKey: ['tools'] });
            }}
          />
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <ToolCheckHistory checks={checks} />
        </TabsContent>
      </Tabs>

      <ToolFormDialog
        open={showForm}
        onOpenChange={setShowForm}
        tool={editing}
        onSubmit={(d) => save.mutate(d)}
        loading={save.isPending}
      />
    </div>
  );
}