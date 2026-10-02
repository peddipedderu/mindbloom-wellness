const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const { getDB } = require('../db/database');
const { authenticate } = require('./auth');

// Create journal entry
router.post('/', authenticate, [
  body('title').trim().isLength({ min: 1, max: 100 }),
  body('content').trim().isLength({ min: 1, max: 5000 }),
  body('mood_tag').optional().trim()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { title, content, mood_tag } = req.body;
  const db = getDB();
  const id = uuidv4();
  const wordCount = content.split(/\s+/).filter(Boolean).length;

  db.prepare(`
    INSERT INTO journal_entries (id, user_id, title, content, mood_tag, word_count)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, req.userId, title, content, mood_tag || null, wordCount);

  // Reward XP for journaling
  db.prepare('UPDATE users SET xp = xp + 15, updated_at = datetime("now") WHERE id = ?').run(req.userId);

  const entry = db.prepare('SELECT * FROM journal_entries WHERE id = ?').get(id);
  res.status(201).json({ entry, xp_earned: 15, message: 'Journal entry saved! +15 XP ✍️' });
});

// Get all journal entries
router.get('/', authenticate, (req, res) => {
  const { limit = 20, offset = 0 } = req.query;
  const db = getDB();
  const entries = db.prepare(`
    SELECT id, title, substr(content, 1, 150) as preview, mood_tag, word_count, created_at, updated_at
    FROM journal_entries WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?
  `).all(req.userId, parseInt(limit), parseInt(offset));
  const total = db.prepare('SELECT COUNT(*) as count FROM journal_entries WHERE user_id = ?').get(req.userId);
  res.json({ entries, total: total.count });
});

// Get single journal entry
router.get('/:id', authenticate, (req, res) => {
  const db = getDB();
  const entry = db.prepare('SELECT * FROM journal_entries WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!entry) return res.status(404).json({ error: 'Entry not found' });
  res.json(entry);
});

// Update journal entry
router.put('/:id', authenticate, [
  body('title').optional().trim().isLength({ min: 1, max: 100 }),
  body('content').optional().trim().isLength({ min: 1, max: 5000 })
], (req, res) => {
  const { title, content, mood_tag } = req.body;
  const db = getDB();
  const wordCount = content ? content.split(/\s+/).filter(Boolean).length : undefined;
  
  db.prepare(`
    UPDATE journal_entries SET 
      title = COALESCE(?, title), 
      content = COALESCE(?, content),
      mood_tag = COALESCE(?, mood_tag),
      word_count = COALESCE(?, word_count),
      updated_at = datetime('now')
    WHERE id = ? AND user_id = ?
  `).run(title || null, content || null, mood_tag || null, wordCount || null, req.params.id, req.userId);

  const entry = db.prepare('SELECT * FROM journal_entries WHERE id = ?').get(req.params.id);
  res.json(entry);
});

// Delete journal entry
router.delete('/:id', authenticate, (req, res) => {
  const db = getDB();
  db.prepare('DELETE FROM journal_entries WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
  res.json({ message: 'Entry deleted' });
});

module.exports = router;
