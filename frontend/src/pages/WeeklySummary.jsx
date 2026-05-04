import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { getWorkouts } from '../lib/api';

function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDate(d) {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function WeeklySummary() {
  const [workouts, setWorkouts] = useState([]);
  const [weeks, setWeeks] = useState([]);

  useEffect(() => {
    getWorkouts().then(data => {
      setWorkouts(data);

      // Group workouts by week
      const weekMap = {};
      data.forEach(w => {
        const weekStart = getWeekStart(new Date(w.date));
        const key = weekStart.toISOString();
        if (!weekMap[key]) weekMap[key] = { weekStart, workouts: [] };
        weekMap[key].workouts.push(w);
      });

      const sorted = Object.values(weekMap).sort((a, b) => b.weekStart - a.weekStart);
      setWeeks(sorted);
    });
  }, []);

  const getVolume = (w) =>
    (w.workout_exercises || []).reduce((sum, ex) => sum + (ex.sets * ex.reps * (ex.weight_kg || 0)), 0);

  const getTotalVolume = (workouts) =>
    workouts.reduce((sum, w) => sum + getVolume(w), 0);

  const getMuscleGroups = (workouts) => {
    const groups = {};
    workouts.forEach(w => {
      (w.workout_exercises || []).forEach(ex => {
        const g = ex.exercises?.muscle_group;
        if (g) groups[g] = (groups[g] || 0) + 1;
      });
    });
    return Object.entries(groups).sort((a, b) => b[1] - a[1]);
  };

  // Current week stats
  const thisWeekStart = getWeekStart(new Date());
  const thisWeek = weeks.find(w => w.weekStart.toISOString() === thisWeekStart.toISOString());
  const lastWeek = weeks[thisWeek ? 1 : 0];

  return (
    <>
      <Navbar />
      <div className="container" style={{ paddingBottom: '3rem' }}>
        <div className="page-header">
          <h1 className="page-title">Weekly Summary</h1>
          <Link to="/" className="btn btn-secondary">← Back</Link>
        </div>

        {/* This week highlight */}
        <div className="card" style={{ marginBottom: '1.5rem', borderLeft: '3px solid var(--accent)' }}>
          <p style={{ color: 'var(--accent)', fontFamily: 'Syne', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>
            This Week — {formatDate(thisWeekStart)} to {formatDate(new Date(thisWeekStart.getTime() + 6 * 86400000))}
          </p>
          {!thisWeek ? (
            <p style={{ color: 'var(--muted)' }}>No workouts logged this week yet. Get moving! 💪</p>
          ) : (
            <div className="stat-grid">
              <div className="stat-card">
                <div className="stat-value">{thisWeek.workouts.length}</div>
                <div className="stat-label">Sessions</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{Math.round(getTotalVolume(thisWeek.workouts)).toLocaleString()}</div>
                <div className="stat-label">Volume (kg)</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{thisWeek.workouts.flatMap(w => w.workout_exercises || []).length}</div>
                <div className="stat-label">Total sets logged</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{getMuscleGroups(thisWeek.workouts)[0]?.[0] || '—'}</div>
                <div className="stat-label">Most trained</div>
              </div>
            </div>
          )}
        </div>

        {/* Week by week history */}
        {weeks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📅</div>
            <p>No workout history yet. Log your first session!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {weeks.map((week, i) => {
              const weekEnd = new Date(week.weekStart.getTime() + 6 * 86400000);
              const volume = getTotalVolume(week.workouts);
              const muscleGroups = getMuscleGroups(week.workouts);
              const isThisWeek = i === 0 && week.weekStart.toISOString() === thisWeekStart.toISOString();

              return (
                <div key={week.weekStart.toISOString()} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <h3 style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '0.95rem' }}>
                          {formatDate(week.weekStart)} — {formatDate(weekEnd)}
                        </h3>
                        {isThisWeek && (
                          <span style={{ background: 'var(--accent)', color: '#000', fontSize: '0.7rem', fontWeight: 700, fontFamily: 'Syne', padding: '2px 8px', borderRadius: '20px' }}>
                            THIS WEEK
                          </span>
                        )}
                      </div>
                      <p style={{ color: 'var(--muted)', fontSize: '0.8rem', marginTop: '0.2rem' }}>
                        {week.workouts.length} session{week.workouts.length !== 1 ? 's' : ''} · {Math.round(volume).toLocaleString()} kg volume
                      </p>
                    </div>
                  </div>

                  {/* Muscle group breakdown */}
                  {muscleGroups.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.75rem' }}>
                      {muscleGroups.map(([group, count]) => (
                        <span key={group} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '6px', padding: '2px 10px', fontSize: '0.78rem', color: 'var(--muted)' }}>
                          {group} ×{count}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Workout list */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {week.workouts.map(w => (
                      <Link key={w.id} to={`/workout/${w.id}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', background: 'var(--surface2)', borderRadius: '8px', textDecoration: 'none', color: 'inherit' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{w.name}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                          {new Date(w.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
