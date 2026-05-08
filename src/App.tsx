import React, { useEffect, useState, useCallback } from 'react';
import Scene from './Scene';
import Breathing from './Breathing';
import FeelSmall from './FeelSmall';
import Constellation from './Constellation';
import HeavyDay from './HeavyDay';

const SIGNATURE = 'Nachiket';

type Phase = 'enter' | 'reveal' | 'choose' | 'breath' | 'small' | 'play' | 'heavy' | 'closer';

const App: React.FC = () => {
  const [phase, setPhase] = useState<Phase>('enter');
  const [showHint, setShowHint] = useState(true);

  const transitionTo = useCallback((next: Phase) => {
    setPhase(next);
  }, []);

  // First interaction → reveal
  useEffect(() => {
    if (phase !== 'enter') return;
    const handler = () => {
      setShowHint(false);
      setTimeout(() => transitionTo('reveal'), 400);
    };
    window.addEventListener('pointerdown', handler, { once: true });
    window.addEventListener('touchstart', handler, { once: true });
    window.addEventListener('keydown', handler, { once: true });
    return () => {
      window.removeEventListener('pointerdown', handler);
      window.removeEventListener('touchstart', handler);
      window.removeEventListener('keydown', handler);
    };
  }, [phase, transitionTo]);

  // After reveal animation finishes → choose
  useEffect(() => {
    if (phase !== 'reveal') return;
    const t = setTimeout(() => transitionTo('choose'), 4500);
    return () => clearTimeout(t);
  }, [phase, transitionTo]);

  return (
    <div className="lull-root">
      {(phase === 'reveal' || phase === 'choose') && <Scene phase={phase} />}

      {phase === 'enter' && (
        <div className="lull-enter">
          <div className={`lull-orb ${showHint ? '' : 'lull-orb-out'}`} />
          <p className={`lull-enter-hint ${showHint ? '' : 'lull-fade-out'}`}>
            <span className="lull-enter-line" />
            <span>tap to be lulled</span>
            <span className="lull-enter-line" />
          </p>
        </div>
      )}

      {phase === 'choose' && <ChoosePanel onPick={transitionTo} />}

      {phase === 'breath' && <Breathing onDone={() => transitionTo('closer')} />}
      {phase === 'small' && <FeelSmall onDone={() => transitionTo('closer')} />}
      {phase === 'play' && <Constellation onDone={() => transitionTo('closer')} />}
      {phase === 'heavy' && <HeavyDay onDone={() => transitionTo('closer')} />}

      {phase === 'closer' && <Closer onAgain={() => transitionTo('choose')} />}

      <div className={`lull-signature ${phase === 'enter' ? 'lull-sig-faint' : ''}`}>
        <span className="lull-sig-mark">lull</span>
        <span className="lull-sig-divider" />
        <span className="lull-sig-by">by {SIGNATURE}</span>
      </div>
    </div>
  );
};

// ─── CHOOSE PANEL ─────────────────────────────────────────
const choices = [
  {
    key: 'breath' as Phase,
    label: 'slow down',
    sub: 'one minute, returned to you',
    glyph: '◐',
    accent: '#9ec5ef',
  },
  {
    key: 'small' as Phase,
    label: 'feel small',
    sub: 'a glimpse, from far away',
    glyph: '○',
    accent: '#b19eef',
  },
  {
    key: 'play' as Phase,
    label: 'play',
    sub: 'draw your own stars',
    glyph: '✦',
    accent: '#efb19e',
  },
  {
    key: 'heavy' as Phase,
    label: 'heavy day',
    sub: 'something for when it is hard',
    glyph: '◌',
    accent: '#9eefc5',
  },
];

const ChoosePanel: React.FC<{ onPick: (p: Phase) => void }> = ({ onPick }) => {
  return (
    <div className="lull-choose">
      <div className="lull-choose-header">
        <p className="lull-choose-eyebrow">a small offering</p>
        <h1 className="lull-choose-title">what do you need right now?</h1>
      </div>
      <div className="lull-choose-grid">
        {choices.map((c, i) => (
          <button
            key={c.key}
            className="lull-choice"
            onClick={() => onPick(c.key)}
            style={{
              animationDelay: `${i * 100}ms`,
              ['--choice-accent' as any]: c.accent,
            }}
          >
            <span className="lull-choice-glyph">{c.glyph}</span>
            <span className="lull-choice-label">{c.label}</span>
            <span className="lull-choice-sub">{c.sub}</span>
            <span className="lull-choice-arrow">→</span>
          </button>
        ))}
      </div>
    </div>
  );
};

// ─── CLOSER ─────────────────────────────────────────────────
const Closer: React.FC<{ onAgain: () => void }> = ({ onAgain }) => {
  return (
    <div className="lull-closer">
      <p className="lull-closer-eyebrow">·</p>
      <h2 className="lull-closer-title">that was a small lull.</h2>
      <p className="lull-closer-sub">come back whenever the noise gets loud.</p>
      <button className="lull-closer-btn" onClick={onAgain}>
        <span>one more</span>
        <span className="lull-closer-arrow">↺</span>
      </button>
    </div>
  );
};

export default App;
