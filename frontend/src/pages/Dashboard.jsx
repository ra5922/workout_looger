import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { getWorkouts, deleteWorkout, getStats, duplicateWorkout } from '../lib/api';
import { useAuth } from '../hooks/useAuth';

function muscleGroupClass(group) {
  const map = { Chest: 'chest', Back: 'back', Legs: 'legs', Shoulders: 'shoulders', Arms: 'arms', Core: 'core', Cardio: 'cardio', 'Full Body': 'full-body' };
  return `badge badge-${map[group] || 'default'}`;
}

function relativeDate(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  const today = new Date(); today.setHours(0,0,0,0);
  const diff = Math.round((today - date) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return `${diff} days ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { firstName, isNewUser } = useAuth();
  const [workouts, setWorkouts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [duplicating, setDuplicating] = useState(null);

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
    } catch (err) {
      alert('Failed to duplicate: ' + err.message);
    }
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

  const totalVolume = workouts
    .flatMap(w => w.workout_exercises || [])
    .reduce((sum, ex) => sum + (ex.sets * ex.reps * (ex.weight_kg || 0)), 0);

  const prCount = stats ? Object.keys(stats.personal_records || {}).length : 0;
  const avgExercises = workouts.length > 0
    ? Math.round(workouts.flatMap(w => w.workout_exercises || []).length / workouts.length)
    : 0;

  // Check if user has logged today
  const today = new Date().toISOString().split('T')[0];
  const loggedToday = workouts.some(w => w.date === today);

  return (
    <Layout>
      {/* Page heading */}
      <div style={{ marginBottom: '2rem' }}>
        {firstName && (
          <p style={{
            color: 'var(--accent)', fontFamily: 'Syne', fontWeight: 700,
            fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em',
            marginBottom: '0.3rem',
          }}>
            {isNewUser ? `Welcome, ${firstName}! 💪` : `Welcome back, ${firstName}! 💪`}
          </p>
        )}
        <h1 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: '2rem', letterSpacing: '-0.02em' }}>
          My Workouts
        </h1>
      </div>

      {/* Log today banner — show if not logged today */}
      {!loggedToday && !loading && workouts.length > 0 && (
        <Link
          to="/workout/new"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'var(--accent)', color: '#000', borderRadius: '10px',
            padding: '0.85rem 1.25rem', marginBottom: '1.75rem',
            textDecoration: 'none', fontFamily: 'Syne', fontWeight: 700, fontSize: '0.9rem',
          }}
        >
          <span>💪 You haven't logged a workout today yet</span>
          <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>Log now →</span>
        </Link>
      )}

      {/* ── Two-column grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.5rem', alignItems: 'start' }}
        className="dashboard-grid"
      >

        {/* LEFT: Workout list */}
        <div>
          {/* Search & Sort */}
          {workouts.length > 0 && (
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="🔍 Search workouts or exercises..."
                style={{ flex: 1, minWidth: '200px' }}
              />
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {sorted.map(w => (
                <Link to={`/workout/${w.id}`} key={w.id} className="workout-card" style={{ display: 'block' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                        <h3 style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '1rem' }}>{w.name}</h3>
                        <span style={{
                          fontSize: '0.72rem', color: 'var(--muted)',
                          background: 'var(--surface2)', padding: '2px 8px', borderRadius: '20px',
                          border: '1px solid var(--border)',
                        }}>
                          {relativeDate(w.date)}
                        </span>
                        {sortBy === 'volume' && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 700 }}>
                            {Math.round(getVolume(w)).toLocaleString()} kg
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                        {(w.workout_exercises || []).map(ex => (
                          <span key={ex.id} className={muscleGroupClass(ex.exercises?.muscle_group)}>
                            {ex.exercises?.name}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
                      <span style={{ fontSize: '0.78rem', color: 'var(--muted)', marginRight: '0.25rem' }}>
                        {(w.workout_exercises || []).length} ex
                      </span>
                      <button
                        className="btn btn-secondary btn-sm"
                        title="Duplicate"
                        onClick={e => handleDuplicate(e, w.id)}
                        disabled={duplicating === w.id}
                      >
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

        {/* RIGHT: Stats sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Stats grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            {[
              { value: workouts.length, label: 'Sessions' },
              { value: Math.round(totalVolume).toLocaleString(), label: 'Total kg' },
              { value: prCount, label: 'Exercises' },
              { value: avgExercises, label: 'Avg / session' },
            ].map((s, i) => (
              <div key={i} className="stat-card" style={{ padding: '1rem', borderRadius: '10px' }}>
                <div className="stat-value" style={{ fontSize: '1.5rem' }}>{s.value}</div>
                <div className="stat-label" style={{ fontSize: '0.7rem' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Personal Records */}
          {stats && prCount > 0 && (
            <div className="card" style={{ padding: '1.1rem' }}>
              <h2 style={{
                fontFamily: 'Syne', fontSize: '0.8rem', fontWeight: 700,
                color: 'var(--accent)', textTransform: 'uppercase',
                letterSpacing: '0.08em', marginBottom: '0.85rem',
              }}>
                🏆 Personal Records
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                {Object.entries(stats.personal_records).map(([ex, kg]) => (
                  <div key={ex} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '0.4rem 0', borderBottom: '1px solid var(--border)',
                  }}>
                    <span style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>{ex}</span>
                    <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '0.9rem', color: 'var(--accent)' }}>
                      {kg} kg
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick links */}
          <div className="card" style={{ padding: '1.1rem' }}>
            <h2 style={{
              fontFamily: 'Syne', fontSize: '0.8rem', fontWeight: 700,
              color: 'var(--muted)', textTransform: 'uppercase',
              letterSpacing: '0.08em', marginBottom: '0.85rem',
            }}>
              Quick Access
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {[
                { to: '/progress',   icon: '📈', label: 'Progress Charts' },
                { to: '/weekly',     icon: '📅', label: 'Weekly Summary'  },
                { to: '/templates',  icon: '📋', label: 'Templates'       },
                { to: '/bodyweight', icon: '⚖️', label: 'Body Weight'     },
              ].map(({ to, icon, label }) => (
                <Link
                  key={to}
                  to={to}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.6rem',
                    padding: '0.5rem 0.6rem', borderRadius: '7px',
                    textDecoration: 'none', color: 'var(--text)',
                    fontSize: '0.85rem', fontFamily: 'Syne', fontWeight: 500,
                    transition: 'background 0.12s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <span>{icon}</span>{label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .dashboard-grid {
            grid-template-columns: 1fr !important;
          }
          .dashboard-grid > div:last-child {
            order: -1;
          }
        }
      `}</style>
    </Layout>
  );
}