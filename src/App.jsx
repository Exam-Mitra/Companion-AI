import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import Onboarding from './pages/Onboarding.jsx';
import Chat from './pages/Chat.jsx';
import Companions from './pages/Companions.jsx';
import CompanionDetail from './pages/CompanionDetail.jsx';
import Journal from './pages/Journal.jsx';
import Settings from './pages/Settings.jsx';
import { getActiveCompanion, getSettings, isOnboarded } from './lib/storage.js';

function HomeRedirect() {
  if (!isOnboarded()) return <Navigate to="/onboarding" replace />;
  const c = getActiveCompanion();
  return <Navigate to={c ? `/chat/${c.id}` : '/onboarding'} replace />;
}

function usePageTracking() {
  const location = useLocation();
  useEffect(() => {
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'page_view', {
        page_path: location.pathname,
        page_location: window.location.href,
      });
    }
  }, [location]);
}

function useAppliedTheme() {
  useEffect(() => {
    const settings = getSettings();
    document.documentElement.setAttribute('data-theme', settings.theme || 'light');

    const onSettingsChange = () => {
      const s = getSettings();
      document.documentElement.setAttribute('data-theme', s.theme || 'light');
    };
    window.addEventListener('aic:settings-changed', onSettingsChange);
    return () => window.removeEventListener('aic:settings-changed', onSettingsChange);
  }, []);
}

export default function App() {
  usePageTracking();
  useAppliedTheme();

  return (
    <>
      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/chat/:id" element={<Chat />} />
        <Route path="/companions" element={<Companions />} />
        <Route path="/companions/:id" element={<CompanionDetail />} />
        <Route path="/journal" element={<Journal />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Analytics />
    </>
  );
}
