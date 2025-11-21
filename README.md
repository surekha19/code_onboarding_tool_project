Onboarding Tool (improved scaffold)

Structure:
- backend/  Node.js + Express + SQLite (migrate & seed provided)
- frontend/ React 18 + Vite + Tailwind (improved UI, LessonPlayer, Profile)

Usage:
1) Run this Python script (regenerate_onboarding.py) to create/update files.
2) Backend:
   npm install
   cp .env.example .env
   npm run migrate
   npm run seed
   npm run dev

3) Frontend:
   npm install
   cp .env.example .env
   npm run dev

Notes:
- After starting servers, open http://localhost:5173 for the frontend.
- Tailwind is pinned to v3.4.x for compatibility with scaffold.

