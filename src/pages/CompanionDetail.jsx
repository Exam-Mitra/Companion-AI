import { useNavigate, useParams } from 'react-router-dom';
import { getCompanion, removeCompanion } from '../lib/storage.js';

export default function CompanionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const companion = getCompanion(id);

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

  return (
    <div className="app-screen" style={{ paddingBottom: 32 }}>
      <div style={{ padding: '20px 20px 0' }}>
        <button onClick={() => navigate(-1)} style={{ fontSize: 20 }}>←</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 24px' }}>
        <div style={{
          width: 96, height: 96, borderRadius: '50%', background: 'var(--bg-soft)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
        }}>
          <span style={{ fontFamily: 'var(--font-serif)', fontSize: 42, color: 'var(--sage-dark)' }}>
            {companion.name[0]?.toUpperCase()}
          </span>
        </div>
        <h1 style={{ fontSize: 26, marginBottom: 4 }}>{companion.name}</h1>
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
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {(companion.traits || []).map((t) => (
              <span key={t} style={{
                background: 'var(--surface-2)', borderRadius: 'var(--radius-full)',
                padding: '8px 16px', fontSize: 14,
              }}>{t}</span>
            ))}
          </div>
        </div>

        <button
          onClick={remove}
          style={{
            marginTop: 40, color: 'var(--danger)', background: 'var(--surface-2)',
            borderRadius: 'var(--radius-full)', padding: '12px 24px', fontSize: 15,
          }}
        >
          Remove companion
        </button>
      </div>
    </div>
  );
}
