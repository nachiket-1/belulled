import React, { useEffect, useState, useRef } from 'react';

interface BreathingProps {
  onDone: () => void;
}

const TOTAL_SECONDS = 60;
const CYCLE = 11;
const PHASES = [
  { label: 'breathe in', duration: 4 },
  { label: 'breathe out', duration: 7 },
];

// Sound options — files live in /public/sounds/
type SoundKey = 'silence' | 'rain' | 'ocean' | 'fire' | 'night' | 'stream';
const SOUNDS: { key: SoundKey; label: string; sub: string; file: string | null; glyph: string }[] = [
  { key: 'silence', label: 'silence', sub: 'just breath', file: null, glyph: '◌' },
  { key: 'rain',    label: 'rain',    sub: 'soft, falling',         file: 'rain.mp3',   glyph: '☂' },
  { key: 'ocean',   label: 'ocean',   sub: 'slow, returning',       file: 'ocean.mp3',  glyph: '~' },
  { key: 'fire',    label: 'fire',    sub: 'warm, crackling',       file: 'fire.mp3',   glyph: '✦' },
  { key: 'night',   label: 'night',   sub: 'crickets, far away',    file: 'night.mp3',  glyph: '☽' },
  { key: 'stream',  label: 'stream',  sub: 'gentle, moving water',  file: 'stream.mp3', glyph: '≋' },
];

// Resolve audio path correctly whether site runs at root or /lull/
const audioPath = (file: string) => `${import.meta.env.BASE_URL}sounds/${file}`;

const Breathing: React.FC<BreathingProps> = ({ onDone }) => {
  const [stage, setStage] = useState<'pick' | 'breathe' | 'done'>('pick');
  const [chosenSound, setChosenSound] = useState<SoundKey>('silence');
  const [secondsLeft, setSecondsLeft] = useState(TOTAL_SECONDS);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [phaseProgress, setPhaseProgress] = useState(0);
  const startRef = useRef<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Begin breathing (started after sound picked)
  const startBreathing = (sound: SoundKey) => {
    setChosenSound(sound);
    setStage('breathe');
    startRef.current = performance.now();

    // Start audio if a file is chosen
    const config = SOUNDS.find((s) => s.key === sound);
    if (config?.file) {
      const audio = new Audio(audioPath(config.file));
      audio.loop = true;
      audio.volume = 0;
      audio.play().catch(() => {
        // some browsers block autoplay; this is fine — silence is acceptable fallback
      });
      // fade in
      let v = 0;
      const fade = setInterval(() => {
        v = Math.min(0.55, v + 0.04);
        audio.volume = v;
        if (v >= 0.55) clearInterval(fade);
      }, 60);
      audioRef.current = audio;
    }
  };

  // Animation loop while breathing
  useEffect(() => {
    if (stage !== 'breathe') return;
    let raf = 0;
    const tick = () => {
      const now = performance.now();
      const elapsed = (now - startRef.current) / 1000;
      const remaining = Math.max(0, TOTAL_SECONDS - elapsed);
      setSecondsLeft(Math.ceil(remaining));

      const cycleTime = elapsed % CYCLE;
      let pIdx = 0;
      let pTime = cycleTime;
      if (cycleTime < PHASES[0].duration) {
        pIdx = 0;
        pTime = cycleTime;
      } else {
        pIdx = 1;
        pTime = cycleTime - PHASES[0].duration;
      }
      setPhaseIdx(pIdx);
      setPhaseProgress(pTime / PHASES[pIdx].duration);

      if (elapsed >= TOTAL_SECONDS) {
        setStage('done');
        // Fade audio out
        if (audioRef.current) {
          const a = audioRef.current;
          let v = a.volume;
          const fadeOut = setInterval(() => {
            v = Math.max(0, v - 0.03);
            a.volume = v;
            if (v <= 0) {
              clearInterval(fadeOut);
              a.pause();
            }
          }, 60);
        }
        cancelAnimationFrame(raf);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [stage]);

  // Auto-close after done
  useEffect(() => {
    if (stage !== 'done') return;
    const t = setTimeout(onDone, 4500);
    return () => clearTimeout(t);
  }, [stage, onDone]);

  // Cleanup audio when unmounting
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handleSkip = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    onDone();
  };

  // ── PICK SOUND STAGE ──
  if (stage === 'pick') {
    return (
      <div className="lull-breath">
        <div className="lull-breath-bg" />
        <div className="lull-pick-stage">
          <div className="lull-pick-header">
            <p className="lull-pick-eyebrow">choose your background</p>
            <h2 className="lull-pick-title">what would you like to hear?</h2>
          </div>
          <div className="lull-pick-grid">
            {SOUNDS.map((s, i) => (
              <button
                key={s.key}
                className="lull-pick-card"
                onClick={() => startBreathing(s.key)}
                style={{ animationDelay: `${i * 70}ms` }}
              >
                <span className="lull-pick-glyph">{s.glyph}</span>
                <span className="lull-pick-label">{s.label}</span>
                <span className="lull-pick-sub">{s.sub}</span>
              </button>
            ))}
          </div>
        </div>
        <button className="lull-breath-skip" onClick={handleSkip}>skip</button>
      </div>
    );
  }

  // ── DONE STAGE ──
  if (stage === 'done') {
    return (
      <div className="lull-breath-done">
        <div className="lull-breath-done-orb" />
        <h2 className="lull-breath-done-title">a minute, returned to you.</h2>
        <p className="lull-breath-done-sub">notice how things feel, just a touch quieter.</p>
      </div>
    );
  }

  // ── BREATHING STAGE ──
  const ease = (t: number) => 0.5 - 0.5 * Math.cos(Math.PI * t);
  const scale = phaseIdx === 0
    ? 0.6 + 0.4 * ease(phaseProgress)
    : 1.0 - 0.4 * ease(phaseProgress);

  return (
    <div className="lull-breath">
      <div className="lull-breath-bg" />
      <div className="lull-breath-stage">
        <div className="lull-breath-orb-wrap">
          <div
            className="lull-breath-orb"
            style={{ transform: `translate(-50%, -50%) scale(${scale})` }}
          />
          <div
            className="lull-breath-orb-glow"
            style={{ opacity: 0.3 + 0.4 * (scale - 0.6) / 0.4 }}
          />
        </div>
        <p className="lull-breath-label">{PHASES[phaseIdx].label}</p>
      </div>

      <div className="lull-breath-counter">
        <span className="lull-breath-num">{secondsLeft}</span>
        <span className="lull-breath-unit">seconds</span>
      </div>

      <button className="lull-breath-skip" onClick={handleSkip}>skip</button>
    </div>
  );
};

export default Breathing;
