/**
 * Idempotent seed script that creates admin user and seed data including apps & tutorials.
 */
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const DB_FILE = process.env.DATABASE_FILE || 'onboard.db';
const db = new sqlite3.Database(DB_FILE);

const ADMIN_EMAIL = 'admin@gmail.com';
const ADMIN_PW = 'admin@1234'; // change in production!

const apps = [
  { name: 'Phone', category: 'communication', description: 'Make and receive calls easily' },
  { name: 'Messages', category: 'communication', description: 'Send and receive text messages' },
  { name: 'Camera', category: 'utility', description: 'Take photos and videos' },
  { name: 'Calculator', category: 'utility', description: 'Basic calculator for daily math' },
  { name: 'Contacts', category: 'communication', description: 'Save and manage contacts' },
  { name: 'Maps', category: 'utility', description: 'Find places and directions' },
  { name: 'Health', category: 'health', description: 'Track medications and appointments' },
  { name: 'Weather', category: 'utility', description: 'Check local weather' },
  { name: 'Notes', category: 'productivity', description: 'Create simple notes and reminders' }
];

const tutorials = [
  {
    slug: 'phone-basics',
    title: 'Phone: Make & Receive Calls',
    category: 'communication',
    summary: 'Step-by-step: open phone, dial, answer, end call.',
    steps: [
      { idx: 1, title: 'Open Phone App', content: 'Locate the Phone icon on the home screen and tap once.' },
      { idx: 2, title: 'Dial a Number', content: 'Tap "Keypad", enter the digits, then press the green Call button.' },
      { idx: 3, title: 'Answer a Call', content: 'Swipe or press the answer button when phone rings.' },
      { idx: 4, title: 'End a Call', content: 'Tap the red End button to finish the call.' },
      { idx: 5, title: 'Use Speaker', content: 'During a call, tap Speaker to use loudspeaker.' }
    ]
  },
  {
    slug: 'messages-basics',
    title: 'Messages: Send & Read Texts',
    category: 'communication',
    summary: 'Compose, send and read text messages.',
    steps: [
      { idx: 1, title: 'Open Messages', content: 'Tap the Messages icon.' },
      { idx: 2, title: 'Compose', content: 'Tap New message, select contact or type number, write message, press Send.' },
      { idx: 3, title: 'Read', content: 'Open a conversation to read messages.' },
      { idx: 4, title: 'Reply & Attach', content: 'Type reply and attach photo if needed.' }
    ]
  },
  {
    slug: 'camera-basics',
    title: 'Camera: Take Photos & Videos',
    category: 'utility',
    summary: 'Open camera, focus, take photos, switch to video.',
    steps: [
      { idx: 1, title: 'Open Camera App', content: 'Tap the Camera icon.' },
      { idx: 2, title: 'Frame the Shot', content: 'Hold steady and center the subject.' },
      { idx: 3, title: 'Take Photo', content: 'Tap the shutter button.' },
      { idx: 4, title: 'Record Video', content: 'Swipe to Video and press Record.' }
    ]
  },
  {
    slug: 'calculator-basics',
    title: 'Calculator: Basic Arithmetic',
    category: 'utility',
    summary: 'Use the calculator for everyday math.',
    steps: [
      { idx: 1, title: 'Open Calculator', content: 'Tap the Calculator icon.' },
      { idx: 2, title: 'Enter Numbers', content: 'Tap number buttons.' },
      { idx: 3, title: 'Compute', content: 'Use + - × ÷ then =.' },
      { idx: 4, title: 'Copy Result', content: 'Long-press to copy result.' }
    ]
  },
  {
    slug: 'contacts-basics',
    title: 'Contacts: Save & Call a Person',
    category: 'communication',
    summary: 'Create a contact, save phone number, call contact.',
    steps: [
      { idx: 1, title: 'Open Contacts', content: 'Tap Contacts.' },
      { idx: 2, title: 'Add Contact', content: 'Press Add, enter name & number, Save.' },
      { idx: 3, title: 'Call Contact', content: 'Open contact and press Call.' }
    ]
  },
  {
    slug: 'maps-basics',
    title: 'Maps: Find a Place',
    category: 'utility',
    summary: 'Search for a place and get directions.',
    steps: [
      { idx: 1, title: 'Open Maps', content: 'Tap Maps app.' },
      { idx: 2, title: 'Search', content: 'Type a place name in search and select result.' },
      { idx: 3, title: 'Directions', content: 'Tap Directions and choose driving or walking.' }
    ]
  },
  {
    slug: 'notes-basics',
    title: 'Notes: Create & Save Reminders',
    category: 'productivity',
    summary: 'Create short notes and reminders.',
    steps: [
      { idx: 1, title: 'Open Notes', content: 'Tap Notes app.' },
      { idx: 2, title: 'New Note', content: 'Tap + to create a new note, type and Save.' },
      { idx: 3, title: 'Set Reminder', content: 'If supported, set a reminder time.' }
    ]
  }
];

const checklistItems = [
  { key: 'emergency_contact', title: 'Add Emergency Contact', description: 'Store a trusted contact that can be reached in an emergency', importance: 5 },
  { key: 'display_settings', title: 'Optimize Display Settings', description: 'Increase text size and brightness for readability', importance: 4 },
  { key: 'security_lock', title: 'Enable Security Lock', description: 'Set a PIN or biometrics to protect the device', importance: 4 },
  { key: 'backup', title: 'Enable Backup', description: 'Turn on device backup to save contacts and photos', importance: 3 }
];

function run() {
  db.serialize(() => {
    // apps
    const appStmt = db.prepare(`INSERT OR IGNORE INTO apps(name, category, description, android_url, ios_url, safe_score, verified)
      VALUES (?, ?, ?, ?, ?, ?, ?)`);
    apps.forEach(a => appStmt.run(a.name, a.category, a.description, '', '', 90, 1));
    appStmt.finalize();

    // tutorials
    const tutStmt = db.prepare(`INSERT OR IGNORE INTO tutorials(slug, title, summary, difficulty, category, order_index)
      VALUES (?, ?, ?, ?, ?, ?)`);
    tutorials.forEach((t, i) => tutStmt.run(t.slug, t.title, t.summary, 'basic', t.category, i+1));
    tutStmt.finalize();

    // tutorial steps - insert only if none exist
    db.each('SELECT id, slug FROM tutorials', (err, row) => {
      if (err) return console.error(err);
      db.get('SELECT COUNT(1) as cnt FROM tutorial_steps WHERE tutorial_id = ?', [row.id], (err2, cntRow) => {
        if (err2) return console.error(err2);
        if (!cntRow || cntRow.cnt === 0) {
          const tinfo = tutorials.find(tt => tt.slug === row.slug);
          if (tinfo && tinfo.steps) {
            const pst = db.prepare('INSERT INTO tutorial_steps(tutorial_id, step_index, title, content, media_url, is_checkable) VALUES (?, ?, ?, ?, ?, ?)');
            tinfo.steps.forEach(s => pst.run(row.id, s.idx, s.title, s.content, '', 0));
            pst.finalize();
            console.log('Inserted steps for', row.slug);
          }
        } else {
          console.log('Steps exist for', row.slug);
        }
      });
    });

    // checklist
    const clStmt = db.prepare('INSERT OR IGNORE INTO checklist_items(key, title, description, importance) VALUES (?, ?, ?, ?)');
    checklistItems.forEach(c => clStmt.run(c.key, c.title, c.description, c.importance));
    clStmt.finalize();

    // admin user - create if not exists, hash password
    db.get('SELECT id FROM users WHERE email = ?', [ADMIN_EMAIL], async (err, row) => {
      if (err) return console.error(err);
      if (row) {
        console.log('Admin already exists');
        return;
      }
      const hash = await bcrypt.hash(ADMIN_PW, 10);
      db.run('INSERT INTO users(email, password_hash, name, role) VALUES (?, ?, ?, ?)', [ADMIN_EMAIL, hash, 'Administrator', 'admin'], function(err2) {
        if (err2) return console.error('Error creating admin:', err2);
        console.log('Admin user created with email:', ADMIN_EMAIL);
      });
    });

    console.log('Seeding complete.');
    setTimeout(() => db.close(), 200);
  });
}

run();
