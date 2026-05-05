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
      .order('date', { ascending: true }); // FIX: order by date, not created_at

    if (error) return res.status(500).json({ error: error.message });

    if (!data || data.length === 0) return res.json([]);

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/bodyweight — upsert so logging same date updates instead of erroring
router.post('/', async (req, res) => {
  try {
    const { weight_kg, date } = req.body;

    if (!weight_kg) return res.status(400).json({ error: 'weight_kg is required' });

    const entryDate = date || new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('body_weight')
      .upsert(
        {
          user_id: req.user.id,
          weight_kg,
          date: entryDate,
        },
        {
          onConflict: 'user_id,date', // matches your unique constraint
        }
      )
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