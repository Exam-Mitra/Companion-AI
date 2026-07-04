import { Navigate, Route, Routes } from 'react-router-dom';
import { SpeedInsights } from '@vercel/speed-insights/react';
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

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/chat/:id" element={<Chat />} />
        <Route path="/companions" element={<Companions />} />
        <Route path="/companions/:id" element={<CompanionDetail />} />
        <Route path="/journal" element={<Journal />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <SpeedInsights />
    </>
  );
}
