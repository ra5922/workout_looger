const supabase = require('../lib/supabase');

// GET /api/workouts — list all workouts for the user
const getWorkouts = async (req, res) => {
  const { data, error } = await supabase
    .from('workouts')
    .select(`
      *,
      workout_exercises (
        id, sets, reps, weight_kg, notes, order,
        exercises ( id, name, muscle_group )
      )
    `)
    .eq('user_id', req.user.id)
    .order('date', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

// GET /api/workouts/:id
const getWorkout = async (req, res) => {
  const { data, error } = await supabase
    .from('workouts')
    .select(`
      *,
      workout_exercises (
        id, sets, reps, weight_kg, notes, order,
        exercises ( id, name, muscle_group )
      )
    `)
    .eq('id', req.params.id)
    .eq('user_id', req.user.id)
    .single();

  if (error) return res.status(404).json({ error: 'Workout not found' });
  res.json(data);
};

// POST /api/workouts
const createWorkout = async (req, res) => {
  const { name, date, notes, exercises } = req.body;

  // Insert workout
  const { data: workout, error: wErr } = await supabase
    .from('workouts')
    .insert({ user_id: req.user.id, name, date, notes })
    .select()
    .single();

  if (wErr) return res.status(500).json({ error: wErr.message });

  // Insert exercises if provided
  if (exercises && exercises.length > 0) {
    const rows = exercises.map((ex, i) => ({
      workout_id: workout.id,
      exercise_id: ex.exercise_id,
      sets: ex.sets,
      reps: ex.reps,
      weight_kg: ex.weight_kg,
      notes: ex.notes,
      order: i,
    }));

    const { error: exErr } = await supabase.from('workout_exercises').insert(rows);
    if (exErr) return res.status(500).json({ error: exErr.message });
  }

  res.status(201).json(workout);
};

// PUT /api/workouts/:id
const updateWorkout = async (req, res) => {
  const { name, date, notes } = req.body;

  const { data, error } = await supabase
    .from('workouts')
    .update({ name, date, notes })
    .eq('id', req.params.id)
    .eq('user_id', req.user.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

// DELETE /api/workouts/:id
const deleteWorkout = async (req, res) => {
  const { error } = await supabase
    .from('workouts')
    .delete()
    .eq('id', req.params.id)
    .eq('user_id', req.user.id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Workout deleted' });
};

// GET /api/workouts/stats/summary — personal records & weekly volume
const getStats = async (req, res) => {
  const { data, error } = await supabase
    .from('workout_exercises')
    .select(`
      weight_kg, sets, reps,
      exercises ( name, muscle_group ),
      workouts!inner ( user_id, date )
    `)
    .eq('workouts.user_id', req.user.id);

  if (error) return res.status(500).json({ error: error.message });

  // Personal records per exercise
  const records = {};
  data.forEach(row => {
    const name = row.exercises?.name;
    if (!name) return;
    if (!records[name] || row.weight_kg > records[name]) {
      records[name] = row.weight_kg;
    }
  });

  res.json({ personal_records: records, total_sets: data.length });
};

// POST /api/workouts/:id/duplicate
const duplicate = async (req, res) => {
  // Fetch original workout with exercises
  const { data: original, error: oErr } = await supabase
    .from('workouts')
    .select(`*, workout_exercises(*)`)
    .eq('id', req.params.id)
    .eq('user_id', req.user.id)
    .single();

  if (oErr) return res.status(404).json({ error: 'Workout not found' });

  // Create new workout with today's date
  const { data: newWorkout, error: wErr } = await supabase
    .from('workouts')
    .insert({
      user_id: req.user.id,
      name: `${original.name} (Copy)`,
      date: new Date().toISOString().split('T')[0],
      notes: original.notes,
    })
    .select()
    .single();

  if (wErr) return res.status(500).json({ error: wErr.message });

  // Copy exercises
  if (original.workout_exercises?.length > 0) {
    const rows = original.workout_exercises.map(ex => ({
      workout_id: newWorkout.id,
      exercise_id: ex.exercise_id,
      sets: ex.sets,
      reps: ex.reps,
      weight_kg: ex.weight_kg,
      notes: ex.notes,
      order: ex.order,
    }));
    await supabase.from('workout_exercises').insert(rows);
  }

  res.status(201).json(newWorkout);
};

module.exports = { getWorkouts, getWorkout, createWorkout, updateWorkout, deleteWorkout, getStats, duplicate };
