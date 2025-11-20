/**
 * Backend with admin endpoints and admin check.
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const JWT_SECRET = process.env.JWT_SECRET || 'devsecret';
const DB_FILE = process.env.DATABASE_FILE || 'onboard.db';

const db = new sqlite3.Database(DB_FILE);

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Simple auth middleware
function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Missing auth header' });
  const token = auth.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload; // contains id and email
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Admin-check middleware: allow if token email matches admin email OR user role is 'admin' in DB
const ADMIN_EMAIL = 'admin@gmail.com';
function adminMiddleware(req, res, next) {
  if (!req.user || !req.user.email) return res.status(401).json({ error: 'Unauthorized' });
  const email = req.user.email;
  if (email === ADMIN_EMAIL) return next();
  // otherwise check DB role
  db.get('SELECT role FROM users WHERE id = ?', [req.user.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (row && row.role === 'admin') return next();
    return res.status(403).json({ error: 'Admin access required' });
  });
}

/* ---------- Auth ---------- */
app.post('/api/v1/auth/signup', async (req, res) => {
  const { email, password, name, age_group, preferences } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  const pwHash = await bcrypt.hash(password, 10);
  const stmt = db.prepare('INSERT INTO users(email, password_hash, name, age_group, preferences_json) VALUES (?, ?, ?, ?, ?)');
  stmt.run(email, pwHash, name || '', age_group || '', JSON.stringify(preferences || {}), function(err) {
    if (err) {
      return res.status(400).json({ error: 'Email already exists or DB error', detail: err.message });
    }
    const userId = this.lastID;
    const token = jwt.sign({ id: userId, email }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: { id: userId, email, name, age_group, preferences } });
  });
});

app.post('/api/v1/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  db.get('SELECT id, email, password_hash, name, age_group, preferences_json, role FROM users WHERE email = ?', [email], async (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(401).json({ error: 'Invalid credentials' });
    const match = await bcrypt.compare(password, row.password_hash || '');
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: row.id, email: row.email }, JWT_SECRET, { expiresIn: '30d' });
    let prefs = {};
    try { prefs = JSON.parse(row.preferences_json || '{}'); } catch(e){}
    res.json({ token, user: { id: row.id, email: row.email, name: row.name, age_group: row.age_group, preferences: prefs, role: row.role } });
  });
});

/* ---------- Users ---------- */
app.get('/api/v1/users/me', authMiddleware, (req, res) => {
  const uid = req.user.id;
  db.get('SELECT id, email, name, age_group, preferences_json, role, created_at FROM users WHERE id = ?', [uid], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'User not found' });
    try { row.preferences = JSON.parse(row.preferences_json || '{}'); } catch(e){ row.preferences = {}; }
    delete row.preferences_json;
    // collect progress summary
    db.all('SELECT tutorial_id, COUNT(1) as completed_steps FROM user_progress WHERE user_id = ? AND completed = 1 GROUP BY tutorial_id', [uid], (err2, progRows) => {
      if (err2) return res.status(500).json({ error: err2.message });
      row.progress = progRows || [];
      res.json(row);
    });
  });
});

/* ---------- Tutorials & Steps ---------- */
app.get('/api/v1/tutorials', (req, res) => {
  db.all('SELECT id, slug, title, summary, category, difficulty, order_index FROM tutorials ORDER BY order_index', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/api/v1/tutorials/:id', (req, res) => {
  const tid = req.params.id;
  db.get('SELECT id, slug, title, summary, category, difficulty, order_index FROM tutorials WHERE id = ? OR slug = ?', [tid, tid], (err, tut) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!tut) return res.status(404).json({ error: 'Tutorial not found' });
    db.all('SELECT id, step_index, title, content, media_url, is_checkable FROM tutorial_steps WHERE tutorial_id = ? ORDER BY step_index', [tut.id], (err2, steps) => {
      if (err2) return res.status(500).json({ error: err2.message });
      tut.steps = steps || [];
      res.json(tut);
    });
  });
});

// Upsert user progress for a step (idempotent)
app.post('/api/v1/tutorials/:id/progress', authMiddleware, (req, res) => {
  const userId = req.user.id;
  const tutorialId = req.params.id;
  const { step_index, completed } = req.body || {};
  if (typeof step_index === 'undefined') return res.status(400).json({ error: 'step_index required' });
  const now = completed ? new Date().toISOString() : null;

  db.get('SELECT id FROM user_progress WHERE user_id = ? AND tutorial_id = ? AND step_index = ?', [userId, tutorialId, step_index], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (row) {
      db.run('UPDATE user_progress SET completed = ?, completed_at = ? WHERE id = ?', [completed ? 1 : 0, now, row.id], function(err2) {
        if (err2) return res.status(500).json({ error: err2.message });
        return res.json({ ok: true, updated: true });
      });
    } else {
      db.run('INSERT INTO user_progress(user_id, tutorial_id, step_index, completed, completed_at) VALUES (?, ?, ?, ?, ?)', [userId, tutorialId, step_index, completed ? 1 : 0, now], function(err3) {
        if (err3) return res.status(500).json({ error: err3.message });
        return res.json({ ok: true, inserted: true, id: this.lastID });
      });
    }
  });
});

// GET /api/v1/tutorials/:id/progress  - returns completed step_index list for current user
app.get('/api/v1/tutorials/:id/progress', authMiddleware, (req, res) => {
  const tutorialId = req.params.id;
  const userId = req.user.id;
  db.all(
    'SELECT step_index FROM user_progress WHERE user_id = ? AND tutorial_id = ? AND completed = 1',
    [userId, tutorialId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      const completed = (rows || []).map(r => r.step_index);
      res.json({ tutorial_id: tutorialId, completed });
    }
  );
});


/* ---------- Apps ---------- */
app.get('/api/v1/apps', (req, res) => {
  const category = req.query.category;
  let sql = 'SELECT id, name, category, description, android_url, ios_url, safe_score, verified FROM apps';
  const params = [];
  if (category) {
    sql += ' WHERE category = ?';
    params.push(category);
  }
  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

/* ---------- Checklist ---------- */
app.get('/api/v1/checklist', (req, res) => {
  db.all('SELECT id, key, title, description, importance FROM checklist_items ORDER BY importance DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/api/v1/users/me/checklist', authMiddleware, (req, res) => {
  const userid = req.user.id;
  const sql = `SELECT ci.id as item_id, ci.key, ci.title, ci.description, ci.importance, IFNULL(u.completed,0) as completed, u.completed_at
               FROM checklist_items ci
               LEFT JOIN user_checklist u ON u.item_id = ci.id AND u.user_id = ?`;
  db.all(sql, [userid], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/v1/users/me/checklist', authMiddleware, (req, res) => {
  const userid = req.user.id;
  const { item_id, completed } = req.body || {};
  if (!item_id) return res.status(400).json({ error: 'item_id required' });
  const now = completed ? new Date().toISOString() : null;
  db.get('SELECT id FROM user_checklist WHERE user_id = ? AND item_id = ?', [userid, item_id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (row) {
      db.run('UPDATE user_checklist SET completed = ?, completed_at = ? WHERE id = ?', [completed ? 1 : 0, now, row.id], function(err2){
        if (err2) return res.status(500).json({ error: err2.message });
        res.json({ ok: true });
      });
    } else {
      db.run('INSERT INTO user_checklist(user_id, item_id, completed, completed_at) VALUES (?, ?, ?, ?)', [userid, item_id, completed ? 1 : 0, now], function(err2){
        if (err2) return res.status(500).json({ error: err2.message });
        res.json({ ok: true, id: this.lastID });
      });
    }
  });
});

/* ---------- ADMIN endpoints ---------- */
// list users (admin only)
app.get('/api/v1/admin/users', authMiddleware, adminMiddleware, (req, res) => {
  db.all('SELECT id, email, name, age_group, role, created_at FROM users ORDER BY created_at DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// delete user by id (admin only)
app.delete('/api/v1/admin/users/:id', authMiddleware, adminMiddleware, (req, res) => {
  const uid = req.params.id;
  db.run('DELETE FROM users WHERE id = ?', [uid], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    // cascade deletes for sqlite if foreign keys enabled - migrations should set PRAGMA foreign_keys=ON
    res.json({ ok: true, deleted: this.changes });
  });
});

/* health check */
app.get('/api/v1/ping', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log('Backend listening on port', PORT));
