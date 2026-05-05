import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { getBodyWeight, logBodyWeight, deleteBodyWeight } from '../lib/api';

// Helper: parse date string as local time (avoids UTC shift black-screen crash)
const parseLocalDate = (dateStr) => {
  if (!dateStr) return new Date();
  return new Date(dateStr + 'T00:00:00');
};

// Helper: get today's date as YYYY-MM-DD in local time
const getTodayLocal = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export default function BodyWeightTracker() {
  const [entries, setEntries] = useState([]);
  const [weight, setWeight] = useState('');
  const [date, setDate] = useState(getTodayLocal); // FIX: use local date, not UTC
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getBodyWeight()
      .then(data => setEntries(Array.isArray(data) ? data : [])) // FIX: guard against non-array
      .catch(console.error);
  }, []);

  const handleLog = async (e) => {
    e.preventDefault();
    if (!weight) return;
    setSaving(true);
    try {
      const entry = await logBodyWeight({ weight_kg: parseFloat(weight), date });
      setEntries(prev =>
        [...prev.filter(e => e.date !== date), entry]
          .sort((a, b) => new Date(a.date) - new Date(b.date))
      );
      setWeight('');
    } catch (err) {
      alert(err.message);
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    await deleteBodyWeight(id);
    setEntries(prev => prev.filter(e => e.id !== id));
  };

  // FIX: filter out any entries missing weight_kg or date before calculations
  const validEntries = entries.filter(
    e => e != null && e.weight_kg != null && !isNaN(e.weight_kg) && e.date
  );

  const maxWeight = validEntries.length > 0 ? Math.max(...validEntries.map(e => e.weight_kg)) : 0;
  const minWeight = validEntries.length > 0 ? Math.min(...validEntries.map(e => e.weight_kg)) : 0;
  const range = maxWeight - minWeight || 1;

  const W = 600, H = 200, PAD = 40;
  const getX = (i) => PAD + (i / Math.max(validEntries.length - 1, 1)) * (W - PAD * 2);
  const getY = (w) => H - PAD - ((w - minWeight) / range) * (H - PAD * 2);
  const polyline = validEntries.map((e, i) => `${getX(i)},${getY(e.weight_kg)}`).join(' ');

  const latest = validEntries[validEntries.length - 1];
  const first = validEntries[0];
  // FIX: parse diff as float before comparing
  const diff = latest && first ? (latest.weight_kg - first.weight_kg).toFixed(1) : null;
  const diffNum = diff !== null ? parseFloat(diff) : null;

  return (
    <>
      <Navbar />
      <div className="container" style={{ paddingBottom: '3rem' }}>
        <div className="page-header">
          <h1 className="page-title">Body Weight</h1>
          <Link to="/" className="btn btn-secondary">← Back</Link>
        </div>

        {/* Log form */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: '1rem' }}>
            Log Today's Weight
          </h2>
          {/* FIX: use div + onClick instead of form onSubmit to avoid any form crash edge cases */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ flex: 1, minWidth: '120px' }}>
              <label>Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                min="20"
                max="300"
                value={weight}
                onChange={e => setWeight(e.target.value)}
                placeholder="e.g. 72.5"
              />
            </div>
            <div className="form-group" style={{ flex: 1, minWidth: '140px' }}>
              <label>Date</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>
            <button
              className="btn btn-primary"
              onClick={handleLog}
              disabled={saving || !weight}
              style={{ alignSelf: 'flex-end' }}
            >
              {saving ? 'Saving…' : 'Log Weight'}
            </button>
          </div>
        </div>

        {validEntries.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚖️</div>
            <p>Start logging your weight to see your progress chart!</p>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="stat-grid" style={{ marginBottom: '1.5rem' }}>
              <div className="stat-card">
                <div className="stat-value">{latest?.weight_kg}kg</div>
                <div className="stat-label">Current</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{minWeight}kg</div>
                <div className="stat-label">Lowest</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{maxWeight}kg</div>
                <div className="stat-label">Highest</div>
              </div>
              {/* FIX: use diffNum (float) for comparison, guard null */}
              {diffNum !== null && (
                <div className="stat-card">
                  <div
                    className="stat-value"
                    style={{ color: diffNum > 0 ? 'var(--danger)' : '#40ff80' }}
                  >
                    {diffNum > 0 ? `+${diff}` : diff}kg
                  </div>
                  <div className="stat-label">Total change</div>
                </div>
              )}
            </div>

            {/* Chart */}
            {validEntries.length > 1 && (
              <div className="card" style={{ marginBottom: '1.5rem', overflowX: 'auto' }}>
                <h2 style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '1rem', marginBottom: '1rem', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Weight Over Time
                </h2>
                <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', minWidth: '300px' }}>
                  {[0, 0.5, 1].map((t, i) => {
                    const y = PAD + t * (H - PAD * 2);
                    const val = (maxWeight - t * range).toFixed(1);
                    return (
                      <g key={i}>
                        <line x1={PAD} y1={y} x2={W - PAD} y2={y} stroke="#2a2a2a" strokeWidth="1" />
                        <text x={PAD - 5} y={y + 4} fill="#666" fontSize="10" textAnchor="end">{val}kg</text>
                      </g>
                    );
                  })}
                  <polyline
                    points={polyline}
                    fill="none"
                    stroke="#40b4ff"
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                  />
                  {validEntries.map((e, i) => (
                    <circle key={i} cx={getX(i)} cy={getY(e.weight_kg)} r="4" fill="#40b4ff" />
                  ))}
                </svg>
              </div>
            )}

            {/* History */}
            <div className="card">
              <h2 style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: '1rem' }}>
                History
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {[...validEntries].reverse().map(e => (
                  <div
                    key={e.id}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0', borderBottom: '1px solid var(--border)' }}
                  >
                    <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
                      {/* FIX: parseLocalDate prevents UTC timezone shift causing wrong day display */}
                      {parseLocalDate(e.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '1.1rem' }}>
                        {e.weight_kg} kg
                      </span>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(e.id)}>✕</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
