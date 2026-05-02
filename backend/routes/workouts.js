const express = require('express');
const router = express.Router();
const {
  getWorkouts,
  getWorkout,
  createWorkout,
  updateWorkout,
  deleteWorkout,
  getStats,
  duplicate,
} = require('../controllers/workouts');

router.get('/stats/summary', getStats);
router.post('/:id/duplicate', duplicate);
router.delete('/:id/exercises', async (req, res) => {
  const supabase = require('../lib/supabase');
  // Verify ownership
  const { data: workout } = await supabase.from('workouts').select('id').eq('id', req.params.id).eq('user_id', req.user.id).single();
  if (!workout) return res.status(403).json({ error: 'Forbidden' });
  await supabase.from('workout_exercises').delete().eq('workout_id', req.params.id);
  res.json({ message: 'Exercises cleared' });
});
router.post('/:id/exercises', async (req, res) => {
  const supabase = require('../lib/supabase');
  const { exercises } = req.body;
  const { data: workout } = await supabase.from('workouts').select('id').eq('id', req.params.id).eq('user_id', req.user.id).single();
  if (!workout) return res.status(403).json({ error: 'Forbidden' });
  const rows = exercises.map((ex, i) => ({
    workout_id: req.params.id,
    exercise_id: ex.exercise_id,
    sets: ex.sets,
    reps: ex.reps,
    weight_kg: ex.weight_kg,
    notes: ex.notes,
    order: i,
  }));
  const { error } = await supabase.from('workout_exercises').insert(rows);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Exercises saved' });
});
router.get('/', getWorkouts);
router.get('/:id', getWorkout);
router.post('/', createWorkout);
router.put('/:id', updateWorkout);
router.delete('/:id', deleteWorkout);

module.exports = router;
