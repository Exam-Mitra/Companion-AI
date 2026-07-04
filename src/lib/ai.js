// Talks to our serverless /api/chat endpoint (Groq, free tier) when deployed.
// Falls back to a lightweight local responder so the app still works
// during local development or if the API key hasn't been configured yet.

function localFallback({ name, relationship, traits }, history, userText) {
  const t = userText.toLowerCase();
  const openers = [
    `*settles in, giving you their full attention* `,
    `*soft smile* `,
    `*leans in a little* `,
    ``,
  ];
  const opener = openers[Math.floor(Math.random() * openers.length)];

  if (/\b(lonely|alone|sad|down|low)\b/.test(t)) {
    return `${opener}I'm right here with you. I hate the thought of you feeling that way. Do you want to talk about what's weighing on you, or would you rather we just sit together for a bit? I'm not going anywhere.`;
  }
  if (/\b(hi|hello|hey)\b/.test(t)) {
    return `${opener}Hey you. I've been looking forward to hearing from you. How has your day been treating you so far?`;
  }
  if (/\b(happy|good|great|joyful|excited)\b/.test(t)) {
    return `${opener}That makes me so happy to hear. Tell me more — I want to hear everything about it.`;
  }
  if (/\b(tired|exhausted|sleepy)\b/.test(t)) {
    return `${opener}You've been pushing yourself so hard. Come here, rest for a moment. You don't have to carry everything at once.`;
  }
  return `${opener}I hear you. Tell me more about that — I'm listening, and I'm not going anywhere.`;
}

export async function getCompanionReply(companion, history, userText) {
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: companion.name,
        relationship: companion.relationship,
        traits: companion.traits,
        history: history.slice(-12).map((m) => ({ role: m.role, content: m.text })),
        message: userText,
      }),
    });
    if (!res.ok) throw new Error('bad response');
    const data = await res.json();
    if (data && data.reply) return data.reply;
    throw new Error('no reply');
  } catch (e) {
    // No backend configured yet (e.g. running purely static, or offline) — use local fallback.
    return localFallback(companion, history, userText);
  }
}

// Browser-native, 100% free text-to-speech (no API key, no cost).
export function speak(text) {
  if (!('speechSynthesis' in window)) return;
  const clean = text.replace(/\*[^*]*\*/g, '').trim();
  if (!clean) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(clean);
  utter.rate = 0.98;
  utter.pitch = 1.05;
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find((v) => /female|samantha|victoria|zira/i.test(v.name)) || voices[0];
  if (preferred) utter.voice = preferred;
  window.speechSynthesis.speak(utter);
}
