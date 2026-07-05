// Cross-session memory: every few messages, ask the AI to condense the conversation
// into a short running summary, stored per-companion. This is included in the system
// prompt on future chats so the companion "remembers" you across sessions — all without
// needing a database (it's just a text field stored alongside the companion in localStorage).

import { getCompanion, updateMemory } from './storage.js';

const SUMMARY_INTERVAL = 6; // summarize roughly every 6 user+assistant messages

export async function maybeUpdateMemory(companionId) {
  try {
    const companion = getCompanion(companionId);
    if (!companion || !navigator.onLine) return;

    const messages = companion.messages || [];
    if (messages.length < SUMMARY_INTERVAL) return;
    if (messages.length % SUMMARY_INTERVAL !== 0) return;

    const recent = messages.slice(-SUMMARY_INTERVAL).map((m) => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.text,
    }));

    const res = await fetch('/api/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        existingMemory: companion.memory || '',
        recentMessages: recent,
      }),
    });
    if (!res.ok) return;
    const data = await res.json();
    if (data && data.memory) {
      updateMemory(companionId, data.memory);
    }
  } catch {
    // Silent failure — memory is a nice-to-have, never block the chat experience.
  }
}
