import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Camera, CameraOff, AlertTriangle, QrCode } from 'lucide-react';
import { SEVERITY_COLORS } from '@/lib/permissions';
import jsQR from 'jsqr';

export default function CameraOverlay({ faults, onSelect }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const [detectedQR, setDetectedQR] = useState(null);
  const requestRef = useRef();

  const start = async () => {
    setError(null);
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }, audio: false,
      });
      setStream(s);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
        // Wait for video to be ready before starting scan loop
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          requestRef.current = requestAnimationFrame(scanFrame);
        };
      }
    } catch (e) {
      setError(e.message || 'Camera access denied.');
    }
  };

  const stop = () => {
    if (stream) stream.getTracks().forEach(t => t.stop());
    setStream(null);
    setDetectedQR(null);
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
  };

  useEffect(() => () => stop(), []); // eslint-disable-line

  const scanFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      });
      
      if (code) {
        // Calculate percentages for positioning overlay
        const toPercentX = (x) => (x / canvas.width) * 100;
        const toPercentY = (y) => (y / canvas.height) * 100;
        
        setDetectedQR({
          data: code.data,
          topLeft: { x: toPercentX(code.location.topLeftCorner.x), y: toPercentY(code.location.topLeftCorner.y) },
          topRight: { x: toPercentX(code.location.topRightCorner.x), y: toPercentY(code.location.topRightCorner.y) },
          bottomLeft: { x: toPercentX(code.location.bottomLeftCorner.x), y: toPercentY(code.location.bottomLeftCorner.y) },
          bottomRight: { x: toPercentX(code.location.bottomRightCorner.x), y: toPercentY(code.location.bottomRightCorner.y) },
          center: {
            x: toPercentX((code.location.topLeftCorner.x + code.location.bottomRightCorner.x) / 2),
            y: toPercentY((code.location.topLeftCorner.y + code.location.bottomRightCorner.y) / 2)
          }
        });
      } else {
        setDetectedQR(null);
      }
    }
    
    requestRef.current = requestAnimationFrame(scanFrame);
  }, []);

  // Generate stable random anchor positions for the static overlays just to keep the scene active
  const anchors = faults.slice(0, 3).map((f, i) => ({
    fault: f,
    x: 15 + ((i * 37 + (f.position?.x || 50) * 0.3) % 70),
    y: 20 + ((i * 23 + (f.position?.y || 50) * 0.4) % 60),
  }));

  return (
    <div className="rounded-lg border border-border bg-card/60 overflow-hidden">
      <div className="px-5 py-3 border-b border-border flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-mono">Live AR mode</div>
          <div className="font-display font-semibold">Computer Vision AR Overlay</div>
        </div>
        {stream ? (
          <Button size="sm" variant="outline" onClick={stop} className="gap-2"><CameraOff className="w-4 h-4" /> Stop</Button>
        ) : (
          <Button size="sm" onClick={start} className="gap-2"><Camera className="w-4 h-4" /> Start camera</Button>
        )}
      </div>

      <div className="relative aspect-[16/9] bg-black overflow-hidden">
        {/* Hidden canvas for processing frames */}
        <canvas ref={canvasRef} className="hidden" />
        
        <video
          ref={videoRef}
          playsInline
          muted
          className={`w-full h-full object-cover ${stream ? '' : 'opacity-0'}`}
        />

        {!stream && !error && (
          <div className="absolute inset-0 flex items-center justify-center grid-bg">
            <div className="text-center max-w-sm px-6">
              <QrCode className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <div className="font-display text-lg mb-1">Live QR Detection</div>
              <div className="text-sm text-muted-foreground">
                Start the camera and point it at any QR code to demonstrate real-time computer vision detection.
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
            
            {/* Live Detected QR Code Overlay */}
            {detectedQR && (
              <>
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                  <polygon
                    points={`${detectedQR.topLeft.x}%,${detectedQR.topLeft.y}% ${detectedQR.topRight.x}%,${detectedQR.topRight.y}% ${detectedQR.bottomRight.x}%,${detectedQR.bottomRight.y}% ${detectedQR.bottomLeft.x}%,${detectedQR.bottomLeft.y}%`}
                    fill="rgba(55, 138, 221, 0.2)"
                    stroke="#378ADD"
                    strokeWidth="3"
                    strokeDasharray="4 4"
                    className="animate-pulse"
                  />
                </svg>
                
                <div 
                  className="absolute z-20 -translate-x-1/2 -translate-y-[120%]"
                  style={{ left: `${detectedQR.center.x}%`, top: `${detectedQR.center.y}%` }}
                >
                  <div className="bg-primary/90 backdrop-blur-md text-primary-foreground px-3 py-1.5 rounded shadow-lg flex items-center gap-2 border border-primary-foreground/20">
                    <QrCode className="w-4 h-4" />
                    <div>
                      <div className="text-[10px] font-mono uppercase opacity-80">Marker Detected</div>
                      <div className="text-xs font-bold font-mono tracking-tight">{detectedQR.data}</div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Static Fault overlays (kept for ambient context) */}
            {anchors.map(({ fault, x, y }) => (
              <ARMarker key={fault.id} fault={fault} x={x} y={y} onClick={() => onSelect(fault)} active={detectedQR !== null} />
            ))}
          </>
        )}
      </div>
    </div>
  );
}

function ARMarker({ fault, x, y, onClick, active }) {
  const color = SEVERITY_COLORS[fault.severity];
  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: active ? 0.3 : 1 }}
      onClick={onClick}
      className="absolute -translate-x-1/2 -translate-y-1/2 text-left transition-opacity duration-300"
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