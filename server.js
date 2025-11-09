const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
const morgan = require('morgan');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');

// ensure data directory exists
if (!fsSync.existsSync(DATA_DIR)) {
  fsSync.mkdirSync(DATA_DIR, { recursive: true });
}

app.use(morgan('tiny'));
app.use(cors());
app.use(express.json({ limit: '2mb' }));

// Serve static client (public/)
app.use(express.static(path.join(__dirname, 'public')));

// Helper: safe filename for date (YYYY-MM-DD)
function dataPathFor(date) {
  // minimum validation: allow 4-digit year and digits/hyphens
  const safe = String(date).match(/^\d{4}-\d{2}-\d{2}$/) ? date : null;
  if (!safe) throw new Error('Invalid date format');
  return path.join(DATA_DIR, `${safe}.json`);
}

// GET single day's data
app.get('/api/data/:date', async (req, res) => {
  const { date } = req.params;
  try {
    const file = dataPathFor(date);
    if (!fsSync.existsSync(file)) return res.status(404).json({ message: 'Not found' });
    const raw = await fs.readFile(file, 'utf8');
    const parsed = JSON.parse(raw);
    return res.json(parsed);
  } catch (err) {
    console.error('GET /api/data/:date error', err);
    return res.status(400).json({ message: 'Bad request' });
  }
});

// POST save day's data
app.post('/api/data/:date', async (req, res) => {
  const { date } = req.params;
  const payload = req.body;
  try {
    const file = dataPathFor(date);
    const tmp = `${file}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(payload, null, 2), 'utf8');
    await fs.rename(tmp, file); // atomic replacement
    return res.json({ ok: true });
  } catch (err) {
    console.error('POST /api/data/:date error', err);
    return res.status(400).json({ message: 'Save failed' });
  }
});

// List saved dates
app.get('/api/dates', async (_req, res) => {
  try {
    const names = await fs.readdir(DATA_DIR);
    const dates = names
      .filter(n => n.endsWith('.json'))
      .map(n => n.replace('.json', ''));
    return res.json({ dates });
  } catch (err) {
    console.error('GET /api/dates error', err);
    return res.status(500).json({ message: 'Failed' });
  }
});

// Export single date as attachment
app.get('/api/export/:date', async (req, res) => {
  const { date } = req.params;
  try {
    const file = dataPathFor(date);
    if (!fsSync.existsSync(file)) return res.status(404).send('Not found');
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="timebox_${date}.json"`);
    return res.sendFile(file);
  } catch (err) {
    console.error('GET /api/export/:date error', err);
    return res.status(400).send('Bad request');
  }
});

// Export all saved data as one JSON file
app.get('/api/export-all', async (_req, res) => {
  try {
    const names = await fs.readdir(DATA_DIR);
    const all = {};
    for (const name of names) {
      if (!name.endsWith('.json')) continue;
      const date = name.replace('.json', '');
      const raw = await fs.readFile(path.join(DATA_DIR, name), 'utf8');
      try {
        all[date] = JSON.parse(raw);
      } catch (e) {
        all[date] = raw;
      }
    }
    const content = JSON.stringify(all, null, 2);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="timebox_all_saved.json"`);
    return res.send(content);
  } catch (err) {
    console.error('GET /api/export-all error', err);
    return res.status(500).send('Failed');
  }
});

// Fallback: serve index.html for SPA routes (optional)
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});