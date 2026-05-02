import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { getWorkout, deleteWorkout } from '../lib/api';

function muscleGroupClass(group) {
  const map = { Chest: 'chest', Back: 'back', Legs: 'legs', Shoulders: 'shoulders', Arms: 'arms', Core: 'core', Cardio: 'cardio', 'Full Body': 'full-body' };
  return `badge badge-${map[group] || 'default'}`;
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

export default function WorkoutDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [workout, setWorkout] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getWorkout(id).then(setWorkout).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!confirm('Delete this workout permanently?')) return;
    await deleteWorkout(id);
    navigate('/');
  };

  if (loading) return <><Navbar /><div className="loading">Loading…</div></>;
  if (!workout) return <><Navbar /><div className="container"><p style={{ marginTop: '2rem', color: 'var(--muted)' }}>Workout not found.</p></div></>;

  const exercises = workout.workout_exercises || [];
  const totalVolume = exercises.reduce((sum, ex) => sum + (ex.sets * ex.reps * (ex.weight_kg || 0)), 0);
  const totalSets = exercises.reduce((sum, ex) => sum + ex.sets, 0);

  return (
    <>
      <Navbar />
      <div className="container" style={{ paddingBottom: '3rem' }}>
        <div className="page-header">
          <div>
            <p style={{ fontSize: '0.8rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.3rem' }}>
              {formatDate(workout.date)}
            </p>
            <h1 className="page-title">{workout.name}</h1>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Link to="/" className="btn btn-secondary">← Back</Link>
            <Link to={`/workout/${id}/edit`} className="btn btn-secondary">✏️ Edit</Link>
            <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
          </div>
        </div>

        {/* Summary stats */}
        <div className="stat-grid" style={{ marginBottom: '1.5rem' }}>
          <div className="stat-card">
            <div className="stat-value">{exercises.length}</div>
            <div className="stat-label">Exercises</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{totalSets}</div>
            <div className="stat-label">Total sets</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{Math.round(totalVolume).toLocaleString()}</div>
            <div className="stat-label">Volume (kg)</div>
          </div>
        </div>

        {workout.notes && (
          <div className="card" style={{ marginBottom: '1.5rem', borderLeft: '3px solid var(--accent)' }}>
            <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Session Notes</p>
            <p>{workout.notes}</p>
          </div>
        )}

        {/* Exercise list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {exercises.length === 0 ? (
            <p style={{ color: 'var(--muted)', textAlign: 'center', padding: '2rem' }}>No exercises logged.</p>
          ) : exercises.map((ex, i) => (
            <div key={ex.id} className="card">
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
                    <span style={{ fontFamily: 'Syne', fontWeight: 700, color: 'var(--muted)', fontSize: '0.75rem' }}>#{i + 1}</span>
                    <h3 style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '1.05rem' }}>{ex.exercises?.name}</h3>
                    <span className={muscleGroupClass(ex.exercises?.muscle_group)}>{ex.exercises?.muscle_group}</span>
                  </div>
                  {ex.notes && <p style={{ fontSize: '0.82rem', color: 'var(--muted)', marginTop: '0.4rem' }}>{ex.notes}</p>}
                </div>
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                  {[
                    { label: 'Sets', value: ex.sets },
                    { label: 'Reps', value: ex.reps },
                    { label: 'Weight', value: ex.weight_kg > 0 ? `${ex.weight_kg} kg` : 'BW' },
                    { label: 'Volume', value: `${Math.round(ex.sets * ex.reps * (ex.weight_kg || 0))} kg` },
                  ].map(stat => (
                    <div key={stat.label} style={{ textAlign: 'center' }}>
                      <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: '1.25rem', color: ex.weight_kg > 0 ? 'var(--accent)' : 'var(--text)' }}>
                        {stat.value}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
