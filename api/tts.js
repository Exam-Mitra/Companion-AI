// Vercel serverless function — free tier.
// Converts a companion's reply text into realistic speech using ElevenLabs' free tier
// (10,000 characters/month, no credit card). Falls back gracefully — the client will use
// the browser's built-in voice if this isn't configured or the quota runs out.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID;

  if (!apiKey || !voiceId) {
    res.status(200).json({ audio: null, error: 'not_configured' });
    return;
  }

  try {
    const { text } = req.body || {};
    const clean = (text || '').replace(/\*[^*]*\*/g, '').trim();
    if (!clean) {
      res.status(200).json({ audio: null, error: 'empty_text' });
      return;
    }

    const trimmed = clean.slice(0, 600);

    const elevenRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify({
        text: trimmed,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.45,
          similarity_boost: 0.8,
          style: 0.6,
          use_speaker_boost: true,
        },
      }),
    });

    if (!elevenRes.ok) {
      const errText = await elevenRes.text();
      res.status(200).json({ audio: null, error: 'upstream_error', detail: errText });
      return;
    }

    const arrayBuffer = await elevenRes.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    res.status(200).json({ audio: `data:audio/mpeg;base64,${base64}` });
  } catch (err) {
    res.status(200).json({ audio: null, error: 'server_error', detail: String(err) });
  }
}
