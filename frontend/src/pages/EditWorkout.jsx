import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { getWorkout, updateWorkout, getExercises } from '../lib/api';


const MUSCLE_GROUPS = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Cardio', 'Full Body'];

export default function EditWorkout() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exercises, setExercises] = useState([]);
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  const [rows, setRows] = useState([]);
  const [filterGroup, setFilterGroup] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([getWorkout(id), getExercises()]).then(([workout, exList]) => {
      setName(workout.name);
      setDate(workout.date);
      setNotes(workout.notes || '');
      setRows((workout.workout_exercises || []).map(ex => ({
        exercise_id: ex.exercise_id || ex.exercises?.id,
        sets: ex.sets,
        reps: ex.reps,
        weight_kg: ex.weight_kg,
        notes: ex.notes || '',
      })));
      setExercises(exList);
      setLoading(false);
    }).catch(console.error);
  }, [id]);

  const filteredExercises = filterGroup ? exercises.filter(e => e.muscle_group === filterGroup) : exercises;
  const addRow = () => setRows(r => [...r, { exercise_id: '', sets: 3, reps: 10, weight_kg: 0, notes: '' }]);
  const removeRow = (i) => setRows(r => r.filter((_, idx) => idx !== i));
  const updateRow = (i, field, value) => setRows(r => r.map((row, idx) => idx === i ? { ...row, [field]: value } : row));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return setError('Workout name is required.');
    setSaving(true);
    setError('');
    try {
      const validRows = rows.filter(r => r.exercise_id);
      await updateWorkout(id, { name, date, notes, exercises: validRows });
      navigate(`/workout/${id}`);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };
  if (loading) return <><Navbar /><div className="loading">Loading…</div></>;

  return (
    <>
      <Navbar />
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">Edit Workout</h1>
          <Link to={`/workout/${id}`} className="btn btn-secondary">← Cancel</Link>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingBottom: '3rem' }}>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h2 style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)' }}>Session Info</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem' }}>
              <div className="form-group">
                <label>Workout Name</label>
                <input value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Date</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label>Notes (optional)</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
            </div>
          </div>

          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
              <h2 style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)' }}>Exercises</h2>
              <select value={filterGroup} onChange={e => setFilterGroup(e.target.value)} style={{ width: 'auto', fontSize: '0.8rem' }}>
                <option value="">All muscle groups</option>
                {MUSCLE_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>

            {rows.map((row, i) => (
              <div key={i} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '10px', padding: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto auto', gap: '0.75rem', alignItems: 'end' }}>
                  <div className="form-group">
                    <label>Exercise</label>
                    <select value={row.exercise_id} onChange={e => updateRow(i, 'exercise_id', e.target.value)}>
                      <option value="">Select exercise…</option>
                      {filteredExercises.map(ex => (
                        <option key={ex.id} value={ex.id}>{ex.name} ({ex.muscle_group})</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Sets</label>
                    <input type="number" min="1" max="20" value={row.sets} onChange={e => updateRow(i, 'sets', +e.target.value)} style={{ width: '70px' }} />
                  </div>
                  <div className="form-group">
                    <label>Reps</label>
                    <input type="number" min="1" max="100" value={row.reps} onChange={e => updateRow(i, 'reps', +e.target.value)} style={{ width: '70px' }} />
                  </div>
                  <div className="form-group">
                    <label>kg</label>
                    <input type="number" min="0" step="0.5" value={row.weight_kg} onChange={e => updateRow(i, 'weight_kg', +e.target.value)} style={{ width: '80px' }} />
                  </div>
                  <button type="button" className="btn btn-danger btn-sm" onClick={() => removeRow(i)} style={{ alignSelf: 'flex-end' }}>✕</button>
                </div>
                <div className="form-group" style={{ marginTop: '0.6rem' }}>
                  <label>Notes</label>
                  <input value={row.notes} onChange={e => updateRow(i, 'notes', e.target.value)} placeholder="e.g. paused reps, drop set…" />
                </div>
              </div>
            ))}
            <button type="button" className="btn btn-secondary" onClick={addRow} style={{ alignSelf: 'flex-start' }}>+ Add Exercise</button>
          </div>

          {error && <p style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>{error}</p>}
          <button type="submit" className="btn btn-primary" disabled={saving} style={{ alignSelf: 'flex-end', padding: '0.75rem 2rem' }}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </form>
      </div>
    </>
  );
}
