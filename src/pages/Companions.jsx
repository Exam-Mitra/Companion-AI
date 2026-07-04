import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav.jsx';
import { getCompanions, setActiveCompanion } from '../lib/storage.js';

export default function Companions() {
  const navigate = useNavigate();
  const companions = getCompanions();

  return (
    <div className="app-screen">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 20px 12px' }}>
        <h1 style={{ fontSize: 30 }}>Companions</h1>
        <button
          onClick={() => navigate('/onboarding')}
          style={{
            width: 44, height: 44, borderRadius: '50%', background: 'var(--sage-dark)',
            color: '#fff', fontSize: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          +
        </button>
      </div>

      <div style={{ padding: '8px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {companions.length === 0 && (
          <div style={{ color: 'var(--ink-soft)', textAlign: 'center', marginTop: '20vh', fontSize: 15 }}>
            No companions yet. Tap + to create one.
          </div>
        )}
        {companions.map((c) => (
          <button
            key={c.id}
            onClick={() => navigate(`/companions/${c.id}`)}
            style={{
              display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left',
              background: c.active ? 'var(--sage-pale)' : 'var(--surface)',
              borderRadius: 'var(--radius-md)', padding: '16px 18px',
            }}
          >
            <div style={{
              width: 48, height: 48, borderRadius: '50%', background: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontFamily: 'var(--font-serif)', fontSize: 20, color: 'var(--sage-dark)' }}>
                {c.name[0]?.toUpperCase()}
              </span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontWeight: 600, fontSize: 16.5 }}>{c.name}</span>
                {c.active && (
                  <span style={{
                    fontSize: 11, background: 'var(--sage-dark)', color: '#fff',
                    borderRadius: 'var(--radius-full)', padding: '2px 10px',
                  }}>Active</span>
                )}
              </div>
              <div style={{ color: 'var(--ink-soft)', fontSize: 13.5 }}>{c.relationship}</div>
              <div style={{ color: 'var(--ink-soft)', fontSize: 13.5 }}>{c.traits?.[0]}</div>
            </div>
            <span style={{ color: 'var(--ink-soft)', fontSize: 20 }}>›</span>
          </button>
        ))}
      </div>

      <BottomNav />
    </div>
  );
}
