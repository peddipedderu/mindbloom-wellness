const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getDB } = require('../db/database');
const { authenticate } = require('./auth');

// Get all available challenges
router.get('/', authenticate, (req, res) => {
  const db = getDB();
  const challenges = db.prepare('SELECT * FROM challenges WHERE is_active = 1').all();
  
  // Get user's active challenge IDs
  const userChallenges = db.prepare('SELECT * FROM user_challenges WHERE user_id = ?').all(req.userId);
  const userChallengeMap = {};
  userChallenges.forEach(uc => { userChallengeMap[uc.challenge_id] = uc; });

  const enriched = challenges.map(c => ({
    ...c,
    userProgress: userChallengeMap[c.id] || null
  }));

  res.json(enriched);
});

// Join a challenge
router.post('/:id/join', authenticate, (req, res) => {
  const db = getDB();
  const challenge = db.prepare('SELECT * FROM challenges WHERE id = ?').get(req.params.id);
  if (!challenge) return res.status(404).json({ error: 'Challenge not found' });

  const existing = db.prepare('SELECT * FROM user_challenges WHERE user_id = ? AND challenge_id = ? AND status = "active"').get(req.userId, req.params.id);
  if (existing) return res.status(409).json({ error: 'Already joined this challenge' });

  const id = uuidv4();
  db.prepare(`
    INSERT INTO user_challenges (id, user_id, challenge_id, status, progress)
    VALUES (?, ?, ?, 'active', 0)
  `).run(id, req.userId, req.params.id);

  res.status(201).json({ message: `Challenge started! Good luck! 💪`, challenge });
});

// Update challenge progress
router.post('/:id/progress', authenticate, (req, res) => {
  const { increment = 1 } = req.body;
  const db = getDB();

  const userChallenge = db.prepare('SELECT * FROM user_challenges WHERE user_id = ? AND challenge_id = ? AND status = "active"').get(req.userId, req.params.id);
  if (!userChallenge) return res.status(404).json({ error: 'Challenge not active' });

  const challenge = db.prepare('SELECT * FROM challenges WHERE id = ?').get(req.params.id);
  const newProgress = Math.min(userChallenge.progress + increment, challenge.duration_days);
  const isComplete = newProgress >= challenge.duration_days;

  if (isComplete) {
    db.prepare('UPDATE user_challenges SET progress = ?, status = "completed", completed_at = datetime("now") WHERE id = ?')
      .run(newProgress, userChallenge.id);
    db.prepare('UPDATE users SET xp = xp + ?, level = MAX(1, (xp + ?) / 200 + 1), updated_at = datetime("now") WHERE id = ?')
      .run(challenge.xp_reward, challenge.xp_reward, req.userId);
    res.json({ message: `🎉 Challenge Complete! +${challenge.xp_reward} XP!`, completed: true, xp_earned: challenge.xp_reward });
  } else {
    db.prepare('UPDATE user_challenges SET progress = ? WHERE id = ?').run(newProgress, userChallenge.id);
    res.json({ message: 'Progress updated! Keep going! 💪', progress: newProgress, completed: false });
  }
});

// Get user's active challenges
router.get('/my', authenticate, (req, res) => {
  const db = getDB();
  const myChallenges = db.prepare(`
    SELECT uc.*, c.title, c.description, c.category, c.difficulty, c.xp_reward, c.duration_days, c.icon
    FROM user_challenges uc
    JOIN challenges c ON uc.challenge_id = c.id
    WHERE uc.user_id = ?
    ORDER BY uc.started_at DESC
  `).all(req.userId);
  res.json(myChallenges);
});

// Log mindfulness session
router.post('/mindfulness', authenticate, (req, res) => {
  const { session_type, duration_seconds } = req.body;
  const db = getDB();
  const id = uuidv4();
  
  db.prepare('INSERT INTO mindfulness_sessions (id, user_id, session_type, duration_seconds) VALUES (?, ?, ?, ?)').run(id, req.userId, session_type, duration_seconds);
  
  const xp = Math.floor(duration_seconds / 60) * 5; // 5 XP per minute
  db.prepare('UPDATE users SET xp = xp + ?, updated_at = datetime("now") WHERE id = ?').run(xp, req.userId);
  
  res.json({ message: `Great session! +${xp} XP 🧘`, xp_earned: xp });
});

module.exports = router;
