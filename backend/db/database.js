const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'mindbloom.db');
let db;

function getDB() {
  if (!db) {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    db = new DatabaseSync(DB_PATH);
    try {
      db.exec('PRAGMA journal_mode = WAL;');
      db.exec('PRAGMA foreign_keys = ON;');
    } catch (e) {
      // ignore pragma issues on in-memory or specific configurations
    }
  }
  return db;
}

async function initDB() {
  const database = getDB();
  
  // Users table
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      avatar TEXT DEFAULT 'sprout',
      xp INTEGER DEFAULT 0,
      level INTEGER DEFAULT 1,
      streak INTEGER DEFAULT 0,
      last_mood_date TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // Mood entries table
  database.exec(`
    CREATE TABLE IF NOT EXISTS mood_entries (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      mood_score INTEGER NOT NULL CHECK(mood_score BETWEEN 1 AND 10),
      mood_emoji TEXT NOT NULL,
      mood_label TEXT NOT NULL,
      note TEXT,
      activities TEXT DEFAULT '[]',
      energy_level INTEGER CHECK(energy_level BETWEEN 1 AND 5),
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Journal entries table
  database.exec(`
    CREATE TABLE IF NOT EXISTS journal_entries (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      mood_tag TEXT,
      is_private INTEGER DEFAULT 1,
      word_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Wellness challenges table
  database.exec(`
    CREATE TABLE IF NOT EXISTS challenges (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      difficulty TEXT NOT NULL DEFAULT 'easy',
      xp_reward INTEGER DEFAULT 50,
      duration_days INTEGER DEFAULT 7,
      icon TEXT DEFAULT '🌱',
      is_active INTEGER DEFAULT 1
    )
  `);

  // User challenge progress table
  database.exec(`
    CREATE TABLE IF NOT EXISTS user_challenges (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      challenge_id TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      progress INTEGER DEFAULT 0,
      started_at TEXT DEFAULT (datetime('now')),
      completed_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (challenge_id) REFERENCES challenges(id)
    )
  `);

  // Breathing exercises & mindfulness sessions
  database.exec(`
    CREATE TABLE IF NOT EXISTS mindfulness_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      session_type TEXT NOT NULL,
      duration_seconds INTEGER NOT NULL,
      completed INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Seed challenges if empty
  const challengeCount = database.prepare('SELECT COUNT(*) as count FROM challenges').get();
  if (!challengeCount || challengeCount.count === 0) {
    await seedChallenges(database);
  }

  console.log('✅ Database initialized successfully');
  return database;
}

async function seedChallenges(database) {
  const { v4: uuidv4 } = require('uuid');
  const challenges = [
    {
      id: uuidv4(), title: '7-Day Mood Tracker', description: 'Log your mood every day for 7 days straight. Self-awareness is the first step to wellness!',
      category: 'awareness', difficulty: 'easy', xp_reward: 100, duration_days: 7, icon: '📊'
    },
    {
      id: uuidv4(), title: 'Gratitude Journal', description: 'Write 3 things you are grateful for every day for 5 days.',
      category: 'journaling', difficulty: 'easy', xp_reward: 75, duration_days: 5, icon: '🙏'
    },
    {
      id: uuidv4(), title: 'Digital Detox', description: 'Take a 2-hour break from social media each day for 3 days.',
      category: 'lifestyle', difficulty: 'medium', xp_reward: 150, duration_days: 3, icon: '📵'
    },
    {
      id: uuidv4(), title: 'Mindful Breathing Master', description: 'Complete 5 breathing exercises this week.',
      category: 'mindfulness', difficulty: 'easy', xp_reward: 80, duration_days: 7, icon: '🧘'
    },
    {
      id: uuidv4(), title: 'Move Your Body', description: 'Do at least 20 minutes of physical activity for 5 out of 7 days.',
      category: 'physical', difficulty: 'medium', xp_reward: 120, duration_days: 7, icon: '🏃'
    },
    {
      id: uuidv4(), title: 'Sleep Champion', description: 'Log consistent sleep before midnight for 5 days in a row.',
      category: 'lifestyle', difficulty: 'hard', xp_reward: 200, duration_days: 5, icon: '😴'
    },
    {
      id: uuidv4(), title: 'Kindness Streak', description: 'Do one kind thing for someone each day for 7 days and journal about it.',
      category: 'social', difficulty: 'medium', xp_reward: 150, duration_days: 7, icon: '💖'
    },
    {
      id: uuidv4(), title: 'Creative Expression', description: 'Write, draw, sing, or create something expressive for 5 days.',
      category: 'creativity', difficulty: 'easy', xp_reward: 100, duration_days: 5, icon: '🎨'
    }
  ];

  const insert = database.prepare(`
    INSERT INTO challenges (id, title, description, category, difficulty, xp_reward, duration_days, icon)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const item of challenges) {
    insert.run(item.id, item.title, item.description, item.category, item.difficulty, item.xp_reward, item.duration_days, item.icon);
  }
  console.log('✅ Challenges seeded');
}

module.exports = { getDB, initDB };
