require('dotenv').config();
const express = require('express');
const cors = require('cors');

const workoutRoutes = require('./routes/workouts');
const exerciseRoutes = require('./routes/exercises');
const authMiddleware = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://your-vercel-app.vercel.app'
  ]
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Protected routes
app.use('/api/workouts', authMiddleware, workoutRoutes);
app.use('/api/exercises', authMiddleware, exerciseRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
