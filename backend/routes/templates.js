const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');

// GET /api/templates
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('templates')
      .select(`*, template_exercises(*, exercises(id, name, muscle_group))`)
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/templates
router.post('/', async (req, res) => {
  try {
    const { name, notes, exercises } = req.body;

    if (!name) return res.status(400).json({ error: 'Template name is required' });

    const { data: template, error: tErr } = await supabase
      .from('templates')
      .insert({ user_id: req.user.id, name, notes })
      .select()
      .single();

    if (tErr) return res.status(500).json({ error: tErr.message });

    if (exercises && exercises.length > 0) {
      const rows = exercises.map((ex, i) => ({
        template_id: template.id,
        exercise_id: ex.exercise_id,
        sets: ex.sets,
        reps: ex.reps,
        weight_kg: ex.weight_kg,
        notes: ex.notes,
        order: i,
      }));

      const { error: exErr } = await supabase
        .from('template_exercises')
        .insert(rows);

      if (exErr) return res.status(500).json({ error: exErr.message });
    }

    res.status(201).json(template);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/templates/:id/use — create workout from template
router.post('/:id/use', async (req, res) => {
  try {
    const { data: template, error: tErr } = await supabase
      .from('templates')
      .select(`*, template_exercises(*)`)
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (tErr || !template) return res.status(404).json({ error: 'Template not found' });

    const { data: workout, error: wErr } = await supabase
      .from('workouts')
      .insert({
        user_id: req.user.id,
        name: template.name,
        date: new Date().toISOString().split('T')[0],
        notes: template.notes,
      })
      .select()
      .single();

    if (wErr) return res.status(500).json({ error: wErr.message });

    if (template.template_exercises?.length > 0) {
      const rows = template.template_exercises.map(ex => ({
        workout_id: workout.id,
        exercise_id: ex.exercise_id,
        sets: ex.sets,
        reps: ex.reps,
        weight_kg: ex.weight_kg,
        notes: ex.notes,
        order: ex.order,
      }));

      const { error: exErr } = await supabase
        .from('workout_exercises')
        .insert(rows);

      if (exErr) return res.status(500).json({ error: exErr.message });
    }

    res.status(201).json(workout);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/templates/:id
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('templates')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ message: 'Template deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;