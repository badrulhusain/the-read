import React, { useEffect, useRef, useState } from 'react';
import './the-read.css';

import { Sidebar, TopBar, MobileHeader, MobileTabBar } from './components/Layout';
import { LoginDesktop, LoginMobile, RegisterDesktop } from './screens/Auth';
import { DashboardDesktop, DashboardMobile } from './screens/Dashboard';
import { FeedDesktop, FeedMobile } from './screens/Feed';
import { PostDesktop, PostMobile } from './screens/Post';
import { WriteDesktop, WriteMobile } from './screens/Write';
import { ProfileDesktop, ProfileMobile } from './screens/Profile';
import { NotificationsDesktop, NotificationsMobile } from './screens/Notifications';
import { AuthProvider, useAuth } from './AuthContext';
import { postsApi } from './api';
import type { Post, RouteKey } from './types';

const VALID_ROUTES: RouteKey[] = ['dashboard', 'feed', 'write', 'post', 'notifications', 'profile'];

// ── Inner app (needs auth context) ────────────────────────────────────────────
const AppInner: React.FC = () => {
  const { user, loading, logout } = useAuth();
  const [route, setRoute] = useState<RouteKey>(() => {
    const saved = sessionStorage.getItem('tr_route') as RouteKey | null;
    return saved && VALID_ROUTES.includes(saved) ? saved : 'dashboard';
  });
  const [currentPost, setCurrentPost] = useState<Post | null>(null);
  const [editPost, setEditPost] = useState<Post | null>(null);
  const [authScreen, setAuthScreen] = useState<'login' | 'register'>('login');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const savedPostSlug = useRef(
    sessionStorage.getItem('tr_route') === 'post' ? sessionStorage.getItem('tr_post_slug') : null
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Restore post on refresh
  useEffect(() => {
    if (!loading && route === 'post' && !currentPost && savedPostSlug.current) {
      postsApi.getBySlug(savedPostSlug.current)
        .then(p => setCurrentPost(p))
        .catch(() => { setRoute('feed'); sessionStorage.setItem('tr_route', 'feed'); });
    }
  }, [loading]);

  const go = (r: RouteKey, post?: Post) => {
    setRoute(r);
    sessionStorage.setItem('tr_route', r);
    if (r === 'post' && post) {
      setCurrentPost(post);
      sessionStorage.setItem('tr_post_slug', post.slug);
    } else if (r === 'write' && post) {
      setEditPost(post);
    } else if (r !== 'write') {
      setEditPost(null);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--paper)' }}>
        <div className="tr-serif" style={{ fontSize: 20, color: 'var(--ink-2)' }}>Loading…</div>
      </div>
    );
  }

  const authed = !!user;

  // ── Desktop ──────────────────────────────────────────────────────────────────
  const renderDesktopContent = () => {
    if (!authed) {
      return authScreen === 'login'
        ? <LoginDesktop onRegister={() => setAuthScreen('register')} />
        : <RegisterDesktop onBack={() => setAuthScreen('login')} />;
    }
    return (
      <div className="tr-layout">
        <Sidebar route={route} go={go} user={user!} onLogout={logout} />
        <div className="tr-main">
          <TopBar route={route} onBell={() => go('notifications')} />
          <div className="frame-scroll" style={{ flex: 1, minHeight: 0 }}>
            {route === 'dashboard' && <DashboardDesktop user={user!} nav={go} />}
            {route === 'feed' && <FeedDesktop nav={go} />}
            {route === 'write' && <WriteDesktop user={user!} nav={go} editPost={editPost ?? undefined} />}
            {route === 'post' && currentPost && <PostDesktop post={currentPost} user={user!} nav={go} />}
            {route === 'notifications' && <NotificationsDesktop />}
            {route === 'profile' && <ProfileDesktop user={user!} nav={go} />}
          </div>
        </div>
      </div>
    );
  };

  // ── Mobile ───────────────────────────────────────────────────────────────────
  const renderMobileContent = () => {
    if (!authed) {
      return <LoginMobile onRegister={() => setAuthScreen('register')} />;
    }
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--paper)', position: 'relative' }}>
        <MobileHeader user={user!} />
        <div className="frame-scroll" style={{ flex: 1, minHeight: 0 }}>
          {route === 'dashboard' && <DashboardMobile user={user!} nav={go} />}
          {route === 'feed' && <FeedMobile nav={go} />}
          {route === 'write' && <WriteMobile user={user!} nav={go} editPost={editPost ?? undefined} />}
          {route === 'post' && currentPost && <PostMobile post={currentPost} nav={go} user={user!} />}
          {route === 'notifications' && <NotificationsMobile />}
          {route === 'profile' && <ProfileMobile user={user!} nav={go} />}
        </div>
        <MobileTabBar route={route} go={go} />
      </div>
    );
  };

  return (
    <div className="tr-root paper-bg" style={{ minHeight: '100vh', position: 'relative' }}>
      {isMobile ? renderMobileContent() : renderDesktopContent()}
    </div>
  );
};

// ── Main app ──────────────────────────────────────────────────────────────────
export const TheReadApp: React.FC = () => (
  <AuthProvider>
    <AppInner />
  </AuthProvider>
);
