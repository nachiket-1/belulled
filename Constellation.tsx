import React, { useEffect, useRef, useState } from 'react';

interface ConstellationProps {
  onDone: () => void;
}

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  phase: number;
  brightness: number;
  isCore: boolean;
}

interface Line {
  fromId: number;
  toId: number;
}

const STAR_COUNT = 90;
const SNAP_RADIUS = 38;

const Constellation: React.FC<ConstellationProps> = ({ onDone }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [done, setDone] = useState(false);
  const [linesDrawn, setLinesDrawn] = useState(0);

  const stateRef = useRef({
    stars: [] as Star[],
    lines: [] as Line[],
    mouseX: -100,
    mouseY: -100,
    mouseActive: false,
    isDragging: false,
    dragFromId: null as number | null,
    hoveredId: null as number | null,
    lastTouchX: 0,
    lastTouchY: 0,
  });

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener('resize', resize);

    const s = stateRef.current;

    s.stars = [];
    for (let i = 0; i < STAR_COUNT; i++) {
      const isCore = Math.random() < 0.25;
      s.stars.push({
        id: i,
        x: Math.random(),
        y: Math.random() * 0.85 + 0.05,
        size: isCore ? 2.0 + Math.random() * 1.5 : 0.6 + Math.random() * 1.0,
        phase: Math.random() * Math.PI * 2,
        brightness: isCore ? 0.85 + Math.random() * 0.15 : 0.3 + Math.random() * 0.4,
        isCore,
      });
    }

    const findStarNear = (x: number, y: number): Star | null => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      let closest: Star | null = null;
      let minDist = SNAP_RADIUS;
      for (const star of s.stars) {
        if (!star.isCore) continue;
        const sx = star.x * w;
        const sy = star.y * h;
        const d = Math.sqrt((sx - x) ** 2 + (sy - y) ** 2);
        if (d < minDist) {
          minDist = d;
          closest = star;
        }
      }
      return closest;
    };

    const lineExists = (a: number, b: number) =>
      s.lines.some((l) =>
        (l.fromId === a && l.toId === b) || (l.fromId === b && l.toId === a)
      );

    const onPointerDown = (x: number, y: number) => {
      s.mouseX = x;
      s.mouseY = y;
      s.mouseActive = true;
      s.isDragging = true;
      const star = findStarNear(x, y);
      if (star) s.dragFromId = star.id;
    };

    const onPointerMove = (x: number, y: number) => {
      s.mouseX = x;
      s.mouseY = y;
      s.mouseActive = true;
      const star = findStarNear(x, y);
      s.hoveredId = star ? star.id : null;
    };

    const onPointerUp = (x: number, y: number) => {
      if (s.isDragging && s.dragFromId !== null) {
        const star = findStarNear(x, y);
        if (star && star.id !== s.dragFromId && !lineExists(s.dragFromId, star.id)) {
          s.lines.push({ fromId: s.dragFromId, toId: star.id });
          setLinesDrawn(s.lines.length);
        }
      }
      s.isDragging = false;
      s.dragFromId = null;
    };

    const handleMouseDown = (e: MouseEvent) => onPointerDown(e.clientX, e.clientY);
    const handleMouseMove = (e: MouseEvent) => onPointerMove(e.clientX, e.clientY);
    const handleMouseUp   = (e: MouseEvent) => onPointerUp(e.clientX, e.clientY);

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches[0]) {
        s.lastTouchX = e.touches[0].clientX;
        s.lastTouchY = e.touches[0].clientY;
        onPointerDown(e.touches[0].clientX, e.touches[0].clientY);
      }
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) {
        s.lastTouchX = e.touches[0].clientX;
        s.lastTouchY = e.touches[0].clientY;
        onPointerMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };
    const handleTouchEnd = () => onPointerUp(s.lastTouchX, s.lastTouchY);

    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('touchstart', handleTouchStart, { passive: true });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: true });
    canvas.addEventListener('touchend', handleTouchEnd);

    let raf = 0;
    const tick = (t: number) => {
      const w = window.innerWidth;
      const h = window.innerHeight;

      const bg = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h));
      bg.addColorStop(0, '#0c0a18');
      bg.addColorStop(0.7, '#05050a');
      bg.addColorStop(1, '#020205');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      for (let i = 0; i < 200; i++) {
        const dx = (i * 137.5) % w;
        const dy = (i * 89.3) % h;
        ctx.fillStyle = `rgba(255, 255, 255, 0.04)`;
        ctx.fillRect(dx, dy, 1, 1);
      }

      // Lines
      s.lines.forEach((line) => {
        const a = s.stars[line.fromId];
        const b = s.stars[line.toId];
        if (!a || !b) return;
        const ax = a.x * w;
        const ay = a.y * h;
        const bx = b.x * w;
        const by = b.y * h;

        const grad = ctx.createLinearGradient(ax, ay, bx, by);
        grad.addColorStop(0, 'rgba(212, 197, 255, 0.7)');
        grad.addColorStop(0.5, 'rgba(255, 230, 180, 0.45)');
        grad.addColorStop(1, 'rgba(212, 197, 255, 0.7)');
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.2;
        ctx.shadowColor = 'rgba(212, 197, 255, 0.6)';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(bx, by);
        ctx.stroke();
        ctx.shadowBlur = 0;
      });

      // Active drag line
      if (s.isDragging && s.dragFromId !== null) {
        const from = s.stars[s.dragFromId];
        if (from) {
          const fx = from.x * w;
          const fy = from.y * h;
          ctx.strokeStyle = 'rgba(255, 230, 180, 0.7)';
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 6]);
          ctx.beginPath();
          ctx.moveTo(fx, fy);
          ctx.lineTo(s.mouseX, s.mouseY);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }

      // Stars
      s.stars.forEach((star) => {
        const sx = star.x * w;
        const sy = star.y * h;
        const tw = (Math.sin(t * 0.001 + star.phase) + 1) / 2;
        const isHovered = s.hoveredId === star.id;
        const isStartOfLine = s.dragFromId === star.id;

        if (star.isCore || isHovered) {
          const haloSize = star.size * (isHovered ? 12 : 8);
          const haloOpacity = (isHovered ? 0.4 : 0.18) * (0.7 + tw * 0.3);
          const halo = ctx.createRadialGradient(sx, sy, 0, sx, sy, haloSize);
          halo.addColorStop(0, `rgba(255, 240, 200, ${haloOpacity})`);
          halo.addColorStop(0.5, `rgba(212, 197, 255, ${haloOpacity * 0.4})`);
          halo.addColorStop(1, 'rgba(212, 197, 255, 0)');
          ctx.fillStyle = halo;
          ctx.beginPath();
          ctx.arc(sx, sy, haloSize, 0, Math.PI * 2);
          ctx.fill();
        }

        const brightness = star.brightness * (0.7 + tw * 0.3);
        ctx.fillStyle = isStartOfLine
          ? `rgba(255, 240, 200, ${brightness * 1.5})`
          : `rgba(255, 250, 230, ${brightness})`;
        ctx.beginPath();
        ctx.arc(sx, sy, star.size * (isHovered ? 1.4 : 1), 0, Math.PI * 2);
        ctx.fill();
      });

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  const handleFinish = () => {
    setDone(true);
    setTimeout(onDone, 4500);
  };

  return (
    <div className="lull-const">
      <canvas ref={canvasRef} className="lull-const-canvas" />

      <div className="lull-const-counter">
        <span className="lull-const-num">{linesDrawn}</span>
        <span className="lull-const-label">{linesDrawn === 1 ? 'line' : 'lines'}</span>
      </div>

      {linesDrawn === 0 && !done && (
        <div className="lull-const-hint">
          <p>drag from one bright star to another</p>
        </div>
      )}

      {!done && linesDrawn > 0 && (
        <button className="lull-const-finish" onClick={handleFinish}>
          <span>name it</span>
          <span className="lull-const-arrow">→</span>
        </button>
      )}

      {done && (
        <div className="lull-const-done">
          <p className="lull-const-done-eyebrow">your constellation</p>
          <h2 className="lull-const-done-title">it has never existed before.</h2>
          <p className="lull-const-done-sub">no one will ever draw it the same way.<br/>that's what makes it yours.</p>
        </div>
      )}

      <button className="lull-const-skip" onClick={onDone}>skip</button>
    </div>
  );
};

export default Constellation;
