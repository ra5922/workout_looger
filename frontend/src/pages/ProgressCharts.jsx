import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { getWorkouts } from '../lib/api';

const COLORS = ['#e8ff47', '#40b4ff', '#ff9f40', '#ff40ff', '#40ffff', '#ff4747'];

export default function ProgressCharts() {
  const [workouts, setWorkouts] = useState([]);
  const [selectedExercise, setSelectedExercise] = useState('');
  const [exerciseList, setExerciseList] = useState([]);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    getWorkouts().then(data => {
      setWorkouts(data);
      // Build unique exercise list from workout history
      const exMap = {};
      data.forEach(w => {
        (w.workout_exercises || []).forEach(ex => {
          if (ex.exercises?.name && !exMap[ex.exercises.name]) {
            exMap[ex.exercises.name] = ex.exercises.name;
          }
        });
      });
      const list = Object.keys(exMap).sort();
      setExerciseList(list);
      if (list.length > 0) setSelectedExercise(list[0]);
    });
  }, []);

  useEffect(() => {
    if (!selectedExercise) return;
    const points = [];
    workouts.forEach(w => {
      (w.workout_exercises || []).forEach(ex => {
        if (ex.exercises?.name === selectedExercise && ex.weight_kg > 0) {
          points.push({ date: w.date, weight: ex.weight_kg, sets: ex.sets, reps: ex.reps });
        }
      });
    });
    points.sort((a, b) => new Date(a.date) - new Date(b.date));
    setChartData(points);
  }, [selectedExercise, workouts]);

  const maxWeight = Math.max(...chartData.map(p => p.weight), 0);
  const minWeight = Math.min(...chartData.map(p => p.weight), 0);
  const range = maxWeight - minWeight || 1;

  const W = 600, H = 220, PAD = 40;

  const getX = (i) => PAD + (i / Math.max(chartData.length - 1, 1)) * (W - PAD * 2);
  const getY = (w) => H - PAD - ((w - minWeight) / range) * (H - PAD * 2);

  const polyline = chartData.map((p, i) => `${getX(i)},${getY(p.weight)}`).join(' ');

  return (
    <>
      <Navbar />
      <div className="container" style={{ paddingBottom: '3rem' }}>
        <div className="page-header">
          <h1 className="page-title">Progress Charts</h1>
          <Link to="/" className="btn btn-secondary">← Back</Link>
        </div>

        {exerciseList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--muted)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
            <p>Log some workouts first to see your progress!</p>
          </div>
        ) : (
          <>
            <div className="form-group" style={{ marginBottom: '1.5rem', maxWidth: '300px' }}>
              <label>Select Exercise</label>
              <select value={selectedExercise} onChange={e => setSelectedExercise(e.target.value)}>
                {exerciseList.map(ex => <option key={ex} value={ex}>{ex}</option>)}
              </select>
            </div>

            {chartData.length < 2 ? (
              <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>
                <p>Need at least 2 sessions with <strong>{selectedExercise}</strong> to show a chart.</p>
              </div>
            ) : (
              <div className="card" style={{ marginBottom: '1.5rem', overflowX: 'auto' }}>
                <h2 style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '1rem', marginBottom: '1rem', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {selectedExercise} — Weight over time
                </h2>
                <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', minWidth: '300px' }}>
                  {/* Grid lines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
                    const y = PAD + t * (H - PAD * 2);
                    const val = Math.round(maxWeight - t * range);
                    return (
                      <g key={i}>
                        <line x1={PAD} y1={y} x2={W - PAD} y2={y} stroke="#2a2a2a" strokeWidth="1" />
                        <text x={PAD - 5} y={y + 4} fill="#666" fontSize="10" textAnchor="end">{val}kg</text>
                      </g>
                    );
                  })}

                  {/* Line */}
                  <polyline points={polyline} fill="none" stroke="#e8ff47" strokeWidth="2.5" strokeLinejoin="round" />

                  {/* Dots */}
                  {chartData.map((p, i) => (
                    <g key={i}>
                      <circle cx={getX(i)} cy={getY(p.weight)} r="5" fill="#e8ff47" />
                      <text x={getX(i)} y={H - 5} fill="#666" fontSize="9" textAnchor="middle">
                        {new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </text>
                      <text x={getX(i)} y={getY(p.weight) - 10} fill="#e8ff47" fontSize="10" textAnchor="middle" fontWeight="bold">
                        {p.weight}kg
                      </text>
                    </g>
                  ))}
                </svg>
              </div>
            )}

            {/* Stats for selected exercise */}
            {chartData.length > 0 && (
              <div className="stat-grid">
                <div className="stat-card">
                  <div className="stat-value">{Math.max(...chartData.map(p => p.weight))}kg</div>
                  <div className="stat-label">Personal Record</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{chartData.length}</div>
                  <div className="stat-label">Sessions</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">
                    {chartData.length > 1
                      ? `+${(chartData[chartData.length - 1].weight - chartData[0].weight).toFixed(1)}kg`
                      : '—'}
                  </div>
                  <div className="stat-label">Total Progress</div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
