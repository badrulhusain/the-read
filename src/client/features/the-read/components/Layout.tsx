import React from 'react';
import { Icon } from './Icon';
import { Avatar, Logo, NavItem, NeuInput, TabBarItem } from './ui';
import type { Author, RouteKey } from '../types';

// ── Sidebar (desktop) ────────────────────────────────────────────────────────
interface SidebarProps {
  route: RouteKey;
  go: (r: RouteKey) => void;
  user: Author;
  onLogout?: () => void;
}
export const Sidebar: React.FC<SidebarProps> = ({ route, go, user, onLogout }) => (
  <aside className="tr-sidebar">
    <div style={{ padding: '0 6px' }}><Logo /></div>

    <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div className="tr-mono" style={{ fontSize: 9, letterSpacing: '.2em', color: 'var(--ink-3)', textTransform: 'uppercase', padding: '0 6px 6px' }}>Journal</div>
      <NavItem icon="home" label="Dashboard" active={route === 'dashboard'} onClick={() => go('dashboard')} />
      <NavItem icon="feed" label="Feed" active={route === 'feed'} onClick={() => go('feed')} />
      <NavItem icon="feather" label="Write" active={route === 'write'} onClick={() => go('write')} />
      <NavItem icon="bookmark" label="Bookmarks" onClick={() => go('notifications')} />
      <div className="tr-mono" style={{ fontSize: 9, letterSpacing: '.2em', color: 'var(--ink-3)', textTransform: 'uppercase', padding: '12px 6px 6px' }}>Campus</div>
      <NavItem icon="bell" label="Notifications" active={route === 'notifications'} onClick={() => go('notifications')} badge={3} />
      <NavItem icon="user" label="Profile" active={route === 'profile'} onClick={() => go('profile')} />
    </nav>

    <div style={{ flex: 1 }} />

    {/* User footer */}
    <div className="neu-flat" style={{ padding: 10, borderRadius: 14, display: 'flex', alignItems: 'center', gap: 10, background: 'var(--paper-2)' }}>
      <Avatar user={user} size={36} />
      <div style={{ flex: 1, lineHeight: 1.2, minWidth: 0 }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</div>
        <div style={{ fontSize: 10, color: 'var(--ink-3)' }}>{user.role}</div>
      </div>
      <button className="neu-inset" onClick={onLogout} style={{ background: 'var(--paper)', border: 'none', color: 'var(--ink-3)', cursor: 'pointer', width: 30, height: 30, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="logout" size={16} />
      </button>
    </div>
  </aside>
);

// ── TopBar (desktop) ─────────────────────────────────────────────────────────
const ROUTE_TITLES: Record<RouteKey, string> = {
  dashboard: 'Dashboard', feed: 'The Feed', write: 'Compose',
  post: 'Reading', notifications: 'Notifications', profile: 'Profile',
};

export const TopBar: React.FC<{ route: RouteKey; onBell?: () => void }> = ({ route, onBell }) => (
  <div style={{
    height: 60, padding: '0 24px',
    display: 'flex', alignItems: 'center', gap: 14,
    borderBottom: 'none',
    background: 'linear-gradient(145deg, #f4f6ef, var(--paper))',
    boxShadow: 'inset 0 -6px 14px rgba(97,85,68,.08), 0 8px 20px rgba(97,85,68,.08)',
    flexShrink: 0,
    position: 'relative',
    zIndex: 5,
  }}>
    <div className="tr-mono" style={{ fontSize: 10, letterSpacing: '.25em', color: 'var(--tan-2)', textTransform: 'uppercase' }}>
      {ROUTE_TITLES[route] ?? 'The Read'}
    </div>
    <div style={{ flex: 1 }} />
    <NeuInput icon="search" value="" onChange={() => {}} placeholder="Search essays, authors…" style={{ width: 320, padding: '9px 14px' }} />
    <button onClick={onBell} className="neu-flat neu-press hover-lift" style={{
      border: 'none', width: 40, height: 40, borderRadius: 12, cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
      background: 'var(--paper)',
    }}>
      <Icon name="bell" size={17} />
      <span style={{ position: 'absolute', top: 8, right: 8, width: 7, height: 7, background: 'var(--burgundy)', borderRadius: 999 }} />
    </button>
  </div>
);

// ── MobileHeader ─────────────────────────────────────────────────────────────
export const MobileHeader: React.FC<{ user: Author }> = ({ user }) => (
  <div style={{
    height: 56, padding: '0 16px',
    display: 'flex', alignItems: 'center', gap: 10,
    background: 'linear-gradient(145deg, #f4f6ef, var(--paper))',
    borderBottom: 'none',
    boxShadow: '0 8px 20px rgba(97,85,68,.1)',
    flexShrink: 0,
    position: 'relative',
    zIndex: 5,
  }}>
    <Logo size={28} showName />
    <div style={{ flex: 1 }} />
    <button className="neu-flat neu-press" style={{ border: 'none', width: 36, height: 36, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', background: 'var(--paper)' }}>
      <Icon name="bell" size={16} />
      <span style={{ position: 'absolute', top: 7, right: 7, width: 6, height: 6, background: 'var(--burgundy)', borderRadius: 999 }} />
    </button>
    <Avatar user={user} size={32} />
  </div>
);

// ── MobileTabBar ──────────────────────────────────────────────────────────────
interface MobileTabBarProps { route: RouteKey; go: (r: RouteKey) => void; }
export const MobileTabBar: React.FC<MobileTabBarProps> = ({ route, go }) => (
  <div className="tr-mobile-tabs">
    <TabBarItem icon="home" label="Home" active={route === 'dashboard'} onClick={() => go('dashboard')} />
    <TabBarItem icon="feed" label="Feed" active={route === 'feed'} onClick={() => go('feed')} />
    <button onClick={() => go('write')} style={{
      width: 50, height: 50, borderRadius: '50%',
      background: 'linear-gradient(145deg, var(--burgundy-2), var(--burgundy))',
      border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fbf8f2', cursor: 'pointer',
      boxShadow: '4px 4px 10px rgba(122,46,46,.4), -2px -2px 8px var(--sh-lo), inset 1px 1px 1px rgba(255,255,255,.15)',
      marginTop: -20,
    }}>
      <Icon name="feather" size={20} stroke="#fbf8f2" />
    </button>
    <TabBarItem icon="bell" label="Inbox" active={route === 'notifications'} onClick={() => go('notifications')} />
    <TabBarItem icon="user" label="Me" active={route === 'profile'} onClick={() => go('profile')} />
  </div>
);
