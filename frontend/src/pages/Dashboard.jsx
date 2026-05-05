import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { getWorkouts, deleteWorkout, getStats, duplicateWorkout } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import RestTimer from '../components/RestTimer';

function muscleGroupClass(group) {
  const map = { Chest: 'chest', Back: 'back', Legs: 'legs', Shoulders: 'shoulders', Arms: 'arms', Core: 'core', Cardio: 'cardio', 'Full Body': 'full-body' };
  return `badge badge-${map[group] || 'default'}`;
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now - d) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return `${diff} days ago`;
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

// Calculate streak from workout dates
function calcStreak(workouts) {
  if (!workouts.length) return 0;
  const dates = [...new Set(workouts.map(w => w.date))].sort().reverse();
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  if (dates[0] !== today && dates[0] !== yesterday) return 0;
  let streak = 1;
  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1]);
    const curr = new Date(dates[i]);
    const diff = Math.round((prev - curr) / 86400000);
    if (diff === 1) streak++;
    else break;
  }
  return streak;
}

function Sparkline({ data, color = 'var(--accent)' }) {
  if (!data || data.length < 2) return (
    <svg viewBox="0 0 80 28" style={{ width: '80px', height: '28px', opacity: 0.25 }}>
      <line x1="0" y1="14" x2="80" y2="14" stroke={color} strokeWidth="1.5" strokeDasharray="3,3" />
    </svg>
  );
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const W = 80, H = 28, pad = 3;
  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (W - pad * 2);
    const y = H - pad - ((v - min) / range) * (H - pad * 2);
    return `${x},${y}`;
  }).join(' ');
  const lastX = pad + ((data.length - 1) / (data.length - 1)) * (W - pad * 2);
  const lastY = H - pad - ((data[data.length - 1] - min) / range) * (H - pad * 2);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '80px', height: '28px' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={lastX} cy={lastY} r="3" fill={color} />
    </svg>
  );
}

function StatCard({ value, label, trend, sparkData, sparkColor }) {
  const trendPositive = trend > 0;
  const showTrend = trend !== null && trend !== undefined && trend !== 0;
  return (
    <div className="stat-card gymiq-stat-card" style={{
      borderLeft: '3px solid var(--accent)',
      borderRadius: '10px',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.2rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
        {/* Value in plain text color, NOT yellow */}
        <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 'clamp(1.1rem, 2.5vw, 1.7rem)', lineHeight: 1.1, color: 'var(--text)' }}>
          {value}
        </div>
        {showTrend && (
          <span style={{
            fontSize: '0.7rem', fontWeight: 700,
            color: trendPositive ? '#40ff80' : 'var(--danger)',
            background: trendPositive ? 'rgba(64,255,128,0.12)' : 'rgba(255,80,80,0.12)',
            padding: '0.15rem 0.4rem', borderRadius: '20px',
            whiteSpace: 'nowrap', marginTop: '0.2rem',
          }}>
            {trendPositive ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      {/* Label in muted, not yellow */}
      <div style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem' }}>
        {label}
      </div>
      <Sparkline data={sparkData} color={sparkColor || '#888'} />
    </div>
  );
}

const NAV_ITEMS = [
  { to: '/', label: 'Home', icon: '▦' },
  { to: '/progress', label: 'Progress', icon: '↗' },
  { to: '/weekly', label: 'Weekly', icon: '◫' },
  { to: '/templates', label: 'Templates', icon: '❐' },
  { to: '/bodyweight', label: 'Weight', icon: '◎' },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { firstName, isNewUser, signOut } = useAuth();
  const [workouts, setWorkouts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [duplicating, setDuplicating] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [timerOpen, setTimerOpen] = useState(false);

  useEffect(() => {
    Promise.all([getWorkouts(), getStats()])
      .then(([w, s]) => { setWorkouts(w); setStats(s); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (e, id) => {
    e.preventDefault();
    if (!confirm('Delete this workout?')) return;
    await deleteWorkout(id);
    setWorkouts(w => w.filter(x => x.id !== id));
  };

  const handleDuplicate = async (e, id) => {
    e.preventDefault();
    setDuplicating(id);
    try {
      const newWorkout = await duplicateWorkout(id);
      const refreshed = await getWorkouts();
      setWorkouts(refreshed);
      navigate(`/workout/${newWorkout.id}`);
    } catch (err) { alert('Failed to duplicate: ' + err.message); }
    setDuplicating(null);
  };

  const getVolume = (w) =>
    (w.workout_exercises || []).reduce((sum, ex) => sum + (ex.sets * ex.reps * (ex.weight_kg || 0)), 0);

  const filtered = workouts.filter(w => {
    const q = search.toLowerCase();
    if (!q) return true;
    if (w.name.toLowerCase().includes(q)) return true;
    if ((w.workout_exercises || []).some(ex => ex.exercises?.name?.toLowerCase().includes(q))) return true;
    return false;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'date') return new Date(b.date) - new Date(a.date);
    if (sortBy === 'volume') return getVolume(b) - getVolume(a);
    if (sortBy === 'exercises') return (b.workout_exercises?.length || 0) - (a.workout_exercises?.length || 0);
    return 0;
  });

  const now = new Date();
  const last7 = Array.from({ length: 7 }, (_, i) =>
    new Date(now - (6 - i) * 86400000).toISOString().split('T')[0]
  );
  const prev7 = Array.from({ length: 7 }, (_, i) =>
    new Date(now - (13 - i) * 86400000).toISOString().split('T')[0]
  );

  const sessionsSparkData = last7.map(d => workouts.filter(w => w.date === d).length);
  const volumeSparkData = last7.map(d =>
    workouts.filter(w => w.date === d).reduce((s, w) => s + getVolume(w), 0)
  );
  const avgExSparkData = last7.map(d => {
    const ws = workouts.filter(w => w.date === d);
    return ws.length ? ws.reduce((s, w) => s + (w.workout_exercises?.length || 0), 0) / ws.length : 0;
  });

  const weekTrend = (thisData, prevData) => {
    const t = thisData.reduce((a, b) => a + b, 0);
    const p = prevData.reduce((a, b) => a + b, 0);
    if (!p) return null;
    return Math.round(((t - p) / p) * 100);
  };

  const sessionsTrend = weekTrend(sessionsSparkData, prev7.map(d => workouts.filter(w => w.date === d).length));
  const volumeTrend = weekTrend(volumeSparkData, prev7.map(d => workouts.filter(w => w.date === d).reduce((s, w) => s + getVolume(w), 0)));
  const avgExTrend = weekTrend(avgExSparkData, prev7.map(d => {
    const ws = workouts.filter(w => w.date === d);
    return ws.length ? ws.reduce((s, w) => s + (w.workout_exercises?.length || 0), 0) / ws.length : 0;
  }));

  const totalVolume = workouts.flatMap(w => w.workout_exercises || [])
    .reduce((sum, ex) => sum + (ex.sets * ex.reps * (ex.weight_kg || 0)), 0);
  const prCount = stats ? Object.keys(stats.personal_records).length : 0;
  const avgExercises = workouts.length > 0
    ? Math.round(workouts.flatMap(w => w.workout_exercises || []).length / workouts.length) : 0;
  const loggedToday = workouts.some(w => formatDate(w.date) === 'Today');
  const streak = calcStreak(workouts);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>

      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40 }} />
      )}

      {/* Sidebar */}
      <aside className="gymiq-sidebar" style={{
        width: '220px', flexShrink: 0, background: 'var(--surface)',
        borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column',
        position: 'fixed', top: 0, left: sidebarOpen ? 0 : '-220px', bottom: 0,
        zIndex: 50, transition: 'left 0.25s ease',
      }}>
        {/* Logo - yellow used intentionally here only */}
        <div style={{ padding: '1.5rem 1.25rem 1rem', borderBottom: '1px solid var(--border)' }}>
          <span style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: '1.3rem', color: 'var(--accent)', letterSpacing: '-0.02em' }}>
            GYMIQ
          </span>
        </div>

        <nav style={{ flex: 1, padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {NAV_ITEMS.map(({ to, label, icon }) => {
            const active = location.pathname === to;
            return (
              <Link key={to} to={to} onClick={() => setSidebarOpen(false)} style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.6rem 0.85rem', borderRadius: '8px', textDecoration: 'none',
                fontFamily: 'Syne', fontWeight: active ? 700 : 500, fontSize: '0.88rem',
                color: active ? '#000' : 'var(--text)',
                background: active ? 'var(--accent)' : 'transparent',
                transition: 'background 0.15s, color 0.15s',
              }}>
                <span style={{ fontSize: '0.9rem', opacity: active ? 1 : 0.5 }}>{icon}</span>
                {label}
              </Link>
            );
          })}
        </nav>

        <div style={{ padding: '1rem 0.75rem', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <Link to="/workout/new" className="btn btn-primary" style={{ width: '100%', textAlign: 'center', display: 'block' }}>
            + New Workout
          </Link>
          <button
            onClick={async () => { await signOut(); navigate('/login'); }}
            style={{
              width: '100%', padding: '0.55rem', borderRadius: '8px',
              border: '1px solid var(--border)', background: 'transparent',
              color: 'var(--muted)', fontFamily: 'Syne', fontWeight: 600,
              fontSize: '0.82rem', cursor: 'pointer', transition: 'color 0.15s, border-color 0.15s',
            }}
            onMouseEnter={e => { e.target.style.color = 'var(--danger)'; e.target.style.borderColor = 'var(--danger)'; }}
            onMouseLeave={e => { e.target.style.color = 'var(--muted)'; e.target.style.borderColor = 'var(--border)'; }}
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="gymiq-main" style={{ flex: 1, minWidth: 0, paddingBottom: '5rem' }}>

        {/* Sticky top bar */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 30, background: 'var(--bg)',
          borderBottom: '1px solid var(--border)', padding: '0.85rem 1.5rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button className="gymiq-hamburger" onClick={() => setSidebarOpen(o => !o)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--text)', padding: '0.25rem' }}>
              ☰
            </button>
            <div>
              {firstName && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {/* Greeting in muted, not yellow */}
                  <p style={{ color: 'var(--muted)', fontFamily: 'Syne', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
                    {isNewUser ? `Welcome, ${firstName}!` : `Hey, ${firstName}`}
                  </p>
                  {/* Streak indicator — yellow used intentionally as highlight */}
                  {streak > 0 && (
                    <span style={{
                      fontSize: '0.72rem', fontWeight: 700,
                      background: 'rgba(232,255,71,0.12)',
                      color: 'var(--accent)',
                      border: '1px solid rgba(232,255,71,0.25)',
                      padding: '0.1rem 0.5rem',
                      borderRadius: '20px',
                    }}>
                      🔥 {streak} day{streak > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              )}
              <h1 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: '1.1rem', margin: 0, color: 'var(--text)' }}>
                My Workouts
              </h1>
            </div>
          </div>
          <Link to="/workout/new" className="btn btn-primary btn-sm">+ New Workout</Link>
        </div>

        <div className="gymiq-main-inner">

          {!loading && !loggedToday && workouts.length > 0 && (
            <Link to="/workout/new" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'var(--surface)', color: 'var(--text)',
              border: '1px solid var(--border)',
              borderLeft: '3px solid var(--accent)',
              borderRadius: '10px', padding: '0.85rem 1.25rem',
              marginBottom: '1.5rem', textDecoration: 'none',
              fontFamily: 'Syne', fontWeight: 600, fontSize: '0.9rem',
              transition: 'border-color 0.15s',
            }}>
              <span>🏋️ Haven't logged today yet</span>
              {/* Yellow only on the CTA arrow */}
              <span style={{ fontSize: '0.85rem', color: 'var(--accent)', fontWeight: 700 }}>Log now →</span>
            </Link>
          )}

          {/* Stats grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <StatCard value={workouts.length} label="Sessions" trend={sessionsTrend} sparkData={sessionsSparkData} sparkColor="#888" />
            <StatCard value={`${Math.round(totalVolume).toLocaleString()} kg`} label="Total lifted" trend={volumeTrend} sparkData={volumeSparkData} sparkColor="#40b4ff" />
            <StatCard value={prCount} label="Exercises tracked" trend={null} sparkData={Array(7).fill(prCount)} sparkColor="#b08dff" />
            <StatCard value={avgExercises} label="Avg / session" trend={avgExTrend} sparkData={avgExSparkData} sparkColor="#40ff80" />
          </div>

          {/* Personal Records — yellow only on PR values */}
          {stats && prCount > 0 && (
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ fontFamily: 'Syne', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.85rem', color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                🏆 Personal Records
              </h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {Object.entries(stats.personal_records).map(([ex, kg]) => (
                  <div key={ex} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--muted)' }}>{ex}: </span>
                    {/* Yellow highlight only on the record value */}
                    <span style={{ fontWeight: 700, color: 'var(--accent)' }}>{kg} kg</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {workouts.length > 0 && (
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="🔍 Search workouts or exercises..." style={{ flex: 1, minWidth: '200px' }} />
              <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ width: 'auto' }}>
                <option value="date">Latest first</option>
                <option value="volume">Most volume</option>
                <option value="exercises">Most exercises</option>
              </select>
            </div>
          )}

          {loading ? (
            <p style={{ color: 'var(--muted)', textAlign: 'center', padding: '3rem 0' }}>Loading workouts…</p>
          ) : workouts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--muted)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏋️</div>
              <p style={{ marginBottom: '1rem' }}>No workouts yet. Log your first session!</p>
              <Link to="/workout/new" className="btn btn-primary">+ New Workout</Link>
            </div>
          ) : sorted.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--muted)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🔍</div>
              <p>No workouts match "<strong>{search}</strong>"</p>
              <button className="btn btn-ghost" onClick={() => setSearch('')} style={{ marginTop: '0.75rem' }}>Clear search</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', paddingBottom: '1rem' }}>
              {sorted.map(w => (
                <Link to={`/workout/${w.id}`} key={w.id} className="workout-card gymiq-workout-card" style={{ display: 'block', textDecoration: 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                        <h3 style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '1rem', margin: 0, color: 'var(--text)' }}>{w.name}</h3>
                        <span style={{ fontSize: '0.75rem', color: 'var(--muted)', background: 'var(--surface2)', padding: '0.2rem 0.6rem', borderRadius: '20px' }}>
                          {formatDate(w.date)}
                        </span>
                        {sortBy === 'volume' && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 600 }}>
                            {Math.round(getVolume(w)).toLocaleString()} kg
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.5rem' }}>
                        {(w.workout_exercises || []).map(ex => (
                          <span key={ex.id} className={muscleGroupClass(ex.exercises?.muscle_group)}>
                            {ex.exercises?.name}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
                      <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>{(w.workout_exercises || []).length} ex</span>
                      <button className="btn btn-secondary btn-sm" title="Duplicate"
                        onClick={e => handleDuplicate(e, w.id)} disabled={duplicating === w.id}>
                        {duplicating === w.id ? '…' : '⧉'}
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={e => handleDelete(e, w.id)}>✕</button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Rest Timer panel */}
      {timerOpen && <RestTimer onClose={() => setTimerOpen(false)} />}

      {/* Bottom nav bar — mobile + desktop */}
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'var(--surface)', borderTop: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-around',
        padding: '0.5rem 0', zIndex: 60, height: '56px',
      }}>
        {NAV_ITEMS.slice(0, 4).map(({ to, label, icon }) => {
          const active = location.pathname === to;
          return (
            <Link key={to} to={to} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
              textDecoration: 'none', padding: '0.25rem 0.75rem',
              color: active ? 'var(--accent)' : 'var(--muted)',
              fontFamily: 'Syne', fontSize: '0.6rem', fontWeight: active ? 700 : 500,
              transition: 'color 0.15s',
            }}>
              <span style={{ fontSize: '1rem' }}>{icon}</span>
              {label}
            </Link>
          );
        })}
        {/* Rest Timer button in bottom nav */}
        <button
          onClick={() => setTimerOpen(o => !o)}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
            background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem 0.75rem',
            color: timerOpen ? 'var(--accent)' : 'var(--muted)',
            fontFamily: 'Syne', fontSize: '0.6rem', fontWeight: timerOpen ? 700 : 500,
            transition: 'color 0.15s',
          }}
        >
          <span style={{ fontSize: '1rem' }}>⏱</span>
          Timer
        </button>
      </nav>

      <style>{`
        @media (min-width: 768px) {
          .gymiq-sidebar { left: 0 !important; }
          .gymiq-main { margin-left: 220px !important; }
          .gymiq-hamburger { display: none !important; }
        }
        @media (max-width: 767px) {
          .gymiq-sidebar { left: -220px; }
          .gymiq-main { margin-left: 0 !important; }
        }
        .gymiq-main-inner {
          max-width: 780px;
          margin: 0 auto;
          padding: 1.5rem;
        }
        .gymiq-stat-card {
          transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;
          cursor: default;
        }
        .gymiq-stat-card:hover {
          border-color: var(--accent) !important;
          transform: translateY(-2px);
          box-shadow: 0 4px 20px rgba(232,255,71,0.08);
        }
        .gymiq-workout-card {
          transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s !important;
        }
        .gymiq-workout-card:hover {
          border-color: #444 !important;
          transform: translateY(-2px) !important;
          box-shadow: 0 4px 24px rgba(232,255,71,0.06) !important;
        }
      `}</style>
    </div>
  );
}