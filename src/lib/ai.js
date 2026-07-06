// Talks to our serverless /api/chat endpoint (Groq, free tier) when deployed.
// Falls back to a lightweight local responder so the app still works
// during local development, offline, or if the API key hasn't been configured yet.

function localFallback({ name, relationship, traits }, history, userText) {
  const t = (userText || '').toLowerCase();
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

// Non-streaming call (used as a fallback if streaming isn't supported/fails).
export async function getCompanionReply(companion, history, userText, opts = {}) {
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: companion.name,
        relationship: companion.relationship,
        traits: companion.traits,
        memory: companion.memory,
        history: history.slice(-12).map((m) => ({ role: m.role, content: m.text })),
        message: userText,
        stream: false,
        ...opts,
      }),
    });
    if (!res.ok) throw new Error('bad response');
    const data = await res.json();
    if (data && data.reply) return data.reply;
    throw new Error('no reply');
  } catch (e) {
    return localFallback(companion, history, userText);
  }
}

// Streaming call — invokes onToken(chunk) as text arrives, resolves with the full text at the end.
// If streaming fails for any reason (network, older backend, etc.), it transparently falls back
// to the non-streaming call (and finally to the local offline responder).
export async function streamCompanionReply(companion, history, userText, { onToken, imageBase64 } = {}) {
  if (!navigator.onLine) {
    const text = localFallback(companion, history, userText);
    if (onToken) onToken(text);
    return text;
  }

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: companion.name,
        relationship: companion.relationship,
        traits: companion.traits,
        memory: companion.memory,
        history: history.slice(-12).map((m) => ({ role: m.role, content: m.text })),
        message: userText,
        stream: true,
        imageBase64,
      }),
    });

    if (!res.ok || !res.body) throw new Error('bad response');

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;
        const payload = trimmed.slice(5).trim();
        if (payload === '[DONE]') continue;
        try {
          const json = JSON.parse(payload);
          if (json.error) throw new Error(json.error);
          if (typeof json.token === 'string') {
            fullText += json.token;
            if (onToken) onToken(fullText);
          }
        } catch {
          // ignore malformed partial lines
        }
      }
    }

    if (!fullText.trim()) throw new Error('empty stream');
    return fullText;
  } catch (e) {
    // Streaming failed — fall back to a normal request, then to the offline responder.
    const text = await getCompanionReply(companion, history, userText, { imageBase64 });
    if (onToken) onToken(text);
    return text;
  }
}

// Browser-native, 100% free text-to-speech (no API key, no cost). Used automatically
// as a fallback if the realistic ElevenLabs voice (below) isn't configured or fails.
export function getAvailableVoices() {
  if (!('speechSynthesis' in window)) return [];
  return window.speechSynthesis.getVoices();
}

function speakWithBrowserVoice(text, voiceName) {
  if (!('speechSynthesis' in window)) return;
  const clean = text.replace(/\*[^*]*\*/g, '').trim();
  if (!clean) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(clean);
  utter.rate = 0.98;
  utter.pitch = 1.05;
  const voices = window.speechSynthesis.getVoices();
  let preferred = null;
  if (voiceName) preferred = voices.find((v) => v.name === voiceName);
  if (!preferred) preferred = voices.find((v) => /female|samantha|victoria|zira/i.test(v.name)) || voices[0];
  if (preferred) utter.voice = preferred;
  window.speechSynthesis.speak(utter);
}

let currentRealisticAudio = null;

// Tries a realistic Indian voice via ElevenLabs (server-side, free tier) first.
// Automatically falls back to the browser's built-in voice if that's not configured,
// the quota is exhausted, or the request fails for any reason — the app never breaks.
export async function speak(text, voiceName) {
  const clean = (text || '').replace(/\*[^*]*\*/g, '').trim();
  if (!clean) return;

  // Stop anything currently playing.
  if (currentRealisticAudio) {
    currentRealisticAudio.pause();
    currentRealisticAudio = null;
  }
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();

  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: clean }),
    });
    if (!res.ok) throw new Error('bad response');
    const data = await res.json();
    if (data && data.audio) {
      currentRealisticAudio = new Audio(data.audio);
      await currentRealisticAudio.play();
      return;
    }
    throw new Error('no audio');
  } catch (e) {
    // Realistic voice unavailable — use the free browser voice instead.
    speakWithBrowserVoice(clean, voiceName);
  }
}
