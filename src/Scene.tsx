import React, { useEffect, useRef } from 'react';

interface SceneProps {
  phase: 'reveal' | 'choose';
}

const Scene: React.FC<SceneProps> = ({ phase }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef({
    time: 0,
    revealAmount: 0,
    mistOffset: 0,
    starPhases: [] as number[],
    birds: [] as { x: number; y: number; vx: number; vy: number; phase: number; size: number }[],
    startTime: 0,
  });

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
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
    s.starPhases = Array.from({ length: 80 }, () => Math.random() * Math.PI * 2);
    s.startTime = performance.now();

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const lerpColor = (c1: number[], c2: number[], t: number) =>
      `rgb(${lerp(c1[0], c2[0], t) | 0}, ${lerp(c1[1], c2[1], t) | 0}, ${lerp(c1[2], c2[2], t) | 0})`;

    const draw = (t: number) => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const elapsed = (t - s.startTime) / 1000;

      // Reveal animates from 0→1 over 4 seconds
      s.revealAmount = Math.min(1, elapsed / 4);
      const eased = 1 - Math.pow(1 - s.revealAmount, 3); // easeOutCubic

      // Sky gradient: night → dawn
      const dp = eased;
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.9);
      const nightTop = [8, 10, 24];
      const dawnTop = [50, 35, 80];
      const nightMid = [20, 25, 50];
      const dawnMid = [200, 110, 145];
      const nightBot = [40, 50, 90];
      const dawnBot = [255, 175, 135];
      skyGrad.addColorStop(0, lerpColor(nightTop, dawnTop, dp));
      skyGrad.addColorStop(0.55, lerpColor(nightMid, dawnMid, dp));
      skyGrad.addColorStop(1, lerpColor(nightBot, dawnBot, dp));
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h);

      // Stars (fade out)
      const starOp = 1 - dp * 0.95;
      if (starOp > 0.05) {
        for (let i = 0; i < s.starPhases.length; i++) {
          const sx = (i * 137.5) % w;
          const sy = (i * 89.3) % (h * 0.6);
          const tw = (Math.sin(t * 0.001 + s.starPhases[i]) + 1) / 2;
          const size = 0.5 + tw * 1.2;
          ctx.fillStyle = `rgba(255, 255, 255, ${starOp * (0.4 + tw * 0.6)})`;
          ctx.beginPath();
          ctx.arc(sx, sy, size, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Sun
      const sunY = h * (0.78 - dp * 0.42);
      const sunX = w * 0.62;
      const sunSize = 50 + dp * 30;

      const halo = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunSize * 5);
      halo.addColorStop(0, `rgba(255, 220, 180, ${0.55 * dp})`);
      halo.addColorStop(0.3, `rgba(255, 180, 140, ${0.28 * dp})`);
      halo.addColorStop(1, 'rgba(255, 150, 100, 0)');
      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, w, h);

      const sunGrad = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunSize);
      sunGrad.addColorStop(0, `rgba(255, 245, 220, ${0.95 * dp})`);
      sunGrad.addColorStop(0.5, `rgba(255, 200, 150, ${0.85 * dp})`);
      sunGrad.addColorStop(1, 'rgba(255, 150, 100, 0)');
      ctx.fillStyle = sunGrad;
      ctx.beginPath();
      ctx.arc(sunX, sunY, sunSize, 0, Math.PI * 2);
      ctx.fill();

      // Mountain layers
      const layers = [
        { baseY: 0.55, amplitude: 0.10, frequency: 0.003, color: [50, 55, 90], opacity: 0.7, mistTop: 0.2 },
        { baseY: 0.62, amplitude: 0.13, frequency: 0.0025, color: [38, 42, 70], opacity: 0.8, mistTop: 0.3 },
        { baseY: 0.70, amplitude: 0.10, frequency: 0.004, color: [25, 28, 50], opacity: 0.9, mistTop: 0.4 },
        { baseY: 0.78, amplitude: 0.08, frequency: 0.005, color: [12, 14, 28], opacity: 1.0, mistTop: 0.6 },
      ];

      layers.forEach((L, idx) => {
        const c = L.color.map((ch, i) => {
          const w = [ch + 20 * dp, ch + 5 * dp, ch - 5 * dp][i];
          return Math.min(255, Math.max(0, w)) | 0;
        });
        ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${L.opacity})`;
        ctx.beginPath();
        ctx.moveTo(0, h);
        const baseY = h * L.baseY;
        for (let x = 0; x <= w; x += 4) {
          const noise =
            Math.sin(x * L.frequency + idx * 100) * 0.6 +
            Math.sin(x * L.frequency * 2.3 + idx * 50) * 0.3 +
            Math.sin(x * L.frequency * 5 + idx * 25) * 0.1;
          ctx.lineTo(x, baseY - noise * h * L.amplitude);
        }
        ctx.lineTo(w, h);
        ctx.closePath();
        ctx.fill();

        const mistG = ctx.createLinearGradient(0, baseY - h * L.amplitude, 0, baseY + h * 0.05);
        mistG.addColorStop(0, 'rgba(255, 220, 200, 0)');
        mistG.addColorStop(1, `rgba(255, 220, 200, ${0.18 * dp * L.mistTop})`);
        ctx.fillStyle = mistG;
        ctx.fillRect(0, baseY - h * 0.1, w, h * 0.3);
      });

      // Drifting mist
      s.mistOffset += 0.15;
      const mist2 = ctx.createLinearGradient(0, h * 0.55, 0, h * 0.85);
      mist2.addColorStop(0, 'rgba(255, 230, 210, 0)');
      mist2.addColorStop(0.5, `rgba(255, 220, 200, ${0.12 * dp})`);
      mist2.addColorStop(1, 'rgba(255, 220, 200, 0)');
      ctx.fillStyle = mist2;
      for (let i = 0; i < 3; i++) {
        const off = (s.mistOffset * (1 + i * 0.5)) % (w * 1.5);
        ctx.save();
        ctx.translate(-off + i * w * 0.4, 0);
        ctx.fillRect(0, h * 0.55, w * 1.5, h * 0.3);
        ctx.restore();
      }

      // Birds appear after sun is up
      if (dp > 0.7) {
        if (s.birds.length === 0) {
          for (let i = 0; i < 6; i++) {
            s.birds.push({
              x: -50 - Math.random() * 200,
              y: h * 0.25 + Math.random() * h * 0.2,
              vx: 1.0 + Math.random() * 0.7,
              vy: -0.05 + Math.random() * 0.15,
              phase: Math.random() * Math.PI * 2,
              size: 7 + Math.random() * 5,
            });
          }
        }
        s.birds.forEach((b) => {
          b.x += b.vx;
          b.y += b.vy + Math.sin(t * 0.003 + b.phase) * 0.25;
          ctx.strokeStyle = 'rgba(20, 25, 40, 0.65)';
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          const flap = Math.sin(t * 0.015 + b.phase) * b.size * 0.5;
          ctx.moveTo(b.x - b.size, b.y + flap);
          ctx.quadraticCurveTo(b.x, b.y, b.x + b.size, b.y + flap);
          ctx.stroke();
        });
        s.birds = s.birds.filter((b) => b.x < w + 100);
      }
    };

    let raf = 0;
    const tick = (t: number) => {
      stateRef.current.time = t;
      draw(t);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`lull-scene ${phase === 'choose' ? 'lull-scene-dim' : ''}`}
    />
  );
};

export default Scene;
