import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './store/auth';
import { RealtimeBridge } from './lib/RealtimeBridge';
import { AppLayout } from './pages/AppLayout';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Onboarding } from './pages/Onboarding';
import { Discover } from './pages/Discover';
import { LikesYou } from './pages/LikesYou';
import { Matches } from './pages/Matches';
import { Chat } from './pages/Chat';
import { Profile } from './pages/Profile';
import { EditProfile } from './pages/EditProfile';
import { Settings } from './pages/Settings';
import { UserProfile } from './pages/UserProfile';

function FullScreenLoader() {
  return (
    <div className="screen">
      <div className="center-col">
        <div className="spinner" />
      </div>
    </div>
  );
}

export function App() {
  const status = useAuth((s) => s.status);
  const bootstrap = useAuth((s) => s.bootstrap);
  const location = useLocation();

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  // Keep the scroll container at top on route change.
  useEffect(() => {
    document.querySelector('.screen-scroll')?.scrollTo(0, 0);
  }, [location.pathname]);

  if (status === 'loading') return <FullScreenLoader />;

  const authed = status === 'authed';

  return (
    <>
      {authed && <RealtimeBridge />}
      <Routes>
      <Route path="/" element={authed ? <Navigate to="/app/discover" replace /> : <Landing />} />
      <Route path="/login" element={authed ? <Navigate to="/app/discover" replace /> : <Login />} />
      <Route
        path="/register"
        element={authed ? <Navigate to="/app/onboarding" replace /> : <Register />}
      />

      {authed ? (
        <>
          <Route path="/app/onboarding" element={<Onboarding />} />
          <Route path="/app" element={<AppLayout />}>
            <Route index element={<Navigate to="discover" replace />} />
            <Route path="discover" element={<Discover />} />
            <Route path="likes" element={<LikesYou />} />
            <Route path="matches" element={<Matches />} />
            <Route path="profile" element={<Profile />} />
          </Route>
          <Route path="/app/chat/:matchId" element={<Chat />} />
          <Route path="/app/edit" element={<EditProfile />} />
          <Route path="/app/settings" element={<Settings />} />
          <Route path="/app/u/:userId" element={<UserProfile />} />
        </>
      ) : (
        <Route path="/app/*" element={<Navigate to="/login" replace />} />
      )}

      <Route path="*" element={<Navigate to={authed ? '/app/discover' : '/'} replace />} />
      </Routes>
    </>
  );
}
