import { uid, STATUS_MIGRATE, cyclePastDeadlines } from './utils.js';
import { DEFAULT_DATA, DEFAULT_CATS } from './defaultData.js';

const STORAGE_KEY = 'compfinder_v1';
const CATS_KEY    = 'compfinder_cats_v1';
const FILTERS_KEY = 'compfinder_filters_v1';
const FOCUS_KEY   = 'compfinder_focus_v1';
const THEME_KEY   = 'compfinder_theme_v1';

const IDB_NAME     = 'compfinder_idb';
const IDB_STORE    = 'handles';
const IDB_DATA_KEY = 'data';

// ── IDB ─────────────────────────────────────────────────────────────────────

function idbOpen() {
  return new Promise((res, rej) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = e => e.target.result.createObjectStore(IDB_STORE);
    req.onsuccess = e => res(e.target.result);
    req.onerror   = () => rej();
  });
}

async function idbGet(key) {
  try {
    const db = await idbOpen();
    return new Promise(res => {
      const req = db.transaction(IDB_STORE, 'readonly').objectStore(IDB_STORE).get(key);
      req.onsuccess = e => res(e.target.result || null);
      req.onerror   = () => res(null);
    });
  } catch { return null; }
}

async function idbSet(key, val) {
  try {
    const db = await idbOpen();
    return new Promise(res => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).put(val, key);
      tx.oncomplete = res;
      tx.onerror    = res;
    });
  } catch {}
}

// ── ENTRIES ──────────────────────────────────────────────────────────────────

function migrateEntry(e) {
  if (STATUS_MIGRATE[e.status]) e.status = STATUS_MIGRATE[e.status];
  if (!e.type) e.type = 'Competition';
  return e;
}

export function loadEntries() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      return data.map(migrateEntry);
    }
  } catch {}
  const data = DEFAULT_DATA.map(d => ({ ...d, id: uid(), checklist: [] }));
  persistEntries(data, loadCategories());
  return data;
}

export function persistEntries(entries, categories) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  idbSet(IDB_DATA_KEY, JSON.stringify({ entries, categories }));
}

// ── CATEGORIES ───────────────────────────────────────────────────────────────

export function loadCategories() {
  try {
    const raw = localStorage.getItem(CATS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  const cats = [...DEFAULT_CATS];
  persistCategories(cats);
  return cats;
}

export function persistCategories(cats) {
  localStorage.setItem(CATS_KEY, JSON.stringify(cats));
}

// ── FILTERS ──────────────────────────────────────────────────────────────────

export function loadFilters() {
  try {
    const raw = localStorage.getItem(FILTERS_KEY);
    if (!raw) return null;
    const f = JSON.parse(raw);
    return {
      type: f.type || '__all__',
      cats: new Set(Array.isArray(f.cats) && f.cats.length ? f.cats : ['__all__']),
    };
  } catch { return null; }
}

export function saveFilters(type, cats) {
  try {
    localStorage.setItem(FILTERS_KEY, JSON.stringify({ type, cats: [...cats] }));
  } catch {}
}

// ── FOCUS PANEL ──────────────────────────────────────────────────────────────

export function loadFocusCollapsed() {
  return localStorage.getItem(FOCUS_KEY) === '1';
}

export function saveFocusCollapsed(val) {
  try { localStorage.setItem(FOCUS_KEY, val ? '1' : '0'); } catch {}
}

// ── THEME ────────────────────────────────────────────────────────────────────

export function loadTheme() {
  return localStorage.getItem(THEME_KEY) || 'light';
}

export function saveTheme(theme) {
  try { localStorage.setItem(THEME_KEY, theme); } catch {}
}

// ── IDB RESTORE ──────────────────────────────────────────────────────────────

export async function tryRestoreFromIDB() {
  if (localStorage.getItem(STORAGE_KEY)) return null;
  const raw = await idbGet(IDB_DATA_KEY);
  if (!raw) return null;
  try {
    const data = JSON.parse(raw);
    const restored = Array.isArray(data) ? data : (data.entries || []);
    if (!restored.length) return null;
    const entries = restored.map(migrateEntry);
    const categories = (!Array.isArray(data) && data.categories) ? data.categories : [...DEFAULT_CATS];
    const { entries: cycled } = cyclePastDeadlines(entries);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cycled));
    persistCategories(categories);
    return { entries: cycled, categories, restored: true };
  } catch { return null; }
}
