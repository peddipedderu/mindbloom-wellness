const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const { getDB } = require('../db/database');
const { authenticate } = require('./auth');

const MOOD_EMOJIS = {
  1: '😭', 2: '😢', 3: '😞', 4: '😕', 5: '😐',
  6: '🙂', 7: '😊', 8: '😄', 9: '🤩', 10: '🥳'
};
const MOOD_LABELS = {
  1: 'Terrible', 2: 'Very Sad', 3: 'Sad', 4: 'Low', 5: 'Neutral',
  6: 'Okay', 7: 'Good', 8: 'Great', 9: 'Excellent', 10: 'Amazing'
};

// Log mood
router.post('/', authenticate, [
  body('mood_score').isInt({ min: 1, max: 10 }),
  body('note').optional().trim().isLength({ max: 500 }),
  body('activities').optional().isArray(),
  body('energy_level').optional().isInt({ min: 1, max: 5 })
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { mood_score, note, activities = [], energy_level } = req.body;
  const db = getDB();
  const id = uuidv4();
  const today = new Date().toISOString().split('T')[0];

  db.prepare(`
    INSERT INTO mood_entries (id, user_id, mood_score, mood_emoji, mood_label, note, activities, energy_level)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, req.userId, mood_score, MOOD_EMOJIS[mood_score], MOOD_LABELS[mood_score], note || null, JSON.stringify(activities), energy_level || null);

  // Update streak and XP
  const user = db.prepare('SELECT streak, last_mood_date, xp, level FROM users WHERE id = ?').get(req.userId);
  let newStreak = user.streak;
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  if (user.last_mood_date === yesterday) {
    newStreak = user.streak + 1;
  } else if (user.last_mood_date !== today) {
    newStreak = 1;
  }

  const newXP = user.xp + 20 + (newStreak > 1 ? 5 : 0); // Bonus for streak
  const newLevel = Math.floor(newXP / 200) + 1;

  db.prepare('UPDATE users SET streak = ?, last_mood_date = ?, xp = ?, level = ?, updated_at = datetime("now") WHERE id = ?')
    .run(newStreak, today, newXP, newLevel, req.userId);

  const entry = db.prepare('SELECT * FROM mood_entries WHERE id = ?').get(id);
  const updatedUser = db.prepare('SELECT id, username, xp, level, streak FROM users WHERE id = ?').get(req.userId);

  res.status(201).json({ 
    entry, 
    user: updatedUser,
    xp_earned: newXP - user.xp,
    streak: newStreak,
    message: `Mood logged! +${newXP - user.xp} XP 🌱`
  });
});

// Get mood history
router.get('/', authenticate, (req, res) => {
  const { limit = 30, offset = 0 } = req.query;
  const db = getDB();
  const entries = db.prepare('SELECT * FROM mood_entries WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?')
    .all(req.userId, parseInt(limit), parseInt(offset));
  const total = db.prepare('SELECT COUNT(*) as count FROM mood_entries WHERE user_id = ?').get(req.userId);
  res.json({ entries, total: total.count });
});

// Get today's mood
router.get('/today', authenticate, (req, res) => {
  const db = getDB();
  const today = new Date().toISOString().split('T')[0];
  const entry = db.prepare("SELECT * FROM mood_entries WHERE user_id = ? AND date(created_at) = ? ORDER BY created_at DESC LIMIT 1")
    .get(req.userId, today);
  res.json(entry || null);
});

// Get mood analytics (weekly/monthly)
router.get('/analytics', authenticate, (req, res) => {
  const { period = 'week' } = req.query;
  const db = getDB();
  const days = period === 'month' ? 30 : 7;
  
  const entries = db.prepare(`
    SELECT date(created_at) as date, AVG(mood_score) as avg_mood, COUNT(*) as count,
           GROUP_CONCAT(mood_emoji) as emojis
    FROM mood_entries 
    WHERE user_id = ? AND created_at >= datetime('now', ?)
    GROUP BY date(created_at)
    ORDER BY date ASC
  `).all(req.userId, `-${days} days`);

  const avgMood = db.prepare('SELECT AVG(mood_score) as avg FROM mood_entries WHERE user_id = ? AND created_at >= datetime("now", ?)').get(req.userId, `-${days} days`);
  const bestMood = db.prepare('SELECT MAX(mood_score) as best FROM mood_entries WHERE user_id = ?').get(req.userId);

  res.json({ entries, avg_mood: avgMood.avg, best_mood: bestMood.best, period });
});

module.exports = router;
