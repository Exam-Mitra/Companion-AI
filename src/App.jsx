import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Onboarding from './pages/Onboarding.jsx';
import Chat from './pages/Chat.jsx';
import Companions from './pages/Companions.jsx';
import CompanionDetail from './pages/CompanionDetail.jsx';
import Journal from './pages/Journal.jsx';
import { getActiveCompanion, isOnboarded } from './lib/storage.js';

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

export default function App() {
  usePageTracking();
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/chat/:id" element={<Chat />} />
      <Route path="/companions" element={<Companions />} />
      <Route path="/companions/:id" element={<CompanionDetail />} />
      <Route path="/journal" element={<Journal />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
