import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Camera, CameraOff, AlertTriangle } from 'lucide-react';
import { SEVERITY_COLORS } from '@/lib/permissions';

export default function CameraOverlay({ faults, onSelect }) {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);

  const start = async () => {
    setError(null);
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }, audio: false,
      });
      setStream(s);
      if (videoRef.current) videoRef.current.srcObject = s;
    } catch (e) {
      setError(e.message || 'Camera access denied.');
    }
  };

  const stop = () => {
    if (stream) stream.getTracks().forEach(t => t.stop());
    setStream(null);
  };

  useEffect(() => () => stop(), []); // eslint-disable-line

  // Generate stable random anchor positions per fault for overlay
  const anchors = faults.slice(0, 6).map((f, i) => ({
    fault: f,
    x: 15 + ((i * 37 + (f.position?.x || 50) * 0.3) % 70),
    y: 20 + ((i * 23 + (f.position?.y || 50) * 0.4) % 60),
  }));

  return (
    <div className="rounded-lg border border-border bg-card/60 overflow-hidden">
      <div className="px-5 py-3 border-b border-border flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-mono">Live AR mode</div>
          <div className="font-display font-semibold">Camera overlay · {faults.length} fault{faults.length !== 1 ? 's' : ''}</div>
        </div>
        {stream ? (
          <Button size="sm" variant="outline" onClick={stop} className="gap-2"><CameraOff className="w-4 h-4" /> Stop</Button>
        ) : (
          <Button size="sm" onClick={start} className="gap-2"><Camera className="w-4 h-4" /> Start camera</Button>
        )}
      </div>

      <div className="relative aspect-[16/9] bg-black overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover ${stream ? '' : 'opacity-0'}`}
        />

        {!stream && !error && (
          <div className="absolute inset-0 flex items-center justify-center grid-bg">
            <div className="text-center max-w-sm px-6">
              <Camera className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <div className="font-display text-lg mb-1">Live camera AR</div>
              <div className="text-sm text-muted-foreground">
                Start the camera to overlay fault markers in real time. Best on mobile devices facing infrastructure.
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center max-w-sm px-6">
              <AlertTriangle className="w-10 h-10 mx-auto text-amber-400 mb-3" />
              <div className="font-display text-lg mb-1">Camera unavailable</div>
              <div className="text-sm text-muted-foreground font-mono">{error}</div>
            </div>
          </div>
        )}

        {/* HUD */}
        {stream && (
          <>
            <div className="absolute top-3 left-3 text-[10px] font-mono text-primary tracking-widest uppercase flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> REC · AR-OVERLAY
            </div>
            <div className="absolute top-3 right-3 text-[10px] font-mono text-primary/80 text-right">
              <div>LAT 51.5074°N</div>
              <div>LON -0.1278°W</div>
            </div>
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[10px] font-mono text-primary/80">
              <span>SIG ●●●○</span>
              <span>{new Date().toLocaleTimeString()}</span>
              <span>BAT 87%</span>
            </div>

            {/* Crosshair */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 border border-primary/40 pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 w-8 h-px bg-primary/40 -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute top-1/2 left-1/2 w-px h-8 bg-primary/40 -translate-x-1/2 -translate-y-1/2" />

            {/* Fault overlays */}
            {anchors.map(({ fault, x, y }) => (
              <ARMarker key={fault.id} fault={fault} x={x} y={y} onClick={() => onSelect(fault)} />
            ))}
          </>
        )}
      </div>
    </div>
  );
}

function ARMarker({ fault, x, y, onClick }) {
  const color = SEVERITY_COLORS[fault.severity];
  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      onClick={onClick}
      className="absolute -translate-x-1/2 -translate-y-1/2 text-left"
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      <div className="relative flex items-center gap-2">
        <div
          className="w-4 h-4 rounded-full pulse-ring border-2 border-background"
          style={{ background: color }}
        />
        <div className="bg-background/80 backdrop-blur border px-2 py-1 rounded font-mono text-[10px] uppercase tracking-wider"
          style={{ borderColor: color, color }}
        >
          <div className="font-bold">{fault.marker_id || fault.title}</div>
          <div className="text-[9px] opacity-80">{fault.severity} · {(fault.category || '').replace(/_/g, ' ')}</div>
        </div>
      </div>
    </motion.button>
  );
}