import React, { useEffect, useRef, useState } from 'react';

interface HeavyDayProps {
  onDone: () => void;
}

// Slow, honest typing-style sequence. No fixes, no advice. Just presence.
const LINES = [
  { text: 'hi.', delay: 1500 },
  { text: 'this is the page for hard days.', delay: 2200 },
  { text: 'i won\'t pretend to know exactly what\'s going on.', delay: 3000 },
  { text: 'and i won\'t try to fix it.', delay: 2400 },
  { text: 'some days are just heavy.', delay: 2200 },
  { text: 'and that\'s allowed.', delay: 2400 },
  { text: 'if you want, breathe with this.', delay: 2600 },
];

// The simple guided exhale at the end
const BREATH_DURATION = 30; // seconds — much shorter than slow-down breathing

const HeavyDay: React.FC<HeavyDayProps> = ({ onDone }) => {
  const [stage, setStage] = useState<'words' | 'breath' | 'closing'>('words');
  const [visibleCount, setVisibleCount] = useState(0);
  const [breathPhase, setBreathPhase] = useState<'in' | 'hold' | 'out'>('in');
  const [breathProgress, setBreathProgress] = useState(0);
  const [breathSecondsLeft, setBreathSecondsLeft] = useState(BREATH_DURATION);
  const startRef = useRef<number>(0);

  // Reveal lines one by one
  useEffect(() => {
    if (stage !== 'words') return;
    if (visibleCount >= LINES.length) {
      const t = setTimeout(() => setStage('breath'), 1800);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      setVisibleCount((v) => v + 1);
    }, LINES[visibleCount].delay);
    return () => clearTimeout(t);
  }, [stage, visibleCount]);

  // Breath stage — simple in/hold/out cycle (4-2-6)
  useEffect(() => {
    if (stage !== 'breath') return;
    startRef.current = performance.now();
    let raf = 0;
    const tick = () => {
      const elapsed = (performance.now() - startRef.current) / 1000;
      const remaining = Math.max(0, BREATH_DURATION - elapsed);
      setBreathSecondsLeft(Math.ceil(remaining));

      const cycle = elapsed % 12; // 4 in + 2 hold + 6 out = 12s
      let phase: 'in' | 'hold' | 'out';
      let progress: number;
      if (cycle < 4) {
        phase = 'in';
        progress = cycle / 4;
      } else if (cycle < 6) {
        phase = 'hold';
        progress = (cycle - 4) / 2;
      } else {
        phase = 'out';
        progress = (cycle - 6) / 6;
      }
      setBreathPhase(phase);
      setBreathProgress(progress);

      if (elapsed >= BREATH_DURATION) {
        setStage('closing');
        cancelAnimationFrame(raf);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [stage]);

  useEffect(() => {
    if (stage !== 'closing') return;
    const t = setTimeout(onDone, 6500);
    return () => clearTimeout(t);
  }, [stage, onDone]);

  // Orb scale for breathing
  const ease = (t: number) => 0.5 - 0.5 * Math.cos(Math.PI * t);
  let orbScale = 0.65;
  if (breathPhase === 'in') orbScale = 0.65 + 0.35 * ease(breathProgress);
  else if (breathPhase === 'hold') orbScale = 1.0;
  else orbScale = 1.0 - 0.35 * ease(breathProgress);

  const phaseLabel = breathPhase === 'in' ? 'breathe in' : breathPhase === 'hold' ? 'hold' : 'let it out';

  return (
    <div className="lull-heavy">
      <div className="lull-heavy-bg" />

      {stage === 'words' && (
        <div className="lull-heavy-words">
          {LINES.slice(0, visibleCount).map((l, i) => (
            <p
              key={i}
              className={`lull-heavy-line ${i === visibleCount - 1 ? 'lull-heavy-active' : ''}`}
            >
              {l.text}
            </p>
          ))}
        </div>
      )}

      {stage === 'breath' && (
        <>
          <div className="lull-heavy-breath-stage">
            <div className="lull-heavy-orb-wrap">
              <div
                className="lull-heavy-orb"
                style={{ transform: `translate(-50%, -50%) scale(${orbScale})` }}
              />
              <div
                className="lull-heavy-orb-glow"
                style={{ opacity: 0.35 + 0.5 * (orbScale - 0.65) / 0.35 }}
              />
            </div>
            <p className="lull-heavy-phase">{phaseLabel}</p>
          </div>
          <div className="lull-heavy-counter">
            <span className="lull-heavy-num">{breathSecondsLeft}</span>
            <span className="lull-heavy-unit">seconds</span>
          </div>
        </>
      )}

      {stage === 'closing' && (
        <div className="lull-heavy-closing">
          <p className="lull-heavy-closing-eyebrow">·</p>
          <h2 className="lull-heavy-closing-title">that's all i had.</h2>
          <p className="lull-heavy-closing-sub">
            i hope something in your day softens.
            <br />
            even just a little.
          </p>
        </div>
      )}

      <button className="lull-heavy-skip" onClick={onDone}>skip</button>
    </div>
  );
};

export default HeavyDay;
