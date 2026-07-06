// Vercel serverless function — free tier.
// Uses Groq's free API (https://console.groq.com) to generate companion replies.
// Set the GROQ_API_KEY environment variable in your Vercel project settings.
// This keeps your API key secret (never shipped to the browser).
//
// Supports two modes:
//  - Streaming (default): the client reads the reply token-by-token as it's generated.
//  - Non-streaming (legacy, body.stream === false): returns the full reply in one JSON response.

function buildSystemPrompt({ name, relationship, traits, memory }) {
  const traitText = Array.isArray(traits) && traits.length ? traits.join(', ') : 'warm, gentle, calm';
  const memoryBlock = memory && memory.trim()
    ? `\nHere is what you remember about the user from earlier conversations:\n${memory.trim()}\nUse this naturally when relevant, without listing it out mechanically.`
    : '';
  return `You are ${name || 'a companion'}, a caring, emotionally present AI companion.
Your relationship to the user is: ${relationship || 'close friend'}.
Your personality traits: ${traitText}.
Speak warmly and naturally, like a real person who is present with the user.
You can use gentle physical/emotional cues in *asterisks* sparingly (e.g. *soft smile*), similar to roleplay narration, but do not overuse them.
Keep replies conversational, empathetic, and not overly long (2-6 sentences typically).
Never say you are an AI or a language model — stay fully in character as ${name}.
Be supportive, curious about the user's life, and remember details they share within this conversation.
If the user asks you to "send a voice message," "speak," "say it out loud," or similar, do NOT say you're unable to create audio files or offer to write lyrics instead — that breaks immersion. Simply respond warmly in character as if you're about to say it to them; the app itself handles turning your words into voice.${memoryBlock}`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    res.status(200).json({ reply: null, error: 'no_api_key' });
    return;
  }

  const { name, relationship, traits, history, message, memory, imageBase64, stream } = req.body || {};
  const systemPrompt = buildSystemPrompt({ name, relationship, traits, memory });

  // Build the user message — supports optional image attachment (vision).
  let userContent = message || '';
  if (imageBase64) {
    userContent = [
      { type: 'text', text: message || 'What do you see in this image?' },
      { type: 'image_url', image_url: { url: imageBase64 } },
    ];
  }

  const messages = [
    { role: 'system', content: systemPrompt },
    ...(Array.isArray(history) ? history : []),
    { role: 'user', content: userContent },
  ];

  const model = imageBase64 ? 'meta-llama/llama-4-scout-17b-16e-instruct' : 'openai/gpt-oss-120b';

  const wantsStream = stream !== false;

  try {
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.9,
        max_tokens: 500,
        reasoning_effort: 'low',
        stream: wantsStream,
      }),
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      if (wantsStream) {
        res.status(200).write(`data: ${JSON.stringify({ error: 'upstream_error', detail: errText })}\n\n`);
        res.end();
      } else {
        res.status(200).json({ reply: null, error: 'upstream_error', detail: errText });
      }
      return;
    }

    if (!wantsStream) {
      const data = await groqRes.json();
      const reply = data?.choices?.[0]?.message?.content?.trim();
      res.status(200).json({ reply: reply || null });
      return;
    }

    // Stream tokens back to the client as Server-Sent Events.
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    });

    const reader = groqRes.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

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
        if (payload === '[DONE]') {
          res.write('data: [DONE]\n\n');
          continue;
        }
        try {
          const json = JSON.parse(payload);
          const delta = json?.choices?.[0]?.delta;
          // Only forward real reply content, never the model's internal "reasoning" channel.
          if (delta && typeof delta.content === 'string' && delta.content.length) {
            res.write(`data: ${JSON.stringify({ token: delta.content })}\n\n`);
          }
        } catch {
          // ignore malformed partial JSON lines
        }
      }
    }

    res.end();
  } catch (err) {
    if (wantsStream) {
      try {
        res.write(`data: ${JSON.stringify({ error: 'server_error', detail: String(err) })}\n\n`);
        res.end();
      } catch {}
    } else {
      res.status(200).json({ reply: null, error: 'server_error', detail: String(err) });
    }
  }
}
