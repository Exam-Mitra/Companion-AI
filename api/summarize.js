// Vercel serverless function — free tier.
// Condenses recent conversation into a short running memory summary for a companion.
// Uses the same free Groq API key as /api/chat.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    res.status(200).json({ memory: null, error: 'no_api_key' });
    return;
  }

  try {
    const { existingMemory, recentMessages } = req.body || {};

    const convoText = (Array.isArray(recentMessages) ? recentMessages : [])
      .map((m) => `${m.role === 'user' ? 'User' : 'Companion'}: ${m.content}`)
      .join('\n');

    const prompt = `You maintain a short-term memory profile of a user, based on their conversation with an AI companion.

Existing memory (may be empty):
"""
${existingMemory || '(none yet)'}
"""

New conversation excerpt:
"""
${convoText}
"""

Update the memory into a concise bullet-point-free paragraph (max 80 words) capturing important, durable facts about the user: their name if mentioned, interests, ongoing situations, feelings, preferences, or recurring topics. Do not include one-off small talk. Do not repeat the raw conversation. Write only the updated memory paragraph, nothing else.`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-20b',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.4,
        max_tokens: 200,
        reasoning_effort: 'low',
      }),
    });

    if (!response.ok) {
      res.status(200).json({ memory: null, error: 'upstream_error' });
      return;
    }

    const data = await response.json();
    const memory = data?.choices?.[0]?.message?.content?.trim();
    res.status(200).json({ memory: memory || null });
  } catch (err) {
    res.status(200).json({ memory: null, error: 'server_error', detail: String(err) });
  }
}
