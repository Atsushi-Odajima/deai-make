import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './store/auth';
import { RealtimeBridge } from './lib/RealtimeBridge';
import { AppLayout } from './pages/AppLayout';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Onboarding } from './pages/Onboarding';
import { Home } from './pages/Home';
import { Search } from './pages/Search';
import { Board } from './pages/Board';
import { BoardThread } from './pages/BoardThread';
import { CreatePost } from './pages/CreatePost';
import { CreateBoardPost } from './pages/CreateBoardPost';
import { PostDetail } from './pages/PostDetail';
import { Profile } from './pages/Profile';
import { EditProfile } from './pages/EditProfile';
import { Settings } from './pages/Settings';
import { Conversations } from './pages/Conversations';
import { Chat } from './pages/Chat';

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

  useEffect(() => {
    document.querySelector('.screen-scroll, .tab-content')?.scrollTo(0, 0);
  }, [location.pathname]);

  if (status === 'loading') return <FullScreenLoader />;
  const authed = status === 'authed';

  return (
    <>
      {authed && <RealtimeBridge />}
      <Routes>
        <Route path="/" element={authed ? <Navigate to="/app/home" replace /> : <Landing />} />
        <Route path="/login" element={authed ? <Navigate to="/app/home" replace /> : <Login />} />
        <Route
          path="/register"
          element={authed ? <Navigate to="/app/onboarding" replace /> : <Register />}
        />

        {authed ? (
          <>
            <Route path="/app/onboarding" element={<Onboarding />} />
            <Route path="/app" element={<AppLayout />}>
              <Route index element={<Navigate to="home" replace />} />
              <Route path="home" element={<Home />} />
              <Route path="search" element={<Search />} />
              <Route path="board" element={<Board />} />
              <Route path="profile" element={<Profile />} />
              <Route path="u/:username" element={<Profile />} />
            </Route>
            <Route path="/app/create" element={<CreatePost />} />
            <Route path="/app/board/new" element={<CreateBoardPost />} />
            <Route path="/app/board/:boardId" element={<BoardThread />} />
            <Route path="/app/post/:postId" element={<PostDetail />} />
            <Route path="/app/dm" element={<Conversations />} />
            <Route path="/app/dm/:conversationId" element={<Chat />} />
            <Route path="/app/edit" element={<EditProfile />} />
            <Route path="/app/settings" element={<Settings />} />
          </>
        ) : (
          <Route path="/app/*" element={<Navigate to="/login" replace />} />
        )}

        <Route path="*" element={<Navigate to={authed ? '/app/home' : '/'} replace />} />
      </Routes>
    </>
  );
}
