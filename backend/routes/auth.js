const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const { getDB } = require('../db/database');

const JWT_SECRET = process.env.JWT_SECRET || 'mindbloom_secret_2026';

// Middleware to verify JWT
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Register
router.post('/register', [
  body('username').trim().isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 chars'),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 chars')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { username, email, password } = req.body;
  const db = getDB();

  try {
    const existing = db.prepare('SELECT id FROM users WHERE email = ? OR username = ?').get(email, username);
    if (existing) return res.status(409).json({ error: 'Username or email already taken' });

    const passwordHash = await bcrypt.hash(password, 12);
    const userId = uuidv4();

    db.prepare(`
      INSERT INTO users (id, username, email, password_hash, avatar)
      VALUES (?, ?, ?, ?, ?)
    `).run(userId, username, email, passwordHash, 'sprout');

    const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30d' });
    const user = db.prepare('SELECT id, username, email, avatar, xp, level, streak FROM users WHERE id = ?').get(userId);

    res.status(201).json({ token, user, message: 'Welcome to MindBloom! 🌱' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, password } = req.body;
  const db = getDB();

  try {
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });
    const { password_hash, ...safeUser } = user;

    res.json({ token, user: safeUser, message: `Welcome back, ${user.username}! 🌱` });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get profile
router.get('/profile', authenticate, (req, res) => {
  const db = getDB();
  const user = db.prepare('SELECT id, username, email, avatar, xp, level, streak, last_mood_date, created_at FROM users WHERE id = ?').get(req.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

// Update profile
router.put('/profile', authenticate, [
  body('username').optional().trim().isLength({ min: 3, max: 30 }),
  body('avatar').optional().trim()
], (req, res) => {
  const { username, avatar } = req.body;
  const db = getDB();
  db.prepare('UPDATE users SET username = COALESCE(?, username), avatar = COALESCE(?, avatar), updated_at = datetime("now") WHERE id = ?')
    .run(username || null, avatar || null, req.userId);
  const user = db.prepare('SELECT id, username, email, avatar, xp, level, streak FROM users WHERE id = ?').get(req.userId);
  res.json(user);
});

router.authenticate = authenticate;
module.exports = router;
module.exports.router = router;
module.exports.authenticate = authenticate;
