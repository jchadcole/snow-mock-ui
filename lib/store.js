'use strict';
// Saved taxpayers: contacts added in the workspace (New contact, POST /api/taxpayers, or Import) are kept here,
// so they come back after a restart, a redeploy, the daily reseed and Reset demo data.
//   1. data/custom-taxpayers.json in the repo is read at start (commit an export there to make taxpayers permanent).
//   2. $DATA_DIR/saved-taxpayers.json (default ./data) is read and written as taxpayers change. On Render, point
//      DATA_DIR at a persistent disk to keep it across deploys; on the free plan this file lasts until the next restart.
//   3. The browser also keeps a copy and sends back any the server is missing (see public/js/app.js), so the free plan
//      works without a disk.

const fs = require('fs');
const path = require('path');

const REPO_FILE = path.join(__dirname, '..', 'data', 'custom-taxpayers.json');
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const FILE = path.join(DATA_DIR, 'saved-taxpayers.json');

const read = (f) => { try { const j = JSON.parse(fs.readFileSync(f, 'utf8')); return Array.isArray(j) ? j : (j.taxpayers || []); } catch { return []; } };
let saved = null;

function load() {
  if (saved) return saved;
  const byId = new Map();
  for (const t of [...read(REPO_FILE), ...read(FILE)]) if (t && t.id) byId.set(t.id, t);
  saved = [...byId.values()];
  return saved;
}
function persist() {
  try { fs.mkdirSync(DATA_DIR, { recursive: true }); fs.writeFileSync(FILE, JSON.stringify({ savedAt: new Date().toISOString(), taxpayers: saved }, null, 2)); return true; }
  catch (e) { console.error('Could not save taxpayers:', e.message); return false; }
}
// Keep the profile, not the call-by-call history (activities stay in the session's demo data).
const profile = (t) => { const { activities, ...rest } = t; return JSON.parse(JSON.stringify({ ...rest, activities: [], custom: true })); };
function upsert(t) { load(); const p = profile(t); const i = saved.findIndex((x) => x.id === t.id); if (i >= 0) saved[i] = p; else saved.push(p); persist(); return p; }
function remove(id) { load(); const n = saved.length; saved = saved.filter((x) => x.id !== id); if (saved.length !== n) persist(); return saved.length !== n; }
const all = () => load().map((t) => JSON.parse(JSON.stringify(t)));

// Demo text: per-demo overrides of brand.ui (Settings > Demo text, or PUT /api/ui-text). Kept like saved taxpayers:
// data/demo-text.json in the repo (commit an export there to make it permanent) and $DATA_DIR/ui-text.json as it changes.
const UI_REPO = path.join(__dirname, '..', 'data', 'demo-text.json');
const UI_FILE = path.join(DATA_DIR, 'ui-text.json');
const readObj = (f) => { try { const j = JSON.parse(fs.readFileSync(f, 'utf8')); return j && typeof j.ui === 'object' ? j.ui : {}; } catch { return {}; } };
let uiText = null;
function getUi() { if (!uiText) uiText = Object.keys(readObj(UI_FILE)).length ? readObj(UI_FILE) : readObj(UI_REPO); return JSON.parse(JSON.stringify(uiText)); }
function setUi(ui) {
  uiText = ui && typeof ui === 'object' ? JSON.parse(JSON.stringify(ui)) : {};
  try { fs.mkdirSync(DATA_DIR, { recursive: true }); fs.writeFileSync(UI_FILE, JSON.stringify({ savedAt: new Date().toISOString(), ui: uiText }, null, 2)); } catch (e) { console.error('Could not save demo text:', e.message); }
  return getUi();
}
const storeInfo = () => ({ file: FILE, dataDir: DATA_DIR, persistentDisk: !!process.env.DATA_DIR, count: load().length });

module.exports = { all, upsert, remove, storeInfo, getUi, setUi };
