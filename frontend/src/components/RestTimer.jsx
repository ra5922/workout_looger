import { useState, useEffect, useRef } from 'react';

const PRESETS = [30, 60, 90, 120, 180];

export default function RestTimer() {
  const [isOpen, setIsOpen] = useState(false);
  const [duration, setDuration] = useState(90);
  const [timeLeft, setTimeLeft] = useState(90);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    if (running && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            setRunning(false);
            playBeep();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  const playBeep = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      [0, 0.3, 0.6].forEach(delay => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.3, ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.2);
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + 0.2);
      });
    } catch (e) {}
  };

  const start = () => { setTimeLeft(duration); setRunning(true); };
  const pause = () => { setRunning(false); clearInterval(intervalRef.current); };
  const reset = () => { setRunning(false); clearInterval(intervalRef.current); setTimeLeft(duration); };

  const setPreset = (s) => { setDuration(s); setTimeLeft(s); setRunning(false); };

  const pct = (timeLeft / duration) * 100;
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed', bottom: '1.5rem', right: '1.5rem',
          background: 'var(--accent)', color: '#000',
          border: 'none', borderRadius: '50px', padding: '0.75rem 1.25rem',
          fontFamily: 'Syne', fontWeight: 700, fontSize: '0.85rem',
          cursor: 'pointer', boxShadow: '0 4px 20px rgba(232,255,71,0.3)',
          zIndex: 1000,
        }}
      >
        ⏱ Rest Timer
      </button>
    );
  }

  return (
    <div style={{
      position: 'fixed', bottom: '1.5rem', right: '1.5rem',
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: '16px', padding: '1.25rem', width: '240px',
      boxShadow: '0 8px 40px rgba(0,0,0,0.5)', zIndex: 1000,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '0.85rem', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Rest Timer</span>
        <button onClick={() => { setIsOpen(false); pause(); }} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
      </div>

      {/* Presets */}
      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        {PRESETS.map(s => (
          <button
            key={s}
            onClick={() => setPreset(s)}
            style={{
              flex: 1, padding: '0.3rem', border: '1px solid', borderRadius: '6px', cursor: 'pointer',
              fontFamily: 'Syne', fontWeight: 600, fontSize: '0.75rem',
              background: duration === s ? 'var(--accent)' : 'var(--surface2)',
              color: duration === s ? '#000' : 'var(--muted)',
              borderColor: duration === s ? 'var(--accent)' : 'var(--border)',
            }}
          >
            {s}s
          </button>
        ))}
      </div>

      {/* Timer display */}
      <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
        <div style={{
          fontFamily: 'Syne', fontWeight: 800, fontSize: '3rem',
          color: timeLeft === 0 ? 'var(--danger)' : timeLeft < 10 ? '#ff9f40' : 'var(--text)',
          lineHeight: 1,
        }}>
          {mins}:{secs.toString().padStart(2, '0')}
        </div>
        {/* Progress bar */}
        <div style={{ marginTop: '0.75rem', background: 'var(--surface2)', borderRadius: '4px', height: '4px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: timeLeft < 10 ? 'var(--danger)' : 'var(--accent)', transition: 'width 1s linear', borderRadius: '4px' }} />
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        {!running ? (
          <button className="btn btn-primary" onClick={start} style={{ flex: 1, justifyContent: 'center' }}>
            {timeLeft === duration ? '▶ Start' : '▶ Resume'}
          </button>
        ) : (
          <button className="btn btn-secondary" onClick={pause} style={{ flex: 1, justifyContent: 'center' }}>⏸ Pause</button>
        )}
        <button className="btn btn-ghost" onClick={reset}>↺</button>
      </div>
    </div>
  );
}