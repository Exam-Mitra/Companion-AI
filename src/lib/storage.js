// Simple localStorage-backed data layer — no backend database needed (₹0 cost)

const KEYS = {
  companions: 'aic_companions',
  journal: 'aic_journal',
  settings: 'aic_settings',
};

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// ---------- Settings (dark mode, voice preference, notifications) ----------
const DEFAULT_SETTINGS = {
  theme: 'light', // 'light' | 'dark'
  voiceName: null,
  notificationsEnabled: false,
};

export function getSettings() {
  return { ...DEFAULT_SETTINGS, ...read(KEYS.settings, {}) };
}

export function updateSettings(patch) {
  const current = getSettings();
  const next = { ...current, ...patch };
  write(KEYS.settings, next);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('aic:settings-changed', { detail: next }));
  }
  return next;
}

// ---------- Companions ----------
export function getCompanions() {
  return read(KEYS.companions, []);
}

export function getActiveCompanion() {
  const list = getCompanions();
  return list.find((c) => c.active) || list[0] || null;
}

export function getCompanion(id) {
  return getCompanions().find((c) => c.id === id) || null;
}

export function createCompanion({ name, relationship, traits, avatarId }) {
  const list = getCompanions();
  const companion = {
    id: uid(),
    name,
    relationship,
    traits,
    avatarId: avatarId || null,
    memory: '', // short natural-language summary the AI can use across sessions
    active: true,
    createdAt: Date.now(),
    messages: [],
  };
  // deactivate others
  list.forEach((c) => (c.active = false));
  list.push(companion);
  write(KEYS.companions, list);
  return companion;
}

export function setActiveCompanion(id) {
  const list = getCompanions();
  list.forEach((c) => (c.active = c.id === id));
  write(KEYS.companions, list);
}

export function removeCompanion(id) {
  let list = getCompanions().filter((c) => c.id !== id);
  if (list.length && !list.some((c) => c.active)) list[0].active = true;
  write(KEYS.companions, list);
}

export function addMessage(companionId, message) {
  const list = getCompanions();
  const companion = list.find((c) => c.id === companionId);
  if (!companion) return;
  companion.messages.push(message);
  write(KEYS.companions, list);
}

export function updateLastMessage(companionId, text) {
  const list = getCompanions();
  const companion = list.find((c) => c.id === companionId);
  if (!companion || !companion.messages.length) return;
  companion.messages[companion.messages.length - 1].text = text;
  write(KEYS.companions, list);
}

export function updateCompanion(id, patch) {
  const list = getCompanions();
  const companion = list.find((c) => c.id === id);
  if (!companion) return;
  Object.assign(companion, patch);
  write(KEYS.companions, list);
}

// Update the companion's running "memory" — a short summary the AI uses across sessions.
export function updateMemory(id, memoryText) {
  updateCompanion(id, { memory: memoryText });
}

// ---------- Journal ----------
export function getJournalEntries() {
  return read(KEYS.journal, []).sort((a, b) => b.date - a.date);
}

export function addJournalEntry({ mood, note }) {
  const list = read(KEYS.journal, []);
  const entry = { id: uid(), mood, note, date: Date.now() };
  list.push(entry);
  write(KEYS.journal, list);
  return entry;
}

function isSameDay(a, b) {
  const da = new Date(a);
  const db = new Date(b);
  return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate();
}

// Current consecutive-day journaling streak, counting back from today (or yesterday if
// today hasn't been logged yet, so the streak doesn't reset the moment the clock ticks over).
export function getJournalStreak() {
  const entries = getJournalEntries();
  if (!entries.length) return 0;

  const days = [...new Set(entries.map((e) => new Date(e.date).toDateString()))]
    .map((d) => new Date(d).getTime())
    .sort((a, b) => b - a);

  const now = Date.now();
  let streak = 0;
  let cursor = now;

  // If today isn't logged, start checking from yesterday instead.
  if (!isSameDay(days[0], now)) {
    cursor = now - 86400000;
  }

  for (const day of days) {
    if (isSameDay(day, cursor)) {
      streak += 1;
      cursor -= 86400000;
    } else if (day < cursor) {
      break;
    }
  }
  return streak;
}

export function getJournalMoodTrend(days = 7) {
  const entries = getJournalEntries();
  const cutoff = Date.now() - days * 86400000;
  return entries.filter((e) => e.date >= cutoff).reverse();
}

// ---------- Onboarding flag ----------
export function isOnboarded() {
  return getCompanions().length > 0;
}

// ---------- Export / backup ----------
export function exportAllData() {
  return {
    exportedAt: new Date().toISOString(),
    companions: getCompanions(),
    journal: read(KEYS.journal, []),
    settings: getSettings(),
  };
}

export function downloadDataExport() {
  const data = exportAllData();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `fintly-companion-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
