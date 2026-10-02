# 🌱 MindBloom — Student Mental Wellness Tracker

> **FirstCommit Hackathon 2026 Submission**  
> *Your mental health matters. Start your wellness journey today.*

[![Live Demo](https://img.shields.io/badge/🌱%20Live%20Demo-mindbloom--wellness.fly.dev-6C63FF?style=for-the-badge)](https://mindbloom-wellness.fly.dev)
[![GitHub](https://img.shields.io/badge/GitHub-mindbloom--wellness-181717?style=for-the-badge&logo=github)](https://github.com/royokello/mindbloom-wellness)

---

## 🎯 What We Built

**MindBloom** is a full-stack mental wellness web application designed specifically for students (ages 13–21). It helps young people develop self-awareness, build healthy habits, and track their emotional journey through gamified wellness features.

### The Problem It Solves
Mental health among students is at a crisis point — 1 in 3 students experiences anxiety, and most lack accessible, engaging tools to manage their wellbeing. MindBloom makes wellness *fun* and *consistent* through gamification, turning daily check-ins into a rewarding habit.

### Who It's For
Students aged 13-21 who want to:
- Understand their emotional patterns
- Build healthy daily habits
- Have a private, judgment-free space to reflect
- Compete with friends in wellness challenges

---

## ✨ Features

| Feature | Description |
|---------|------------|
| 😊 **Daily Mood Logging** | 10-point mood scale with emojis, activities tagging, energy tracking |
| 📔 **Private Journal** | Rich text journaling with mood tags and word count tracking |
| 🎯 **Wellness Challenges** | 8 gamified challenges (7-Day Tracker, Gratitude, Digital Detox, etc.) |
| 🧘 **Breathing Exercises** | Interactive animated breathing sessions (4-7-8, Box Breathing, Calm) |
| 📊 **Analytics Dashboard** | 7/30-day mood trends, streak tracking, XP & level progression |
| 🏆 **Leaderboard** | Community XP rankings (gamified wellness) |
| 🔐 **Secure Auth** | JWT authentication, bcrypt password hashing |
| 📱 **Mobile Responsive** | Works perfectly on phones, tablets, and desktop |

---

## 🛠️ Technologies Used

### Backend
- **Node.js** (v20+) — Server runtime
- **Express.js** — Web framework
- **better-sqlite3** — Embedded SQLite database (no external DB needed)
- **jsonwebtoken** — JWT authentication
- **bcryptjs** — Secure password hashing
- **helmet** — HTTP security headers
- **express-rate-limit** — API rate limiting
- **express-validator** — Input validation
- **dotenv** — Environment configuration

### Frontend
- **Vanilla JavaScript** — No framework, pure performance
- **CSS Custom Properties** — Advanced theming system
- **CSS Grid & Flexbox** — Responsive layout
- **Google Fonts** (Inter + Space Grotesk) — Typography
- **CSS Animations** — Smooth micro-interactions

### Infrastructure
- **Docker** — Containerization
- **Fly.io** — Global deployment (port 8080)
- **Git/GitHub** — Version control

---

## 🚀 Setup Instructions

### Prerequisites
- Node.js v18+ ([download](https://nodejs.org))
- npm v8+

### Local Development

```bash
# Clone the repository
git clone https://github.com/royokello/mindbloom-wellness.git
cd mindbloom-wellness

# Install backend dependencies
cd backend
npm install

# Create environment file
cp .env.example .env
# Edit .env with your settings (or leave defaults for development)

# Start the server
npm start
```

Open [http://localhost:3001](http://localhost:3001) in your browser.

### Environment Variables

```env
PORT=3001                    # Server port (default: 3001)
JWT_SECRET=your_secret_here  # JWT signing key (change in production!)
NODE_ENV=development         # Environment
DB_PATH=./mindbloom.db       # SQLite database path
```

### Docker

```bash
# Build the image
docker build -t mindbloom .

# Run the container
docker run -p 8080:8080 -v mindbloom_data:/data mindbloom
```

---

## 📁 Project Structure

```
mindbloom/
├── Dockerfile              # Container configuration
├── fly.toml                # Fly.io deployment config
├── README.md               # This file
└── backend/
    ├── server.js           # Express app entry point
    ├── package.json        # Dependencies
    ├── .env.example        # Environment template
    ├── db/
    │   └── database.js     # SQLite schema & initialization
    ├── routes/
    │   ├── auth.js         # Authentication (register/login/profile)
    │   ├── moods.js        # Mood logging & analytics
    │   ├── journal.js      # Journal CRUD
    │   ├── challenges.js   # Wellness challenges & mindfulness
    │   └── stats.js        # Dashboard & leaderboard stats
    └── public/
        └── index.html      # Complete single-file frontend
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create new account |
| POST | `/api/auth/login` | Sign in |
| GET | `/api/auth/profile` | Get user profile |
| POST | `/api/moods` | Log a mood entry |
| GET | `/api/moods` | Get mood history |
| GET | `/api/moods/today` | Get today's mood |
| GET | `/api/moods/analytics` | Get mood analytics |
| GET | `/api/journal` | Get journal entries |
| POST | `/api/journal` | Create journal entry |
| PUT | `/api/journal/:id` | Update entry |
| DELETE | `/api/journal/:id` | Delete entry |
| GET | `/api/challenges` | Get all challenges |
| POST | `/api/challenges/:id/join` | Join a challenge |
| POST | `/api/challenges/:id/progress` | Update progress |
| POST | `/api/challenges/mindfulness` | Log breathing session |
| GET | `/api/stats/dashboard` | Get full dashboard data |
| GET | `/api/stats/leaderboard` | Get XP leaderboard |
| GET | `/api/health` | Health check |

---

## 🎮 Gamification System

- **Mood Log**: +20 XP (+ bonus for streaks)
- **Journal Entry**: +15 XP
- **Breathing Session**: +5 XP per minute
- **Challenge Complete**: +75–200 XP depending on difficulty
- **Levels**: Every 200 XP = level up (Seedling → Sprout → Sapling → Tree → Ancient Oak → Forest Guardian)
- **Streaks**: Consecutive daily mood logging builds your streak

---

## 🏫 Judging Criteria Alignment

| Criterion | How MindBloom Addresses It |
|-----------|---------------------------|
| **Learning & Growth** | Built a complete full-stack app from scratch — Node.js backend, SQLite DB, JWT auth, responsive CSS |
| **Creativity** | Unique gamification of mental wellness; breathing exercises with animated UI; XP/level system for wellness habits |
| **Execution** | Fully functional app: auth works, mood logging persists, journal CRUD, challenge system, analytics |
| **Technical Understanding** | Clean architecture with separated routes, middleware, DB layer, and frontend |
| **Presentation** | Beautiful dark-mode UI, smooth animations, mobile-responsive, live deployment |

---

## 🧠 What I Learned

Building MindBloom taught me:
1. **RESTful API design** — proper HTTP methods, status codes, and response structures
2. **JWT authentication** — stateless auth flow with secure token handling
3. **SQLite with Node.js** — embedded database design, migrations, and seeding
4. **CSS architecture** — CSS custom properties, animations, and responsive design without a framework
5. **Docker containerization** — writing Dockerfiles and deploying to cloud platforms
6. **Security best practices** — rate limiting, input validation, password hashing, CORS

---

## 💡 Challenges I Overcame

- **No-framework frontend**: Building a full SPA without React/Vue required creative state management using vanilla JS — learning about DOM manipulation, event delegation, and async patterns
- **SQLite in production**: Setting up persistent volumes on Fly.io for the SQLite database file
- **Responsive design**: Creating a sidebar layout that collapses to a mobile-friendly drawer without any CSS frameworks
- **Breathing animation timing**: Implementing smooth async breathing cycles that could be interrupted cleanly

---

## 🌱 Future Plans

- [ ] Push notifications for daily mood reminders
- [ ] Mood prediction using simple ML (based on patterns)
- [ ] Group challenges with friends
- [ ] Integration with school counselor dashboards
- [ ] Export journal entries as PDF
- [ ] Dark/light mode toggle

---

## 📸 Screenshots

See the `/screenshots` folder for app screenshots.

---

## 📜 License

MIT License — feel free to learn from, fork, and build upon this project!

---

## 🙏 Acknowledgments

Built with ❤️ for the **FirstCommit Hackathon 2026**.  
*Mental health is not a luxury. It's a necessity. 🌱*

> **Disclosure**: AI tools (Antigravity) were used to assist with code architecture planning and debugging during this hackathon.
