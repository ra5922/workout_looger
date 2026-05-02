const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');

// GET /api/exercises — get exercise library
router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .order('muscle_group', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST /api/exercises — create custom exercise
router.post('/', async (req, res) => {
  const { name, muscle_group, description } = req.body;

  const { data, error } = await supabase
    .from('exercises')
    .insert({ name, muscle_group, description, created_by: req.user.id })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

module.exports = router;
