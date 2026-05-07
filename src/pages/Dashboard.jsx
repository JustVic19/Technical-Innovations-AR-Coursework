import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Fault, Tool, ToolCheck } from '@/api/entities';
import PageHeader from '@/components/PageHeader';
import StatTile from '@/components/StatTile';
import { AlertTriangle, Wrench, ShieldCheck, Activity, TrendingUp, Cpu } from 'lucide-react';
import FaultTrendChart from '@/components/dashboard/FaultTrendChart';
import SeverityDonut from '@/components/dashboard/SeverityDonut';
import LiveActivity from '@/components/dashboard/LiveActivity';
import PredictiveInsights from '@/components/dashboard/PredictiveInsights';
import { can } from '@/lib/permissions';

export default function Dashboard() {
  const { user } = useOutletContext();

  const { data: faults = [] } = useQuery({
    queryKey: ['faults'],
    queryFn: () => Fault.list('-created_date', 200),
  });
  const { data: tools = [] } = useQuery({
    queryKey: ['tools'],
    queryFn: () => Tool.list('-created_date', 200),
  });
  const { data: checks = [] } = useQuery({
    queryKey: ['toolChecks'],
    queryFn: () => ToolCheck.list('-created_date', 50),
  });

  const open = faults.filter(f => !['resolved', 'rejected'].includes(f.status)).length;
  const critical = faults.filter(f => f.severity === 'critical' && f.status !== 'resolved').length;
  const missingTools = tools.filter(t => t.status === 'missing').length;
  const failedChecks = checks.filter(c => c.result === 'fail').length;

  return (
    <div className="p-6 lg:p-10 max-w-[1600px] mx-auto">
      <PageHeader
        eyebrow={`// ${new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' }).toUpperCase()}`}
        title={`Welcome back, ${user.full_name?.split(' ')[0]}`}
        description="Real-time operational overview across all authorised sites and assets."
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatTile label="Open faults" value={open} sublabel={`${faults.length} total logged`} icon={AlertTriangle} accent="primary" />
        <StatTile label="Critical" value={critical} sublabel="Require immediate attention" icon={Activity} accent="danger" />
        <StatTile label="Tools missing" value={missingTools} sublabel={`${tools.length} tracked`} icon={Wrench} accent="info" />
        <StatTile label="Failed checks" value={failedChecks} sublabel={`${checks.length} recent`} icon={ShieldCheck} accent="success" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        <div className="lg:col-span-2">
          <FaultTrendChart faults={faults} />
        </div>
        <SeverityDonut faults={faults} />
      </div>

      {can.viewAnalytics(user) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
          <div className="lg:col-span-2">
            <PredictiveInsights faults={faults} />
          </div>
          <LiveActivity />
        </div>
      )}

      {!can.viewAnalytics(user) && (
        <div className="mb-8">
          <LiveActivity />
        </div>
      )}
    </div>
  );
}