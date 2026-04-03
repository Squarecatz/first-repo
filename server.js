import express from 'express';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app  = express();
const PORT = process.env.PORT || 3000;

// ── Storage ──
// In-memory (data er væk ved genstart).
// Skift til SQLite eller en fil for persistens.
const store = new Map(); // ip → { text, updatedAt }

// Brug env-variabel til at vælge persistent fillagring
const USE_FILE = process.env.USE_FILE === 'true';
const DATA_FILE = join(__dirname, 'data.json');

function loadData() {
  if (!USE_FILE || !existsSync(DATA_FILE)) return;
  try {
    const raw = readFileSync(DATA_FILE, 'utf-8');
    const obj = JSON.parse(raw);
    for (const [k, v] of Object.entries(obj)) store.set(k, v);
    console.log(`Indlæst ${store.size} board(s) fra disk.`);
  } catch (e) {
    console.warn('Kunne ikke indlæse data.json:', e.message);
  }
}

function saveData() {
  if (!USE_FILE) return;
  try {
    const obj = Object.fromEntries(store);
    writeFileSync(DATA_FILE, JSON.stringify(obj, null, 2));
  } catch (e) {
    console.warn('Kunne ikke gemme data.json:', e.message);
  }
}

// Ryd gamle boards (ældre end 24 timer) hvert 10. minut
setInterval(() => {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  let removed = 0;
  for (const [ip, entry] of store) {
    if (entry.updatedAt < cutoff) { store.delete(ip); removed++; }
  }
  if (removed > 0) { console.log(`Ryddede ${removed} udløbne board(s).`); saveData(); }
}, 10 * 60 * 1000);

// ── Middleware ──
app.use(express.json({ limit: '1mb' }));
app.use(express.static(__dirname));

// Hent klientens IP – virker bag proxies (Render, Railway, Heroku)
function getIP(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.socket.remoteAddress || 'unknown';
}

// Anonymiser IP til visning (gem kun de første 3 oktetter)
function maskIP(ip) {
  if (ip === 'unknown') return ip;
  if (ip === '::1' || ip === '127.0.0.1') return 'localhost';
  const parts = ip.replace('::ffff:', '').split('.');
  if (parts.length === 4) return parts.slice(0, 3).join('.') + '.xxx';
  return ip.slice(0, 8) + '…';
}

// ── Routes ──

// GET /api/clipboard  — hent board for denne IP
app.get('/api/clipboard', (req, res) => {
  const ip    = getIP(req);
  const entry = store.get(ip) || { text: '', updatedAt: null };
  res.json({ text: entry.text, updatedAt: entry.updatedAt, ip: maskIP(ip) });
});

// POST /api/clipboard  — gem board for denne IP
app.post('/api/clipboard', (req, res) => {
  const ip   = getIP(req);
  const text = typeof req.body.text === 'string' ? req.body.text.slice(0, 100_000) : '';
  const entry = { text, updatedAt: Date.now() };
  store.set(ip, entry);
  saveData();
  res.json({ ok: true, updatedAt: entry.updatedAt, ip: maskIP(ip) });
});

// ── Start ──
loadData();
app.listen(PORT, () => {
  console.log(`copyboard kører på http://localhost:${PORT}`);
  console.log(`Fillagring: ${USE_FILE ? 'aktiveret (data.json)' : 'deaktiveret (kun memory)'}`);
});
