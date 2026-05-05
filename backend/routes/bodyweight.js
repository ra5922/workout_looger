const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');

// GET /api/bodyweight
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('body_weight')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: true });

    if (error) return res.status(500).json({ error: error.message });

    if (!data || data.length === 0) return res.json({ entries: [], stats: null });

    const weights = data.map(e => e.weight_kg);
    const stats = {
      current: weights[weights.length - 1],
      lowest: Math.min(...weights),
      highest: Math.max(...weights),
      total_change: +(weights[weights.length - 1] - weights[0]).toFixed(2),
      total_entries: weights.length,
    };

    res.json({ entries: data, stats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/bodyweight
router.post('/', async (req, res) => {
  try {
    const { weight_kg, date } = req.body;

    if (!weight_kg) return res.status(400).json({ error: 'weight_kg is required' });

    const { data, error } = await supabase
      .from('body_weight')
      .insert({
        user_id: req.user.id,
        weight_kg,
        date: date || new Date().toISOString().split('T')[0],
      })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/bodyweight/:id
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('body_weight')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;