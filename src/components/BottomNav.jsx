import { useLocation, useNavigate } from 'react-router-dom';
import { getActiveCompanion } from '../lib/storage.js';

const ChatIcon = ({ active }) => (
  <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke={active ? 'var(--ink)' : 'var(--ink-soft)'} strokeWidth="1.6">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);
const CompanionsIcon = ({ active }) => (
  <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke={active ? 'var(--ink)' : 'var(--ink-soft)'} strokeWidth="1.6">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
const JournalIcon = ({ active }) => (
  <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke={active ? 'var(--ink)' : 'var(--ink-soft)'} strokeWidth="1.6">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);
const SettingsIcon = ({ active }) => (
  <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke={active ? 'var(--ink)' : 'var(--ink-soft)'} strokeWidth="1.6">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { key: 'chat', label: 'Chat', icon: ChatIcon, go: () => {
        const c = getActiveCompanion();
        navigate(c ? `/chat/${c.id}` : '/companions');
      }, match: (p) => p.startsWith('/chat') },
    { key: 'companions', label: 'Companions', icon: CompanionsIcon, go: () => navigate('/companions'), match: (p) => p.startsWith('/companions') },
    { key: 'journal', label: 'Journal', icon: JournalIcon, go: () => navigate('/journal'), match: (p) => p.startsWith('/journal') },
    { key: 'settings', label: 'Settings', icon: SettingsIcon, go: () => navigate('/settings'), match: (p) => p.startsWith('/settings') },
  ];

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
      width: '100%', maxWidth: 480, background: 'var(--bg)',
      borderTop: '1px solid var(--border)', display: 'flex',
      padding: '10px 0 14px', zIndex: 20,
    }}>
      {tabs.map(({ key, label, icon: Icon, go, match }) => {
        const active = match(location.pathname);
        return (
          <button key={key} onClick={go} style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
          }}>
            <Icon active={active} />
            <span style={{ fontSize: 11.5, color: active ? 'var(--ink)' : 'var(--ink-soft)', fontWeight: active ? 600 : 400 }}>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
