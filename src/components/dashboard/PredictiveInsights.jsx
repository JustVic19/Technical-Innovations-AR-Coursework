import React, { useMemo } from 'react';
import { Cpu, AlertTriangle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, ReferenceLine } from 'recharts';
import { format, parseISO } from 'date-fns';
import analyticsData from '@/data/analytics.json';

export default function PredictiveInsights() {
  const chartData = useMemo(() => {
    const ml = analyticsData.ml_regression;
    if (!ml) return [];

    const data = [];
    
    // Format historical
    ml.historical_trend.forEach(point => {
      data.push({
        date: point.date,
        label: format(parseISO(point.date), 'd MMM'),
        actual: point.actual_faults,
        trend: point.regression_trend,
        future: null
      });
    });

    // Format future predictions
    ml.future_predictions.forEach(point => {
      data.push({
        date: point.date,
        label: format(parseISO(point.date), 'd MMM'),
        actual: null,
        trend: null,
        future: point.predicted_faults
      });
    });

    return data;
  }, []);

  const ml = analyticsData.ml_regression;
  const next7DaysTotal = ml ? ml.future_predictions.reduce((sum, p) => sum + p.predicted_faults, 0) : 0;

  return (
    <div className="rounded-lg border border-border bg-card/60 backdrop-blur-sm p-5 h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-mono flex items-center gap-2">
            <Cpu className="w-3 h-3" /> ML Linear Regression Model
          </div>
          <div className="font-display text-lg font-semibold mt-1">Network Failure Trend Prediction</div>
        </div>
        <div className="text-right hidden sm:block">
          <div className="font-display font-bold text-xl text-amber-400">
            {Math.round(next7DaysTotal)}
          </div>
          <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
            est. faults next 7 days
          </div>
        </div>
      </div>

      {!ml || chartData.length === 0 ? (
        <div className="text-sm text-muted-foreground font-mono py-8 text-center">
          ML Data not available.
        </div>
      ) : (
        <div className="h-64 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <ReferenceLine x={chartData[ml.historical_trend.length - 1].label} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
              <Line type="monotone" dataKey="actual" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} name="Actual Faults" connectNulls />
              <Line type="linear" dataKey="trend" stroke="hsl(var(--muted-foreground))" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Regression Trend" connectNulls />
              <Line type="linear" dataKey="future" stroke="hsl(var(--destructive))" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} name="Predicted Faults (7 days)" connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}