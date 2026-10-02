const express = require('express');
const router = express.Router();
const { getDB } = require('../db/database');
const { authenticate } = require('./auth');

// Get dashboard stats for user
router.get('/dashboard', authenticate, (req, res) => {
  const db = getDB();
  
  const user = db.prepare('SELECT id, username, email, avatar, xp, level, streak, last_mood_date, created_at FROM users WHERE id = ?').get(req.userId);
  
  // Total mood entries
  const totalMoods = db.prepare('SELECT COUNT(*) as count FROM mood_entries WHERE user_id = ?').get(req.userId);
  
  // Average mood this week
  const weeklyAvg = db.prepare(`
    SELECT AVG(mood_score) as avg, COUNT(*) as count FROM mood_entries 
    WHERE user_id = ? AND created_at >= datetime('now', '-7 days')
  `).get(req.userId);

  // Recent mood trend (last 7 days)
  const moodTrend = db.prepare(`
    SELECT date(created_at) as date, AVG(mood_score) as mood, mood_emoji
    FROM mood_entries WHERE user_id = ? AND created_at >= datetime('now', '-7 days')
    GROUP BY date(created_at) ORDER BY date ASC
  `).all(req.userId);

  // Total journal entries
  const totalJournal = db.prepare('SELECT COUNT(*) as count, SUM(word_count) as words FROM journal_entries WHERE user_id = ?').get(req.userId);

  // Active challenges
  const activeChallenges = db.prepare(`
    SELECT uc.progress, c.duration_days, c.title, c.icon, c.category
    FROM user_challenges uc JOIN challenges c ON uc.challenge_id = c.id
    WHERE uc.user_id = ? AND uc.status = 'active'
    LIMIT 3
  `).all(req.userId);

  // Completed challenges
  const completedChallenges = db.prepare("SELECT COUNT(*) as count FROM user_challenges WHERE user_id = ? AND status = 'completed'").get(req.userId);

  // Mindfulness minutes
  const mindfulnessTotal = db.prepare('SELECT SUM(duration_seconds) as total FROM mindfulness_sessions WHERE user_id = ?').get(req.userId);

  // Next level progress
  const xpForCurrentLevel = (user.level - 1) * 200;
  const xpForNextLevel = user.level * 200;
  const levelProgress = ((user.xp - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel)) * 100;

  res.json({
    user,
    stats: {
      total_moods: totalMoods.count,
      weekly_avg_mood: Math.round((weeklyAvg.avg || 0) * 10) / 10,
      weekly_mood_count: weeklyAvg.count,
      total_journal_entries: totalJournal.count,
      total_words_written: totalJournal.words || 0,
      active_challenges: activeChallenges.length,
      completed_challenges: completedChallenges.count,
      mindfulness_minutes: Math.floor((mindfulnessTotal.total || 0) / 60),
      streak: user.streak,
      level: user.level,
      xp: user.xp,
      level_progress: Math.round(levelProgress),
      xp_to_next_level: xpForNextLevel - user.xp
    },
    mood_trend: moodTrend,
    active_challenges: activeChallenges
  });
});

// Get leaderboard (top users by XP - anonymized)
router.get('/leaderboard', authenticate, (req, res) => {
  const db = getDB();
  const leaders = db.prepare(`
    SELECT username, avatar, xp, level, streak,
           CASE WHEN id = ? THEN 1 ELSE 0 END as is_current_user
    FROM users ORDER BY xp DESC LIMIT 10
  `).all(req.userId);
  res.json(leaders);
});

module.exports = router;
