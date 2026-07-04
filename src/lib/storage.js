// Simple localStorage-backed data layer — no backend database needed (₹0 cost)

const KEYS = {
  companions: 'aic_companions',
  journal: 'aic_journal',
  onboarded: 'aic_onboarded',
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

export function createCompanion({ name, relationship, traits }) {
  const list = getCompanions();
  const companion = {
    id: uid(),
    name,
    relationship,
    traits,
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

export function updateCompanion(id, patch) {
  const list = getCompanions();
  const companion = list.find((c) => c.id === id);
  if (!companion) return;
  Object.assign(companion, patch);
  write(KEYS.companions, list);
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

// ---------- Onboarding flag ----------
export function isOnboarded() {
  return getCompanions().length > 0;
}
