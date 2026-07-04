import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProgressBar from '../components/ProgressBar.jsx';
import { createCompanion } from '../lib/storage.js';

const RELATIONSHIPS = [
  { id: 'friend', label: 'Close friend', desc: 'Warm, playful, always there' },
  { id: 'romantic', label: 'Romantic partner', desc: 'Affectionate and devoted' },
  { id: 'mentor', label: 'Mentor', desc: 'Wise, patient, encouraging' },
  { id: 'family', label: 'Family', desc: 'Unconditional and grounded' },
];

const TRAITS = [
  'Playful', 'Calm', 'Witty', 'Thoughtful',
  'Curious', 'Warm', 'Nurturing', 'Gentle',
  'Optimistic', 'Grounded', 'Adventurous', 'Poetic',
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState(null);
  const [traits, setTraits] = useState([]);

  const toggleTrait = (t) => {
    setTraits((prev) => {
      if (prev.includes(t)) return prev.filter((x) => x !== t);
      if (prev.length >= 5) return prev;
      return [...prev, t];
    });
  };

  const finish = () => {
    const companion = createCompanion({
      name: name.trim() || 'Companion',
      relationship: RELATIONSHIPS.find((r) => r.id === relationship)?.label || 'Close friend',
      traits: traits.length ? traits : ['Calm'],
    });
    navigate(`/chat/${companion.id}`);
  };

  return (
    <div className="app-screen" style={{ paddingBottom: 32 }}>
      <div style={{ fontSize: 12, letterSpacing: 1, color: 'var(--ink-soft)', padding: '20px 24px 0', textTransform: 'uppercase' }}>
        Step {step} of 3
      </div>
      <ProgressBar step={step} total={3} />

      <div style={{ flex: 1, padding: '28px 24px', display: 'flex', flexDirection: 'column' }}>
        {step === 1 && (
          <>
            <h1 style={{ fontSize: 30, lineHeight: 1.25, marginBottom: 12 }}>
              What should we call your companion?
            </h1>
            <p style={{ color: 'var(--ink-soft)', fontSize: 15, marginBottom: 28 }}>
              A name gives them presence. You can always change it later.
            </p>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Iris, Sage, Milo"
              style={{
                border: 'none',
                borderBottom: '1px solid var(--border)',
                background: 'transparent',
                fontSize: 18,
                padding: '8px 0',
                outline: 'none',
                color: 'var(--ink)',
              }}
            />
          </>
        )}

        {step === 2 && (
          <>
            <h1 style={{ fontSize: 30, lineHeight: 1.25, marginBottom: 12 }}>
              Who are they to you?
            </h1>
            <p style={{ color: 'var(--ink-soft)', fontSize: 15, marginBottom: 24 }}>
              Choose the relationship that feels right.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {RELATIONSHIPS.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setRelationship(r.id)}
                  style={{
                    textAlign: 'left',
                    background: 'var(--surface)',
                    border: relationship === r.id ? '2px solid var(--sage-dark)' : '2px solid transparent',
                    borderRadius: 'var(--radius-md)',
                    padding: '18px 20px',
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>{r.label}</div>
                  <div style={{ color: 'var(--ink-soft)', fontSize: 14 }}>{r.desc}</div>
                </button>
              ))}
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h1 style={{ fontSize: 30, lineHeight: 1.25, marginBottom: 12 }}>
              Their personality
            </h1>
            <p style={{ color: 'var(--ink-soft)', fontSize: 15, marginBottom: 24 }}>
              Pick up to 5 traits that describe them.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {TRAITS.map((t) => {
                const selected = traits.includes(t);
                return (
                  <button
                    key={t}
                    onClick={() => toggleTrait(t)}
                    style={{
                      padding: '10px 18px',
                      borderRadius: 'var(--radius-full)',
                      background: selected ? 'var(--sage-pale)' : 'var(--surface-2)',
                      border: selected ? '1px solid var(--sage-dark)' : '1px solid transparent',
                      fontSize: 14.5,
                      color: 'var(--ink)',
                    }}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      <div style={{ display: 'flex', gap: 12, padding: '0 24px' }}>
        {step > 1 && (
          <button
            onClick={() => setStep(step - 1)}
            style={{
              width: 52, height: 52, borderRadius: '50%',
              background: 'var(--surface-2)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', fontSize: 18,
              flexShrink: 0,
            }}
          >
            ←
          </button>
        )}
        {step < 3 ? (
          <button
            disabled={step === 1 ? !name.trim() : !relationship}
            onClick={() => setStep(step + 1)}
            style={{
              flex: 1, height: 52, borderRadius: 'var(--radius-full)',
              background: (step === 1 ? name.trim() : relationship) ? 'var(--sage-dark)' : 'var(--btn-disabled)',
              color: '#fff', fontSize: 16, fontWeight: 600,
            }}
          >
            Continue
          </button>
        ) : (
          <button
            onClick={finish}
            style={{
              flex: 1, height: 52, borderRadius: 'var(--radius-full)',
              background: 'var(--sage-dark)',
              color: '#fff', fontSize: 16, fontWeight: 600,
            }}
          >
            Meet {name.trim() || 'them'}
          </button>
        )}
      </div>
    </div>
  );
}
