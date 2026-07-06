import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import BottomNav from '../components/BottomNav.jsx';
import Avatar from '../components/Avatar.jsx';
import { addMessage, getCompanion, getSettings, uid, patchLastMessage, updateMemory } from '../lib/storage.js';
import { streamCompanionReply, speak } from '../lib/ai.js';
import { maybeUpdateMemory } from '../lib/memory.js';
import { createRecorder, isRecordingSupported, transcribeAudio } from '../lib/voice.js';

const SpeakerIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--ink-soft)" strokeWidth="1.6">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M15.5 8.5a5 5 0 0 1 0 7" />
  </svg>
);

const ImageIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--ink-soft)" strokeWidth="1.6">
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <path d="M21 15l-5-5L5 21" />
  </svg>
);

const MicIcon = ({ active }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? 'var(--danger)' : 'var(--ink-soft)'} strokeWidth="1.6">
    <rect x="9" y="2" width="6" height="12" rx="3" />
    <path d="M5 10v1a7 7 0 0 0 14 0v-1" />
    <line x1="12" y1="19" x2="12" y2="22" />
  </svg>
);

function formatTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function vibrate(ms) {
  if (navigator.vibrate) {
    try { navigator.vibrate(ms); } catch {}
  }
}

let audioCtx = null;
function playTone(freq = 440, duration = 0.05, volume = 0.03) {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    gain.gain.value = volume;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
  } catch {}
}

function AudioBubble({ src }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);

  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <audio
        ref={audioRef}
        src={src}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        style={{ display: 'none' }}
      />
      <button
        onClick={toggle}
        style={{
          width: 30, height: 30, borderRadius: '50%', background: 'var(--sage-pale)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}
      >
        {playing ? (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="var(--sage-dark)"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
        ) : (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="var(--sage-dark)"><polygon points="5 3 19 12 5 21 5 3" /></svg>
        )}
      </button>
      <span style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}>Voice message</span>
    </div>
  );
}

export default function Chat() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [companion, setCompanion] = useState(null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingImage, setPendingImage] = useState(null);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);
  const recorderRef = useRef(null);
  const settings = getSettings();

  useEffect(() => {
    const c = getCompanion(id);
    if (!c) { navigate('/companions'); return; }
    setCompanion(c);
  }, [id]);

  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [companion?.messages?.length, sending]);

  if (!companion) return null;

  const handleImagePick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPendingImage(reader.result);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const sendMessage = async ({ text, image, audio }) => {
    if ((!text && !image && !audio) || sending) return;
    setInput('');
    setPendingImage(null);

    const userMsg = {
      id: uid(), role: 'user',
      text: text || (audio ? '(voice message)' : '(sent a photo)'),
      image, audio, ts: Date.now(),
    };
    addMessage(companion.id, userMsg);
    const updated = getCompanion(companion.id);
    setCompanion({ ...updated });
    vibrate(12);
    playTone(520, 0.04, 0.025);
    setSending(true);

    const botMsgId = uid();
    addMessage(companion.id, { id: botMsgId, role: 'assistant', text: '', ts: Date.now(), streaming: true });
    setCompanion({ ...getCompanion(companion.id) });

    try {
      const fullReply = await streamCompanionReply(companion, updated.messages, text, {
        imageBase64: image,
        onToken: (partial) => {
          patchLastMessage(companion.id, { text: partial });
          setCompanion({ ...getCompanion(companion.id) });
        },
      });

      patchLastMessage(companion.id, { text: fullReply, streaming: false });
      setCompanion({ ...getCompanion(companion.id) });

      vibrate(8);
      playTone(680, 0.05, 0.02);

      maybeUpdateMemory(companion.id);
    } finally {
      setSending(false);
    }
  };

  const send = () => sendMessage({ text: input.trim(), image: pendingImage });

  const startRecording = async () => {
    if (!isRecordingSupported()) return;
    try {
      recorderRef.current = createRecorder();
      await recorderRef.current.start();
      setRecording(true);
      vibrate(15);
    } catch (e) {
      setRecording(false);
    }
  };

  const stopRecordingAndSend = async () => {
    if (!recorderRef.current) return;
    setRecording(false);
    const blob = await recorderRef.current.stop();
    recorderRef.current = null;
    if (!blob || blob.size < 500) return;

    setTranscribing(true);
    try {
      const { text, audioDataUrl } = await transcribeAudio(blob);
      await sendMessage({ text: text || '', audio: audioDataUrl });
    } finally {
      setTranscribing(false);
    }
  };

  const cancelRecording = () => {
    if (recorderRef.current) {
      recorderRef.current.cancel();
      recorderRef.current = null;
    }
    setRecording(false);
  };

  const messages = companion.messages || [];

  return (
    <div className="app-screen" style={{ paddingBottom: 84 }}>
      {!isOnline && (
        <div style={{
          background: 'var(--offline-bg)', color: 'var(--offline-text)', fontSize: 13, textAlign: 'center',
          padding: '8px 16px', borderBottom: '1px solid var(--offline-border)',
        }}>
          You're offline — replies are basic until you're back online.
        </div>
      )}

      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '18px 20px 14px',
        borderBottom: '1px solid var(--border)', background: 'var(--bg)',
        position: 'sticky', top: 0, zIndex: 5,
      }}>
        <Avatar companion={companion} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 16 }}>{companion.name}</div>
          <div style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}>
            {companion.relationship} • Present With You
          </div>
        </div>
        <button onClick={() => navigate(`/companions/${companion.id}`)} style={{ fontSize: 20, color: 'var(--ink-soft)', padding: 6 }}>⋯</button>
      </div>

      <div ref={scrollRef} className="scroll-area" style={{ padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', marginTop: '30vh', padding: '0 20px' }}>
            <h2 style={{ fontSize: 24, marginBottom: 8 }}>Say hi to {companion.name}</h2>
            <p style={{ color: 'var(--ink-soft)', fontSize: 15 }}>They've been waiting. Share what's on your mind.</p>
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            {m.image && (
              <img
                src={m.image}
                alt="attachment"
                style={{ maxWidth: '70%', borderRadius: 16, marginBottom: 6 }}
              />
            )}
            {m.audio && (
              <div style={{
                maxWidth: '80%',
                background: m.role === 'user' ? 'var(--bubble-user)' : 'var(--bubble-assistant)',
                border: m.role === 'assistant' ? '1px solid var(--border)' : 'none',
                borderRadius: 20,
                padding: '12px 16px',
                marginBottom: m.text ? 6 : 0,
              }}>
                <AudioBubble src={m.audio} />
              </div>
            )}
            {(m.text || m.streaming) && (
              <div style={{
                maxWidth: '80%',
                background: m.role === 'user' ? 'var(--bubble-user)' : 'var(--bubble-assistant)',
                border: m.role === 'assistant' ? '1px solid var(--border)' : 'none',
                borderRadius: 20,
                padding: '14px 18px',
                fontSize: 15.5,
                lineHeight: 1.5,
                whiteSpace: 'pre-wrap',
              }}>
                {m.text}
                {m.streaming && <span className="stream-caret" />}
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
              <span style={{ fontSize: 11, color: 'var(--ink-soft)' }}>{formatTime(m.ts)}</span>
              {m.role === 'assistant' && !m.streaming && m.text && (
                <button onClick={() => speak(m.text, settings.voiceName)} style={{ padding: '2px 4px' }}>
                  <SpeakerIcon />
                </button>
              )}
            </div>
          </div>
        ))}
        {transcribing && (
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{
              background: 'var(--bubble-user)', borderRadius: 20, padding: '12px 18px',
              fontSize: 14, color: 'var(--ink-soft)',
            }}>
              <em>Transcribing your voice message…</em>
            </div>
          </div>
        )}
      </div>

      {pendingImage && (
        <div style={{
          position: 'fixed', bottom: 122, left: '50%', transform: 'translateX(-50%)',
          width: '100%', maxWidth: 480, padding: '0 16px', zIndex: 16,
        }}>
          <div style={{ display: 'inline-flex', position: 'relative' }}>
            <img src={pendingImage} alt="preview" style={{ height: 64, borderRadius: 12, border: '1px solid var(--border)' }} />
            <button
              onClick={() => setPendingImage(null)}
              style={{
                position: 'absolute', top: -6, right: -6, width: 22, height: 22, borderRadius: '50%',
                background: 'var(--ink)', color: 'var(--bg)', fontSize: 13, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
              }}
            >×</button>
          </div>
        </div>
      )}

      {recording && (
        <div style={{
          position: 'fixed', bottom: 122, left: '50%', transform: 'translateX(-50%)',
          width: '100%', maxWidth: 480, padding: '0 16px', zIndex: 16,
          display: 'flex', justifyContent: 'center',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, background: 'var(--surface)',
            border: '1px solid var(--border)', borderRadius: 999, padding: '8px 16px',
          }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--danger)' }} />
            <span style={{ fontSize: 13.5, color: 'var(--ink)' }}>Recording… release to send</span>
          </div>
        </div>
      )}

      <div style={{
        position: 'fixed', bottom: 68, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 480, padding: '10px 16px',
        background: 'var(--bg)', borderTop: '1px solid var(--border)',
        display: 'flex', gap: 10, alignItems: 'center', zIndex: 15,
      }}>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImagePick} style={{ display: 'none' }} />
        <button onClick={() => fileInputRef.current?.click()} style={{ flexShrink: 0, padding: 6 }}>
          <ImageIcon />
        </button>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Share your thoughts..."
          style={{
            flex: 1, border: 'none', outline: 'none',
            background: 'var(--surface-2)', borderRadius: 'var(--radius-full)',
            padding: '14px 18px', fontSize: 15, color: 'var(--ink)',
          }}
        />
        {isRecordingSupported() && (
          <button
            onMouseDown={startRecording}
            onMouseUp={stopRecordingAndSend}
            onMouseLeave={() => { if (recording) cancelRecording(); }}
            onTouchStart={(e) => { e.preventDefault(); startRecording(); }}
            onTouchEnd={(e) => { e.preventDefault(); stopRecordingAndSend(); }}
            style={{
              width: 46, height: 46, borderRadius: '50%',
              background: recording ? 'var(--danger)' : 'var(--surface-2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}
          >
            <MicIcon active={recording} />
          </button>
        )}
        <button onClick={send} style={{
          width: 46, height: 46, borderRadius: '50%', background: 'var(--sage-pale)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--sage-dark)" strokeWidth="2.2">
            <line x1="12" y1="19" x2="12" y2="5" />
            <polyline points="5 12 12 5 19 12" />
          </svg>
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
