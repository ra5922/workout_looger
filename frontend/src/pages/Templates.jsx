import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { getTemplates, createTemplate, deleteTemplate, useTemplate, getExercises } from '../lib/api';

export default function Templates() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [rows, setRows] = useState([{ exercise_id: '', sets: 3, reps: 10, weight_kg: 0, notes: '' }]);
  const [saving, setSaving] = useState(false);
  const [using, setUsing] = useState(null);

  useEffect(() => {
    getTemplates().then(setTemplates).catch(console.error);
    getExercises().then(setExercises).catch(console.error);
  }, []);

  const addRow = () => setRows(r => [...r, { exercise_id: '', sets: 3, reps: 10, weight_kg: 0, notes: '' }]);
  const removeRow = (i) => setRows(r => r.filter((_, idx) => idx !== i));
  const updateRow = (i, field, value) => setRows(r => r.map((row, idx) => idx === i ? { ...row, [field]: value } : row));

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const t = await createTemplate({ name, notes, exercises: rows.filter(r => r.exercise_id) });
      const refreshed = await getTemplates();
      setTemplates(refreshed);
      setShowForm(false);
      setName(''); setNotes(''); setRows([{ exercise_id: '', sets: 3, reps: 10, weight_kg: 0, notes: '' }]);
    } catch (err) { alert(err.message); }
    setSaving(false);
  };

  const handleUse = async (id) => {
    setUsing(id);
    try {
      const workout = await useTemplate(id);
      navigate(`/workout/${workout.id}`);
    } catch (err) { alert(err.message); }
    setUsing(null);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this template?')) return;
    await deleteTemplate(id);
    setTemplates(t => t.filter(x => x.id !== id));
  };

  return (
    <>
      <Navbar />
      <div className="container" style={{ paddingBottom: '3rem' }}>
        <div className="page-header">
          <h1 className="page-title">Templates</h1>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Link to="/" className="btn btn-secondary">← Back</Link>
            <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
              {showForm ? 'Cancel' : '+ New Template'}
            </button>
          </div>
        </div>

        {/* Create form */}
        {showForm && (
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h2 style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)' }}>New Template</h2>
              <div className="form-group">
                <label>Template Name</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Push Day A" required />
              </div>
              <div className="form-group">
                <label>Notes (optional)</label>
                <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any notes..." />
              </div>

              {rows.map((row, i) => (
                <div key={i} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '10px', padding: '1rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(60px, 1fr))', gap: '0.75rem', alignItems: 'end' }}>
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label>Exercise</label>
                      <select value={row.exercise_id} onChange={e => updateRow(i, 'exercise_id', e.target.value)}>
                        <option value="">Select…</option>
                        {exercises.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Sets</label>
                      <input type="number" min="1" value={row.sets} onChange={e => updateRow(i, 'sets', +e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>Reps</label>
                      <input type="number" min="1" value={row.reps} onChange={e => updateRow(i, 'reps', +e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>kg</label>
                      <input type="number" min="0" step="0.5" value={row.weight_kg} onChange={e => updateRow(i, 'weight_kg', +e.target.value)} />
                    </div>
                    <button type="button" className="btn btn-danger btn-sm" onClick={() => removeRow(i)}>✕</button>
                  </div>
                </div>
              ))}
              <button type="button" className="btn btn-secondary" onClick={addRow} style={{ alignSelf: 'flex-start' }}>+ Add Exercise</button>
              <button type="submit" className="btn btn-primary" disabled={saving} style={{ alignSelf: 'flex-end' }}>
                {saving ? 'Saving…' : 'Save Template'}
              </button>
            </div>
          </form>
        )}

        {/* Template list */}
        {templates.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--muted)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
            <p>No templates yet. Create one to quickly start a workout!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {templates.map(t => (
              <div key={t.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                  <div>
                    <h3 style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '1.05rem', marginBottom: '0.4rem' }}>{t.name}</h3>
                    <p style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>{(t.template_exercises || []).length} exercises</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.5rem' }}>
                      {(t.template_exercises || []).map(ex => (
                        <span key={ex.id} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '6px', padding: '2px 8px', fontSize: '0.78rem', color: 'var(--muted)' }}>
                          {ex.exercises?.name}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleUse(t.id)}
                      disabled={using === t.id}
                    >
                      {using === t.id ? '…' : '▶ Start Workout'}
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(t.id)}>✕</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
