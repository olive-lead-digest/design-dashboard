'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Download, Minus, Plus, RotateCcw, X } from 'lucide-react';

interface Props {
  /** Full SVG markup string returned by the floor-plan API. */
  svg: string;
  fileName?: string;
}

interface Transform {
  scale: number;
  tx: number;
  ty: number;
}

interface RoomInfo {
  name: string;
  sqft: string;
  x: number;
  y: number;
}

const MIN_SCALE = 0.5;
const MAX_SCALE = 3;

/** Pan/zoom 2D floor plan viewer with room hover highlight + click info chips. */
export default function FloorPlan2DViewer({ svg, fileName = 'floor-plan.svg' }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [t, setT] = useState<Transform>({ scale: 1, tx: 0, ty: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [room, setRoom] = useState<RoomInfo | null>(null);
  const drag = useRef({ active: false, moved: false, startX: 0, startY: 0, baseTx: 0, baseTy: 0 });

  // Wheel zoom — manual non-passive listener so preventDefault works.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const cx = e.clientX - rect.left - rect.width / 2;
      const cy = e.clientY - rect.top - rect.height / 2;
      setT((prev) => {
        const next = Math.min(Math.max(prev.scale * (1 - e.deltaY * 0.0015), MIN_SCALE), MAX_SCALE);
        const ratio = next / prev.scale;
        return {
          scale: next,
          tx: cx - (cx - prev.tx) * ratio,
          ty: cy - (cy - prev.ty) * ratio,
        };
      });
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    drag.current = { active: true, moved: false, startX: e.clientX, startY: e.clientY, baseTx: 0, baseTy: 0 };
    setT((prev) => {
      drag.current.baseTx = prev.tx;
      drag.current.baseTy = prev.ty;
      return prev;
    });
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current.active) return;
    const dx = e.clientX - drag.current.startX;
    const dy = e.clientY - drag.current.startY;
    if (Math.abs(dx) + Math.abs(dy) > 4) drag.current.moved = true;
    setT((prev) => ({ ...prev, tx: drag.current.baseTx + dx, ty: drag.current.baseTy + dy }));
  }, []);

  const onPointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    drag.current.active = false;
    setIsDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* pointer capture may already be released */
    }
  }, []);

  /** Event delegation: clicking a `.room` group shows a floating info chip. */
  const onClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (drag.current.moved) return; // it was a pan, not a click
    const target = e.target as Element;
    const group = target.closest('g.room');
    const el = containerRef.current;
    if (!group || !el) {
      setRoom(null);
      return;
    }
    const name = group.getAttribute('data-room') ?? 'Room';
    const sqft = group.getAttribute('data-sqft') ?? '—';
    const rect = el.getBoundingClientRect();
    const x = Math.min(Math.max(e.clientX - rect.left, 70), rect.width - 90);
    const y = Math.min(Math.max(e.clientY - rect.top - 14, 30), rect.height - 60);
    setRoom({ name, sqft, x, y });
  }, []);

  const zoomBy = (factor: number) =>
    setT((prev) => ({ ...prev, scale: Math.min(Math.max(prev.scale * factor, MIN_SCALE), MAX_SCALE) }));

  const reset = () => setT({ scale: 1, tx: 0, ty: 0 });

  const download = () => {
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-2.5">
      {/* Room hover highlight per spec */}
      <style>{`
        .fp2d-stage .room { cursor: pointer; }
        .fp2d-stage .room:hover rect { stroke: #14B8A6; stroke-width: 4; }
        .fp2d-stage svg { width: 100%; height: 100%; display: block; }
      `}</style>

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5">
          <button aria-label="Zoom out" onClick={() => zoomBy(1 / 1.25)} className="btn-ghost !p-2 border border-gray-200">
            <Minus size={15} />
          </button>
          <span className="text-xs font-mono font-semibold text-gray-500 w-12 text-center tabular-nums">
            {Math.round(t.scale * 100)}%
          </span>
          <button aria-label="Zoom in" onClick={() => zoomBy(1.25)} className="btn-ghost !p-2 border border-gray-200">
            <Plus size={15} />
          </button>
          <button aria-label="Reset view" onClick={reset} className="btn-ghost !p-2 border border-gray-200">
            <RotateCcw size={15} />
          </button>
        </div>
        <button onClick={download} className="btn-ghost border border-gray-200 !py-2 text-xs">
          <Download size={14} /> Download SVG
        </button>
      </div>

      <div
        ref={containerRef}
        className={`relative h-[420px] sm:h-[500px] rounded-xl border border-gray-200 bg-white overflow-hidden touch-none select-none ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClick={onClick}
        role="application"
        aria-label="2D floor plan — drag to pan, scroll to zoom, click a room for details"
      >
        <div
          className="fp2d-stage absolute inset-0 p-4"
          style={{
            transform: `translate(${t.tx}px, ${t.ty}px) scale(${t.scale})`,
            transformOrigin: 'center center',
            transition: isDragging ? 'none' : 'transform 140ms ease-out',
          }}
          dangerouslySetInnerHTML={{ __html: svg }}
        />

        {room && (
          <div
            className="absolute z-10 -translate-x-1/2 -translate-y-full card px-3.5 py-2 anim-fade-in flex items-start gap-2 pointer-events-auto"
            style={{ left: room.x, top: room.y }}
            role="status"
          >
            <div>
              <p className="text-xs font-bold text-primary whitespace-nowrap">{room.name}</p>
              <p className="text-[11px] text-secondary font-semibold">{room.sqft} sqft</p>
            </div>
            <button
              aria-label="Close room info"
              onClick={(e) => {
                e.stopPropagation();
                setRoom(null);
              }}
              className="text-gray-300 hover:text-ink transition-colors mt-0.5"
            >
              <X size={12} />
            </button>
          </div>
        )}

        <p className="absolute bottom-2.5 right-3 text-[10px] text-gray-400 bg-white/85 rounded-md px-2 py-1 pointer-events-none">
          Drag to pan · Scroll to zoom · Click a room
        </p>
      </div>
    </div>
  );
}
