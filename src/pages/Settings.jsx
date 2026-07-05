import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav.jsx';
import { downloadDataExport, getSettings, updateSettings } from '../lib/storage.js';
import { getAvailableVoices, speak } from '../lib/ai.js';
import { isPushSupported, subscribeToPush, unsubscribeFromPush } from '../lib/notifications.js';

function Row({ label, description, children }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: 'var(--surface)', borderRadius: 'var(--radius-md)', padding: '16px 18px', gap: 12,
    }}>
      <div>
        <div style={{ fontWeight: 600, fontSize: 15 }}>{label}</div>
        {description && <div style={{ color: 'var(--ink-soft)', fontSize: 13, marginTop: 2 }}>{description}</div>}
      </div>
      {children}
    </div>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      style={{
        width: 46, height: 27, borderRadius: 999, padding: 3,
        background: checked ? 'var(--sage-dark)' : 'var(--track-inactive)',
        display: 'flex', justifyContent: checked ? 'flex-end' : 'flex-start',
        flexShrink: 0, transition: 'background 0.15s ease',
      }}
    >
      <div style={{ width: 21, height: 21, borderRadius: '50%', background: '#fff' }} />
    </button>
  );
}

export default function Settings() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState(getSettings());
  const [voices, setVoices] = useState([]);
  const [notifBusy, setNotifBusy] = useState(false);

  useEffect(() => {
    const loadVoices = () => setVoices(getAvailableVoices());
    loadVoices();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
      return () => window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
    }
  }, []);

  const patch = (p) => setSettings(updateSettings(p));

  const toggleTheme = (isDark) => patch({ theme: isDark ? 'dark' : 'light' });

  const toggleNotifications = async (enabled) => {
    setNotifBusy(true);
    try {
      if (enabled) {
        const ok = await subscribeToPush();
        patch({ notificationsEnabled: ok });
      } else {
        await unsubscribeFromPush();
        patch({ notificationsEnabled: false });
      }
    } finally {
      setNotifBusy(false);
    }
  };

  return (
    <div className="app-screen">
      <div style={{ padding: '24px 20px 4px' }}>
        <h1 style={{ fontSize: 30, marginBottom: 6 }}>Settings</h1>
        <p style={{ color: 'var(--ink-soft)', fontSize: 15 }}>Make the app feel like yours.</p>
      </div>

      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Row label="Dark mode" description="Easier on the eyes at night">
          <Toggle checked={settings.theme === 'dark'} onChange={toggleTheme} />
        </Row>

        <Row
          label="Daily check-in reminder"
          description={isPushSupported() ? 'A gentle nudge to open your journal' : 'Not supported on this browser/device'}
        >
          <Toggle
            checked={settings.notificationsEnabled}
            onChange={toggleNotifications}
          />
        </Row>

        <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-md)', padding: '16px 18px' }}>
          <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 10 }}>Companion voice</div>
          <select
            value={settings.voiceName || ''}
            onChange={(e) => patch({ voiceName: e.target.value || null })}
            style={{
              width: '100%', padding: '10px 12px', borderRadius: 12, border: '1px solid var(--border)',
              background: 'var(--surface-2)', color: 'var(--ink)', fontSize: 14,
            }}
          >
            <option value="">Automatic (default)</option>
            {voices.map((v) => (
              <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>
            ))}
          </select>
          <button
            onClick={() => speak('Hi, this is how I sound.', settings.voiceName)}
            style={{
              marginTop: 10, fontSize: 13.5, color: 'var(--sage-dark)', fontWeight: 600,
              padding: '8px 4px',
            }}
          >
            ▶ Preview voice
          </button>
        </div>

        <button
          onClick={downloadDataExport}
          style={{
            background: 'var(--surface)', borderRadius: 'var(--radius-md)', padding: '16px 18px',
            textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}
        >
          <div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>Export my data</div>
            <div style={{ color: 'var(--ink-soft)', fontSize: 13, marginTop: 2 }}>
              Download a backup of your companions and journal
            </div>
          </div>
          <span style={{ fontSize: 18, color: 'var(--ink-soft)' }}>↓</span>
        </button>

        <div style={{ marginTop: 12, textAlign: 'center', color: 'var(--ink-soft)', fontSize: 13 }}>
          Fintly Companion · Your data stays on your device
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
