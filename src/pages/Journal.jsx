import { useMemo, useState } from 'react';
import BottomNav from '../components/BottomNav.jsx';
import { addJournalEntry, getJournalEntries, getJournalStreak, getJournalMoodTrend } from '../lib/storage.js';

const MOODS = [
  { id: 'joyful', label: 'Joyful', icon: '☀', score: 5 },
  { id: 'calm', label: 'Calm', icon: '◐', score: 4 },
  { id: 'okay', label: 'Okay', icon: '○', score: 3 },
  { id: 'anxious', label: 'Anxious', icon: '◑', score: 2 },
  { id: 'low', label: 'Low', icon: '●', score: 1 },
];

function MoodTrend({ entries }) {
  if (entries.length < 2) return null;
  const points = entries.map((e) => MOODS.find((m) => m.id === e.mood)?.score || 3);
  const w = 280, h = 60, pad = 8;
  const stepX = (w - pad * 2) / Math.max(1, points.length - 1);
  const scaleY = (v) => h - pad - ((v - 1) / 4) * (h - pad * 2);
  const path = points.map((v, i) => `${i === 0 ? 'M' : 'L'} ${pad + i * stepX} ${scaleY(v)}`).join(' ');

  return (
    <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-md)', padding: '16px 18px', marginBottom: 12 }}>
      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 10 }}>Mood — last 7 days</div>
      <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ display: 'block' }}>
        <path d={path} fill="none" stroke="var(--sage-dark)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((v, i) => (
          <circle key={i} cx={pad + i * stepX} cy={scaleY(v)} r="3" fill="var(--sage-dark)" />
        ))}
      </svg>
    </div>
  );
}

export default function Journal() {
  const [mood, setMood] = useState(null);
  const [note, setNote] = useState('');
  const [entries, setEntries] = useState(getJournalEntries());
  const [streak, setStreak] = useState(getJournalStreak());
  const trend = useMemo(() => getJournalMoodTrend(7), [entries]);

  const save = () => {
    if (!mood) return;
    addJournalEntry({ mood, note: note.trim() });
    setEntries(getJournalEntries());
    setStreak(getJournalStreak());
    setMood(null);
    setNote('');
  };

  return (
    <div className="app-screen">
      <div style={{ padding: '24px 20px 4px' }}>
        <h1 style={{ fontSize: 30, marginBottom: 6 }}>Journal</h1>
        <p style={{ color: 'var(--ink-soft)', fontSize: 15 }}>How are you feeling right now?</p>
      </div>

      <div style={{ padding: '16px 20px' }}>
        {streak > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, background: 'var(--sage-pale)',
            borderRadius: 'var(--radius-full)', padding: '10px 16px', marginBottom: 16, width: 'fit-content',
          }}>
            <span style={{ fontSize: 16 }}>🔥</span>
            <span style={{ fontSize: 13.5, fontWeight: 600 }}>
              {streak} day{streak > 1 ? 's' : ''} in a row
            </span>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {MOODS.map((m) => (
            <button
              key={m.id}
              onClick={() => setMood(m.id)}
              style={{
                flex: 1, background: mood === m.id ? 'var(--sage-pale)' : 'var(--surface)',
                border: mood === m.id ? '1px solid var(--sage-dark)' : '1px solid transparent',
                borderRadius: 'var(--radius-md)', padding: '14px 4px', textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 18, marginBottom: 6 }}>{m.icon}</div>
              <div style={{ fontSize: 11.5, color: 'var(--ink-soft)' }}>{m.label}</div>
            </button>
          ))}
        </div>

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="A word about your day (optional)..."
          rows={3}
          style={{
            width: '100%', background: 'var(--surface-2)', border: 'none',
            borderRadius: 'var(--radius-md)', padding: '14px 16px', fontSize: 14.5,
            outline: 'none', resize: 'none', color: 'var(--ink)',
          }}
        />

        <button
          onClick={save}
          disabled={!mood}
          style={{
            width: '100%', marginTop: 16, padding: '16px 0',
            borderRadius: 'var(--radius-full)',
            background: mood ? 'var(--sage-dark)' : 'var(--btn-disabled)',
            color: '#fff', fontSize: 16, fontWeight: 600,
          }}
        >
          Save entry
        </button>

        <div style={{ borderTop: '1px solid var(--border)', margin: '28px 0 16px' }} />

        <MoodTrend entries={trend} />

        <h3 style={{ fontSize: 20, marginBottom: 14 }}>Past entries</h3>

        {entries.length === 0 && (
          <div style={{
            background: 'var(--surface)', borderRadius: 'var(--radius-md)',
            padding: '32px 20px', textAlign: 'center', color: 'var(--ink-soft)', fontSize: 14.5,
          }}>
            📖<br /><br />Your journal is a quiet space. Start whenever.
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {entries.map((e) => {
            const m = MOODS.find((x) => x.id === e.mood);
            return (
              <div key={e.id} style={{ background: 'var(--surface)', borderRadius: 'var(--radius-md)', padding: '14px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: e.note ? 6 : 0 }}>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{m?.icon} {m?.label}</span>
                  <span style={{ color: 'var(--ink-soft)', fontSize: 12.5 }}>
                    {new Date(e.date).toLocaleDateString()}
                  </span>
                </div>
                {e.note && <div style={{ fontSize: 14, color: 'var(--ink-soft)' }}>{e.note}</div>}
              </div>
            );
          })}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
