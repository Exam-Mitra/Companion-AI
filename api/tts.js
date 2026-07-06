// Vercel serverless function — free tier.
// Converts a companion's reply text into realistic speech using ElevenLabs' free tier
// (10,000 characters/month, no credit card). Falls back gracefully — the client will use
// the browser's built-in voice if this isn't configured or the quota runs out.
//
// Setup (one-time, free):
//   1. Sign up free at https://elevenlabs.io (no card needed)
//   2. Go to the Voice Library, search for an Indian female voice you like
//      (e.g. "Anvi", "Aarohi", "Sumi" are warm/romantic-toned voices), click it, and
//      copy its Voice ID from the voice's page (or "My Voices" after adding it).
//   3. Go to your ElevenLabs profile -> API Keys -> create a key.
//   4. In Vercel -> Project Settings -> Environment Variables, add:
//        ELEVENLABS_API_KEY = your key
//        ELEVENLABS_VOICE_ID = the voice id you copied
//
// Until both env vars are set, this endpoint returns { audio: null } and the app
// automatically falls back to the free browser voice — nothing breaks.

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

    // Keep well within the free 10k characters/month budget per request.
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
