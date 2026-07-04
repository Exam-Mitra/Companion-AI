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

  try {
    const { name, relationship, traits, history, message } = req.body || {};

    const traitText = Array.isArray(traits) && traits.length ? traits.join(', ') : 'warm, gentle, calm';
    const systemPrompt = `You are ${name || 'a companion'}, a caring, emotionally present AI companion.
Your relationship to the user is: ${relationship || 'close friend'}.
Your personality traits: ${traitText}.
Speak warmly and naturally, like a real person who is present with the user.
You can use gentle physical/emotional cues in *asterisks* sparingly (e.g. *soft smile*), similar to roleplay narration, but do not overuse them.
Keep replies conversational, empathetic, and not overly long (2-6 sentences typically).
Never say you are an AI or a language model — stay fully in character as ${name}.
Be supportive, curious about the user's life, and remember details they share within this conversation.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...(Array.isArray(history) ? history : []),
      { role: 'user', content: message },
    ];

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages,
        temperature: 0.9,
        max_tokens: 400,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      res.status(200).json({ reply: null, error: 'upstream_error', detail: errText });
      return;
    }

    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content?.trim();
    res.status(200).json({ reply: reply || null });
  } catch (err) {
    res.status(200).json({ reply: null, error: 'server_error', detail: String(err) });
  }
}
