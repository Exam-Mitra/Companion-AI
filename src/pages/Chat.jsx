import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import BottomNav from '../components/BottomNav.jsx';
import { addMessage, getCompanion, uid } from '../lib/storage.js';
import { getCompanionReply, speak } from '../lib/ai.js';

function Avatar({ name, size = 40 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: 'var(--bg-soft)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      <span style={{ fontFamily: 'var(--font-serif)', fontSize: size * 0.42, color: 'var(--sage-dark)' }}>
        {name?.[0]?.toUpperCase() || '?'}
      </span>
    </div>
  );
}

const SpeakerIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--ink-soft)" strokeWidth="1.6">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M15.5 8.5a5 5 0 0 1 0 7" />
  </svg>
);

export default function Chat() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [companion, setCompanion] = useState(null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    const c = getCompanion(id);
    if (!c) { navigate('/companions'); return; }
    setCompanion(c);
  }, [id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [companion?.messages?.length, sending]);

  if (!companion) return null;

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput('');
    const userMsg = { id: uid(), role: 'user', text, ts: Date.now() };
    addMessage(companion.id, userMsg);
    const updated = getCompanion(companion.id);
    setCompanion({ ...updated });
    setSending(true);
    try {
      const reply = await getCompanionReply(companion, updated.messages, text);
      const botMsg = { id: uid(), role: 'assistant', text: reply, ts: Date.now() };
      addMessage(companion.id, botMsg);
      setCompanion({ ...getCompanion(companion.id) });
    } finally {
      setSending(false);
    }
  };

  const messages = companion.messages || [];

  return (
    <div className="app-screen" style={{ paddingBottom: 84 }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '18px 20px 14px',
        borderBottom: '1px solid var(--border)', background: 'var(--bg)',
        position: 'sticky', top: 0, zIndex: 5,
      }}>
        <Avatar name={companion.name} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 16 }}>{companion.name}</div>
          <div style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}>
            {companion.relationship} • Present With You
          </div>
        </div>
        <button onClick={() => navigate(`/companions/${companion.id}`)} style={{ fontSize: 20, color: 'var(--ink-soft)', padding: 6 }}>⋯</button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="scroll-area" style={{ padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', marginTop: '30vh', padding: '0 20px' }}>
            <h2 style={{ fontSize: 24, marginBottom: 8 }}>Say hi to {companion.name}</h2>
            <p style={{ color: 'var(--ink-soft)', fontSize: 15 }}>They've been waiting. Share what's on your mind.</p>
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
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
            </div>
            {m.role === 'assistant' && (
              <button onClick={() => speak(m.text)} style={{ marginTop: 6, padding: '2px 4px' }}>
                <SpeakerIcon />
              </button>
            )}
          </div>
        ))}
        {sending && (
          <div style={{ display: 'flex' }}>
            <div style={{
              background: 'var(--bubble-assistant)', border: '1px solid var(--border)',
              borderRadius: 20, padding: '14px 18px', fontSize: 15, color: 'var(--ink-soft)',
            }}>
              <em>typing…</em>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{
        position: 'fixed', bottom: 68, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 480, padding: '10px 16px',
        background: 'var(--bg)', borderTop: '1px solid var(--border)',
        display: 'flex', gap: 10, alignItems: 'center', zIndex: 15,
      }}>
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
