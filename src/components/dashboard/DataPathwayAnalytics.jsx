import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Cell, PieChart, Pie } from 'recharts';
import { Database, CloudRain, AlertTriangle, MapPin } from 'lucide-react';
import analyticsData from '@/data/analytics.json';

const COLORS = {
  Dry: '#378ADD',
  Rain: '#1D9E75',
  Cold: '#7F77DD',
  Windy: '#D85A30',
  Hot: '#EF9F27',
};

const AREA_COLOR = '#7F77DD';

export default function DataPathwayAnalytics() {
  const weatherData = useMemo(() => {
    return Object.entries(analyticsData.faults_by_weather).map(([weather, count]) => ({
      weather,
      count
    })).sort((a, b) => b.count - a.count);
  }, []);

  const riskByAreaData = useMemo(() => {
    return Object.entries(analyticsData.average_risk_by_area).map(([area, risk]) => ({
      area,
      risk
    })).sort((a, b) => b.risk - a.risk);
  }, []);

  const severityData = useMemo(() => {
    return Object.entries(analyticsData.severity_distribution).map(([severity, count]) => ({
      name: severity,
      value: count
    }));
  }, []);

  const SEV_COLORS = { High: '#D85A30', Medium: '#EF9F27', Low: '#1D9E75' };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Database className="w-5 h-5 text-primary" />
        <h2 className="font-display text-xl font-bold">Data Pathway Analytics</h2>
        <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full font-mono border border-primary/20">
          {analyticsData.total_faults} historical records
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Weather Chart */}
        <div className="rounded-lg border border-border bg-card/60 backdrop-blur-sm p-5">
          <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-mono mb-1">Environmental</div>
          <div className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
            <CloudRain className="w-4 h-4 text-blue-400" /> Faults by Weather
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weatherData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="weather" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip cursor={{ fill: 'hsl(var(--muted)/0.4)' }} contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {weatherData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.weather] || COLORS.Dry} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk by Area Chart */}
        <div className="rounded-lg border border-border bg-card/60 backdrop-blur-sm p-5">
          <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-mono mb-1">Location Risk</div>
          <div className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-purple-400" /> Avg Risk by Area
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskByAreaData} layout="vertical" margin={{ top: 0, right: 0, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} />
                <YAxis dataKey="area" type="category" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} width={80} />
                <Tooltip cursor={{ fill: 'hsl(var(--muted)/0.4)' }} contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="risk" fill={AREA_COLOR} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Key Stats */}
        <div className="rounded-lg border border-border bg-card/60 backdrop-blur-sm p-5 flex flex-col justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-mono mb-1">Insights</div>
            <div className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" /> Historical Summary
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <div className="text-xs text-muted-foreground font-mono uppercase">Most Common Fault</div>
              <div className="font-display text-xl font-bold text-foreground">{analyticsData.most_common_fault}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground font-mono uppercase">Avg Resolution Time</div>
              <div className="font-display text-xl font-bold text-emerald-400">{analyticsData.average_resolution_days} days</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground font-mono uppercase">Highest Risk Area</div>
              <div className="font-display text-xl font-bold text-red-400">{analyticsData.highest_risk_area}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground font-mono uppercase">Target SLA (≤5 days)</div>
              <div className="font-display text-xl font-bold text-blue-400">{analyticsData.resolved_within_target_percentage}%</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
