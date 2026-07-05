import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Avatar from '../components/Avatar.jsx';
import { getCompanion, removeCompanion, updateCompanion } from '../lib/storage.js';
import { AVATAR_BY_RELATIONSHIP } from '../lib/avatars.js';

const TRAITS = [
  'Playful', 'Calm', 'Witty', 'Thoughtful',
  'Curious', 'Warm', 'Nurturing', 'Gentle',
  'Optimistic', 'Grounded', 'Adventurous', 'Poetic',
];

export default function CompanionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const companion = getCompanion(id);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(companion?.name || '');
  const [traits, setTraits] = useState(companion?.traits || []);

  if (!companion) {
    navigate('/companions');
    return null;
  }

  const daysTogether = Math.max(1, Math.ceil((Date.now() - companion.createdAt) / 86400000));
  const messagesShared = companion.messages?.length || 0;

  const remove = () => {
    removeCompanion(companion.id);
    navigate('/companions');
  };

  const toggleTrait = (t) => {
    setTraits((prev) => {
      if (prev.includes(t)) return prev.filter((x) => x !== t);
      if (prev.length >= 5) return prev;
      return [...prev, t];
    });
  };

  const saveEdits = () => {
    updateCompanion(companion.id, { name: name.trim() || companion.name, traits: traits.length ? traits : companion.traits });
    setEditing(false);
  };

  const pickAvatar = (relationshipKey) => {
    updateCompanion(companion.id, { avatarId: relationshipKey });
  };

  return (
    <div className="app-screen" style={{ paddingBottom: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '20px 20px 0' }}>
        <button onClick={() => navigate(-1)} style={{ fontSize: 20 }}>←</button>
        <button
          onClick={() => (editing ? saveEdits() : setEditing(true))}
          style={{ color: 'var(--sage-dark)', fontWeight: 600, fontSize: 14.5 }}
        >
          {editing ? 'Save' : 'Edit'}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 24px' }}>
        <Avatar companion={companion} size={96} />

        {editing && (
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            {Object.keys(AVATAR_BY_RELATIONSHIP).map((key) => (
              <button
                key={key}
                onClick={() => pickAvatar(key)}
                style={{
                  width: 36, height: 36, borderRadius: '50%', overflow: 'hidden',
                  border: companion.avatarId === key ? '2px solid var(--sage-dark)' : '2px solid transparent',
                }}
              >
                <img src={AVATAR_BY_RELATIONSHIP[key]} alt={key} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </button>
            ))}
          </div>
        )}

        {editing ? (
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{
              fontSize: 24, fontFamily: 'var(--font-serif)', textAlign: 'center', marginTop: 16,
              border: 'none', borderBottom: '1px solid var(--border)', background: 'transparent',
              color: 'var(--ink)', outline: 'none', padding: '4px 0',
            }}
          />
        ) : (
          <h1 style={{ fontSize: 26, marginTop: 16, marginBottom: 4 }}>{companion.name}</h1>
        )}
        <div style={{ color: 'var(--ink-soft)', fontSize: 15 }}>{companion.relationship}</div>

        <div style={{ display: 'flex', gap: 12, width: '100%', marginTop: 28 }}>
          <div style={{ flex: 1, background: 'var(--surface)', borderRadius: 'var(--radius-md)', padding: '18px 0', textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 600 }}>{messagesShared}</div>
            <div style={{ color: 'var(--ink-soft)', fontSize: 13 }}>Messages shared</div>
          </div>
          <div style={{ flex: 1, background: 'var(--surface)', borderRadius: 'var(--radius-md)', padding: '18px 0', textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 600 }}>{daysTogether}</div>
            <div style={{ color: 'var(--ink-soft)', fontSize: 13 }}>Days together</div>
          </div>
        </div>

        <div style={{ width: '100%', marginTop: 32 }}>
          <h3 style={{ fontSize: 18, marginBottom: 12 }}>Personality</h3>
          {editing ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {TRAITS.map((t) => {
                const selected = traits.includes(t);
                return (
                  <button
                    key={t}
                    onClick={() => toggleTrait(t)}
                    style={{
                      padding: '8px 16px', borderRadius: 'var(--radius-full)',
                      background: selected ? 'var(--sage-pale)' : 'var(--surface-2)',
                      border: selected ? '1px solid var(--sage-dark)' : '1px solid transparent',
                      fontSize: 13.5,
                    }}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {(companion.traits || []).map((t) => (
                <span key={t} style={{
                  background: 'var(--surface-2)', borderRadius: 'var(--radius-full)',
                  padding: '8px 16px', fontSize: 14,
                }}>{t}</span>
              ))}
            </div>
          )}
        </div>

        {companion.memory && !editing && (
          <div style={{ width: '100%', marginTop: 28 }}>
            <h3 style={{ fontSize: 18, marginBottom: 12 }}>What {companion.name} remembers</h3>
            <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-md)', padding: '14px 16px', fontSize: 14, color: 'var(--ink-soft)', lineHeight: 1.5 }}>
              {companion.memory}
            </div>
          </div>
        )}

        {!editing && (
          <button
            onClick={remove}
            style={{
              marginTop: 40, color: 'var(--danger)', background: 'var(--surface-2)',
              borderRadius: 'var(--radius-full)', padding: '12px 24px', fontSize: 15,
            }}
          >
            Remove companion
          </button>
        )}
      </div>
    </div>
  );
}
