// Voice message recording + transcription (Groq Whisper, free tier).
// Records audio in the browser using MediaRecorder, then sends it to /api/transcribe.

export function isRecordingSupported() {
  return typeof window !== 'undefined' && 'MediaRecorder' in window && navigator.mediaDevices?.getUserMedia;
}

export function createRecorder() {
  let mediaRecorder = null;
  let chunks = [];
  let stream = null;

  return {
    async start() {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      mediaRecorder = new MediaRecorder(stream, { mimeType });
      chunks = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      mediaRecorder.start();
    },
    stop() {
      return new Promise((resolve) => {
        if (!mediaRecorder) { resolve(null); return; }
        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: mediaRecorder.mimeType });
          stream.getTracks().forEach((t) => t.stop());
          resolve(blob);
        };
        mediaRecorder.stop();
      });
    },
    cancel() {
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
      }
      if (stream) stream.getTracks().forEach((t) => t.stop());
    },
  };
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function transcribeAudio(blob) {
  const audioBase64 = await blobToBase64(blob);
  try {
    const res = await fetch('/api/transcribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ audioBase64, mimeType: blob.type }),
    });
    if (!res.ok) throw new Error('bad response');
    const data = await res.json();
    return { text: data.text || null, audioDataUrl: audioBase64 };
  } catch (e) {
    return { text: null, audioDataUrl: audioBase64, error: true };
  }
}
