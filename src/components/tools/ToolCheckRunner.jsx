import React, { useState, useMemo } from 'react';
import { ToolCheck, Tool } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { motion } from 'framer-motion';
import { ScanLine, CheckCircle2, AlertTriangle, RotateCcw } from 'lucide-react';

export default function ToolCheckRunner({ tools, user, onComplete }) {
  const [kitId, setKitId] = useState('');
  const [checkType, setCheckType] = useState('pre_job');
  const [scanned, setScanned] = useState(new Set());
  const [scanning, setScanning] = useState(false);
  const [completed, setCompleted] = useState(null);

  const kits = useMemo(() => Array.from(new Set(tools.map(t => t.assigned_kit).filter(Boolean))), [tools]);
  const expected = useMemo(() => tools.filter(t => t.assigned_kit === kitId), [tools, kitId]);

  const reset = () => { setScanned(new Set()); setCompleted(null); };

  const toggle = (id) => {
    setScanned(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  // Simulated AR scan: progressively detects tools
  const startSimScan = () => {
    setScanning(true); setScanned(new Set());
    expected.forEach((t, i) => {
      setTimeout(() => {
        // Simulate occasional miss for criticality demo
        if (Math.random() > 0.15) {
          setScanned(prev => new Set([...prev, t.id]));
        }
        if (i === expected.length - 1) setTimeout(() => setScanning(false), 400);
      }, 600 + i * 350);
    });
  };

  const finalize = async () => {
    const expectedIds = expected.map(t => t.id);
    const missing = expectedIds.filter(id => !scanned.has(id));
    const result = missing.length === 0 ? 'pass' : missing.length <= 1 ? 'warning' : 'fail';
    const record = await ToolCheck.create({
      kit_id: kitId,
      check_type: checkType,
      expected_tools: expectedIds,
      scanned_tools: Array.from(scanned),
      missing_tools: missing,
      extra_tools: [],
      result,
      technician: user.email,
    });
    // Mark missing tools as missing (only for post-job checks)
    if (checkType === 'post_job') {
      for (const id of missing) {
        await Tool.update(id, { status: 'missing' });
      }
    }
    setCompleted(record);
    onComplete(record);
  };

  const expectedCount = expected.length;
  const scannedCount = scanned.size;
  const progress = expectedCount === 0 ? 0 : (scannedCount / expectedCount) * 100;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
      {/* Controls */}
      <div className="lg:col-span-2 rounded-lg border border-border bg-card/60 p-5 space-y-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-mono">Configure check</div>
          <div className="font-display text-lg font-semibold">AR Tool Verification</div>
        </div>

        <div className="space-y-2">
          <Label>Kit ID</Label>
          {kits.length > 0 ? (
            <Select value={kitId} onValueChange={(v) => { setKitId(v); reset(); }}>
              <SelectTrigger><SelectValue placeholder="Select kit" /></SelectTrigger>
              <SelectContent>
                {kits.map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}
              </SelectContent>
            </Select>
          ) : (
            <Input value={kitId} onChange={e => setKitId(e.target.value)} placeholder="No kits with tools yet" disabled />
          )}
        </div>

        <div className="space-y-2">
          <Label>Check type</Label>
          <Select value={checkType} onValueChange={setCheckType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="pre_job">Pre-job check</SelectItem>
              <SelectItem value="post_job">Post-job check</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Button
            onClick={startSimScan}
            disabled={!kitId || scanning || expectedCount === 0}
            className="w-full gap-2"
          >
            <ScanLine className="w-4 h-4" /> {scanning ? 'Scanning...' : 'Run AR scan'}
          </Button>
          <Button
            variant="outline" onClick={reset} disabled={scanning} className="w-full gap-2">
            <RotateCcw className="w-4 h-4" /> Reset
          </Button>
        </div>

        {completed && (
          <div className={`rounded-md border p-3 text-sm ${
            completed.result === 'pass' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' :
            completed.result === 'warning' ? 'border-amber-500/30 bg-amber-500/10 text-amber-400' :
            'border-red-500/30 bg-red-500/10 text-red-400'
          }`}>
            <div className="flex items-center gap-2 font-display font-semibold uppercase tracking-wider text-xs">
              {completed.result === 'pass' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              Result: {completed.result}
            </div>
            <div className="text-xs mt-1 opacity-90">
              {completed.scanned_tools.length}/{completed.expected_tools.length} verified
              {completed.missing_tools.length > 0 && ` · ${completed.missing_tools.length} missing`}
            </div>
          </div>
        )}
      </div>

      {/* Scan area */}
      <div className="lg:col-span-3 rounded-lg border border-border bg-card/60 overflow-hidden">
        <div className="px-5 py-3 border-b border-border flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-mono">Kit contents</div>
            <div className="font-display font-semibold">{kitId || 'Select a kit'}</div>
          </div>
          <div className="text-xs font-mono text-muted-foreground">{scannedCount}/{expectedCount}</div>
        </div>

        <div className="relative h-2 bg-secondary">
          <motion.div className="absolute inset-y-0 left-0 bg-primary" animate={{ width: `${progress}%` }} transition={{ type: 'spring', damping: 20 }} />
        </div>

        <div className="p-5 grid grid-cols-2 md:grid-cols-3 gap-2 min-h-[280px]">
          {expected.length === 0 && (
            <div className="col-span-full text-center text-sm text-muted-foreground py-12 font-mono">
              {kitId ? 'No tools in this kit.' : 'Select a kit to begin.'}
            </div>
          )}
          {expected.map(t => {
            const isScanned = scanned.has(t.id);
            return (
              <motion.button
                key={t.id}
                onClick={() => !scanning && toggle(t.id)}
                animate={{ scale: isScanned ? [1, 1.05, 1] : 1 }}
                className={`text-left p-3 rounded-md border transition-all ${
                  isScanned
                    ? 'border-emerald-500/40 bg-emerald-500/10'
                    : 'border-border bg-secondary/30 hover:border-primary/30'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Checkbox checked={isScanned} className="pointer-events-none" />
                  <div className="text-[10px] font-mono uppercase text-muted-foreground">{t.tool_id}</div>
                </div>
                <div className="text-sm font-medium truncate">{t.name}</div>
                <div className="text-[10px] text-muted-foreground">{t.category}</div>
              </motion.button>
            );
          })}

          {scanning && (
            <motion.div
              className="absolute inset-x-0 h-12 scan-line pointer-events-none"
              animate={{ top: ['10%', '90%', '10%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            />
          )}
        </div>

        <div className="p-4 border-t border-border flex justify-end">
          <Button onClick={finalize} disabled={!kitId || expectedCount === 0 || scanning}>
            Complete check
          </Button>
        </div>
      </div>
    </div>
  );
}