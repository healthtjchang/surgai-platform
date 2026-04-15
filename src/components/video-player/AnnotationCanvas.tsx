'use client';

import { useRef, useState, useCallback, useEffect } from 'react';

interface Point { x: number; y: number; }
interface Annotation {
  id: string;
  type: 'arrow' | 'circle' | 'text';
  points: Point[];
  label: string;
  color: string;
  timestamp: number;
}

interface Props {
  width: number;
  height: number;
  currentTime: number;
  annotations: Annotation[];
  onAdd: (ann: Omit<Annotation, 'id'>) => void;
  active: boolean;
}

const COLORS = ['#06b6d4', '#f43f5e', '#10b981', '#f59e0b', '#8b5cf6', '#ffffff'];
const TOOLS = [
  { type: 'arrow', label: 'Arrow', d: 'M5 12h14M12 5l7 7-7 7' },
  { type: 'circle', label: 'Circle', d: 'M12 12m-8 0a8 8 0 1016 0 8 8 0 10-16 0' },
  { type: 'text', label: 'Text', d: 'M4 6h16M4 12h8m-8 6h16' },
] as const;

export default function AnnotationCanvas({ width, height, currentTime, annotations, onAdd, active }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<'arrow' | 'circle' | 'text'>('arrow');
  const [color, setColor] = useState(COLORS[0]);
  const [drawing, setDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [label, setLabel] = useState('');
  const [showLabelInput, setShowLabelInput] = useState(false);
  const [pendingPoint, setPendingPoint] = useState<Point | null>(null);

  // Draw existing annotations for current time
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    // Draw annotations within 5 seconds of current time
    const visible = annotations.filter(a => Math.abs(a.timestamp - currentTime) < 5);
    for (const ann of visible) {
      ctx.strokeStyle = ann.color;
      ctx.fillStyle = ann.color;
      ctx.lineWidth = 2;
      ctx.font = '14px system-ui';

      if (ann.type === 'arrow' && ann.points.length >= 2) {
        const [start, end] = ann.points;
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
        // Arrowhead
        const angle = Math.atan2(end.y - start.y, end.x - start.x);
        ctx.beginPath();
        ctx.moveTo(end.x, end.y);
        ctx.lineTo(end.x - 12 * Math.cos(angle - 0.4), end.y - 12 * Math.sin(angle - 0.4));
        ctx.lineTo(end.x - 12 * Math.cos(angle + 0.4), end.y - 12 * Math.sin(angle + 0.4));
        ctx.closePath();
        ctx.fill();
        if (ann.label) {
          ctx.fillStyle = 'rgba(0,0,0,0.7)';
          const tx = (start.x + end.x) / 2;
          const ty = (start.y + end.y) / 2 - 8;
          const metrics = ctx.measureText(ann.label);
          ctx.fillRect(tx - 4, ty - 14, metrics.width + 8, 20);
          ctx.fillStyle = ann.color;
          ctx.fillText(ann.label, tx, ty);
        }
      }

      if (ann.type === 'circle' && ann.points.length >= 2) {
        const [center, edge] = ann.points;
        const r = Math.sqrt((edge.x - center.x) ** 2 + (edge.y - center.y) ** 2);
        ctx.beginPath();
        ctx.arc(center.x, center.y, r, 0, Math.PI * 2);
        ctx.stroke();
        if (ann.label) {
          ctx.fillStyle = 'rgba(0,0,0,0.7)';
          const metrics = ctx.measureText(ann.label);
          ctx.fillRect(center.x - metrics.width / 2 - 4, center.y - r - 22, metrics.width + 8, 20);
          ctx.fillStyle = ann.color;
          ctx.fillText(ann.label, center.x - metrics.width / 2, center.y - r - 8);
        }
      }

      if (ann.type === 'text' && ann.points.length >= 1) {
        const [pos] = ann.points;
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        const metrics = ctx.measureText(ann.label);
        ctx.fillRect(pos.x - 4, pos.y - 16, metrics.width + 8, 22);
        ctx.fillStyle = ann.color;
        ctx.fillText(ann.label, pos.x, pos.y);
      }
    }
  }, [annotations, currentTime, width, height]);

  useEffect(() => { draw(); }, [draw]);

  const getPos = (e: React.MouseEvent<HTMLCanvasElement>): Point => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!active) return;
    const pos = getPos(e);
    if (tool === 'text') {
      setPendingPoint(pos);
      setShowLabelInput(true);
      return;
    }
    setStartPoint(pos);
    setDrawing(true);
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!active || !drawing || !startPoint) return;
    const endPoint = getPos(e);
    setDrawing(false);
    setPendingPoint(endPoint);
    setShowLabelInput(true);
  };

  const submitAnnotation = () => {
    if (!pendingPoint) return;
    const points = tool === 'text' ? [pendingPoint] : [startPoint!, pendingPoint];
    onAdd({ type: tool, points, label: label || '', color, timestamp: currentTime });
    setShowLabelInput(false);
    setLabel('');
    setStartPoint(null);
    setPendingPoint(null);
  };

  if (!active) {
    return <canvas ref={canvasRef} width={width} height={height} className="absolute inset-0 pointer-events-none" />;
  }

  return (
    <>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="absolute inset-0 cursor-crosshair"
        style={{ zIndex: 10 }}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
      />

      {/* Toolbar */}
      <div className="absolute top-3 left-3 flex items-center gap-1.5 z-20 p-1.5 rounded-lg" style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}>
        {TOOLS.map(t => (
          <button key={t.type} onClick={() => setTool(t.type)}
            className={`w-8 h-8 rounded flex items-center justify-center transition ${tool === t.type ? 'bg-cyan-500 text-white' : 'text-slate-400 hover:text-white'}`}
            title={t.label}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d={t.d} />
            </svg>
          </button>
        ))}
        <div className="w-px h-5 bg-slate-600 mx-1" />
        {COLORS.map(c => (
          <button key={c} onClick={() => setColor(c)}
            className={`w-5 h-5 rounded-full border-2 transition ${color === c ? 'border-white scale-110' : 'border-transparent'}`}
            style={{ background: c }} />
        ))}
      </div>

      {/* Label input popup */}
      {showLabelInput && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 p-4 rounded-xl" style={{ background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(12px)', border: '1px solid rgba(6,182,212,0.3)', minWidth: 260 }}>
          <p className="text-xs text-cyan-400 mb-2">Label this annotation</p>
          <input
            type="text"
            value={label}
            onChange={e => setLabel(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submitAnnotation()}
            placeholder="e.g., Cystic Duct"
            className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none mb-2"
            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}
            autoFocus
          />
          <div className="flex gap-2">
            <button onClick={() => { setShowLabelInput(false); setLabel(''); }} className="flex-1 py-1.5 text-xs text-slate-400 rounded-lg" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>Cancel</button>
            <button onClick={submitAnnotation} className="flex-1 py-1.5 text-xs btn-primary rounded-lg">Add</button>
          </div>
        </div>
      )}
    </>
  );
}
