import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Camera, CameraOff, AlertTriangle, ScanLine, Loader2 } from 'lucide-react';
import { SEVERITY_COLORS } from '@/lib/permissions';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import '@tensorflow/tfjs';

export default function CameraOverlay({ faults, onSelect }) {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const [model, setModel] = useState(null);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [predictions, setPredictions] = useState([]);
  const requestRef = useRef();

  // Load the COCO-SSD model on mount
  useEffect(() => {
    let mounted = true;
    cocoSsd.load({ base: 'lite_mobilenet_v2' }).then(loadedModel => {
      if (mounted) {
        setModel(loadedModel);
        setIsModelLoading(false);
      }
    }).catch(err => {
      console.error('Failed to load TensorFlow model:', err);
      if (mounted) {
        setError('Failed to load AI model.');
        setIsModelLoading(false);
      }
    });
    return () => { mounted = false; };
  }, []);

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
    setPredictions([]);
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
  };

  useEffect(() => () => stop(), []); // eslint-disable-line

  const scanFrame = useCallback(async () => {
    if (!videoRef.current || !model || videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) {
      requestRef.current = requestAnimationFrame(scanFrame);
      return;
    }
    
    try {
      // TensorFlow allows directly passing the video element for detection
      const detections = await model.detect(videoRef.current);
      
      // Calculate percentages for positioning overlay relative to video dimensions
      const videoWidth = videoRef.current.videoWidth;
      const videoHeight = videoRef.current.videoHeight;
      
      const mappedPredictions = detections.map(d => {
        const [x, y, width, height] = d.bbox;
        return {
          class: d.class,
          score: Math.round(d.score * 100),
          left: (x / videoWidth) * 100,
          top: (y / videoHeight) * 100,
          width: (width / videoWidth) * 100,
          height: (height / videoHeight) * 100
        };
      });
      
      setPredictions(mappedPredictions);
    } catch (e) {
      console.error('Detection error:', e);
    }
    
    requestRef.current = requestAnimationFrame(scanFrame);
  }, [model]);

  // Keep static AR markers as ambient context
  const anchors = faults.slice(0, 3).map((f, i) => ({
    fault: f,
    x: 15 + ((i * 37 + (f.position?.x || 50) * 0.3) % 70),
    y: 20 + ((i * 23 + (f.position?.y || 50) * 0.4) % 60),
  }));

  return (
    <div className="rounded-lg border border-border bg-card/60 overflow-hidden">
      <div className="px-5 py-3 border-b border-border flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-mono">Live AI Mode</div>
          <div className="font-display font-semibold flex items-center gap-2">
            TensorFlow Object Recognition 
            {isModelLoading && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
          </div>
        </div>
        {stream ? (
          <Button size="sm" variant="outline" onClick={stop} className="gap-2"><CameraOff className="w-4 h-4" /> Stop</Button>
        ) : (
          <Button size="sm" onClick={start} disabled={isModelLoading} className="gap-2">
            {isModelLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Loading AI...</> : <><Camera className="w-4 h-4" /> Start camera</>}
          </Button>
        )}
      </div>

      <div className="relative aspect-[16/9] bg-black overflow-hidden">
        <video
          ref={videoRef}
          playsInline
          muted
          className={`w-full h-full object-cover ${stream ? '' : 'opacity-0'}`}
        />

        {!stream && !error && (
          <div className="absolute inset-0 flex items-center justify-center grid-bg">
            <div className="text-center max-w-sm px-6">
              <ScanLine className={`w-10 h-10 mx-auto mb-3 ${isModelLoading ? 'text-primary animate-pulse' : 'text-muted-foreground'}`} />
              <div className="font-display text-lg mb-1">{isModelLoading ? 'Loading AI Model...' : 'Live Object Recognition'}</div>
              <div className="text-sm text-muted-foreground">
                {isModelLoading 
                  ? 'Downloading TensorFlow COCO-SSD model (client-side)...'
                  : 'Start the camera and point it around to identify everyday objects in real-time using on-device AI.'}
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center max-w-sm px-6">
              <AlertTriangle className="w-10 h-10 mx-auto text-amber-400 mb-3" />
              <div className="font-display text-lg mb-1">AR Unavailable</div>
              <div className="text-sm text-muted-foreground font-mono">{error}</div>
            </div>
          </div>
        )}

        {/* HUD */}
        {stream && (
          <>
            <div className="absolute top-3 left-3 text-[10px] font-mono text-primary tracking-widest uppercase flex items-center gap-2 z-30">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> REC · TFJS-DETECT
            </div>
            
            {/* Live Detected AI Bounding Boxes */}
            {predictions.map((pred, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute border-2 border-[#1D9E75] shadow-[0_0_15px_rgba(29,158,117,0.5)] z-20 pointer-events-none transition-all duration-75"
                style={{ 
                  left: `${pred.left}%`, 
                  top: `${pred.top}%`, 
                  width: `${pred.width}%`, 
                  height: `${pred.height}%` 
                }}
              >
                {/* Crosshair corners */}
                <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-[#1D9E75]" />
                <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-[#1D9E75]" />
                <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-[#1D9E75]" />
                <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-[#1D9E75]" />

                {/* HUD Label */}
                <div className="absolute top-0 left-0 -translate-y-[calc(100%+4px)] bg-black/80 backdrop-blur border border-[#1D9E75] px-2 py-1 flex items-center gap-2 shadow-lg whitespace-nowrap">
                  <ScanLine className="w-3 h-3 text-[#1D9E75]" />
                  <div>
                    <div className="text-[9px] font-mono uppercase text-[#1D9E75] opacity-80 leading-none mb-0.5">Identified Object</div>
                    <div className="text-xs font-bold font-mono tracking-tight text-white leading-none capitalize">
                      {pred.class} <span className="opacity-50 font-normal ml-1">{pred.score}%</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Static Fault overlays (ambient context) */}
            {anchors.map(({ fault, x, y }) => (
              <ARMarker key={fault.id} fault={fault} x={x} y={y} onClick={() => onSelect(fault)} active={predictions.length > 0} />
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
      animate={{ scale: 1, opacity: active ? 0.15 : 1 }}
      onClick={onClick}
      className="absolute -translate-x-1/2 -translate-y-1/2 text-left transition-opacity duration-300 z-10"
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