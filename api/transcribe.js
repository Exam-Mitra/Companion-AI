// Vercel serverless function — free tier.
// Transcribes a voice message to text using Groq's free Whisper API.
// The client records audio, base64-encodes it, and posts it here.
// We forward it to Groq as multipart/form-data and return the transcribed text.

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    res.status(200).json({ text: null, error: 'no_api_key' });
    return;
  }

  try {
    const { audioBase64, mimeType } = req.body || {};
    if (!audioBase64) {
      res.status(400).json({ text: null, error: 'no_audio' });
      return;
    }

    const commaIdx = audioBase64.indexOf(',');
    const base64Data = commaIdx >= 0 ? audioBase64.slice(commaIdx + 1) : audioBase64;
    const buffer = Buffer.from(base64Data, 'base64');

    const ext = (mimeType || 'audio/webm').includes('mp4') ? 'mp4' : 'webm';
    const blob = new Blob([buffer], { type: mimeType || 'audio/webm' });

    const form = new FormData();
    form.append('file', blob, `voice-message.${ext}`);
    form.append('model', 'whisper-large-v3-turbo');
    form.append('response_format', 'json');

    const groqRes = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      res.status(200).json({ text: null, error: 'upstream_error', detail: errText });
      return;
    }

    const data = await groqRes.json();
    res.status(200).json({ text: data.text || null });
  } catch (err) {
    res.status(200).json({ text: null, error: 'server_error', detail: String(err) });
  }
}
