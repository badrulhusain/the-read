import { Link, NavLink, Outlet } from 'react-router-dom';
import type { ReactNode } from 'react';
import { Bell, Bookmark, BookOpen, History, Home, LogOut, Shield, UploadCloud, UserCog } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/store/authStore';

export function AppLayout() {
  const { user, logout } = useAuth();
  const isStaff = user?.role === 'EDITOR' || user?.role === 'ADMIN';

  return (
    <div className="min-h-screen bg-[#eef0e9] text-[#231b17]">
      <header className="sticky top-0 z-30 border-b border-white/40 bg-[#eef0e9]/95 shadow-[0_8px_22px_rgba(97,85,68,0.1),inset_0_-5px_12px_rgba(97,85,68,0.06)] backdrop-blur">
        <div className="mx-auto grid min-h-[72px] max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-4 px-4 md:px-6">
          <Link to="/" className="flex shrink-0 items-center gap-3" aria-label="The Read home">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#7b2d32] font-serif text-lg font-bold italic text-[#fffaf1] shadow-sm">R</span>
            <span className="leading-none">
              <span className="block font-serif text-xl font-semibold tracking-tight"><span className="font-normal italic">the</span> Read</span>
              <span className="hidden text-[10px] font-semibold uppercase tracking-[0.28em] text-[#a9793d] sm:block">Journal Portal</span>
            </span>
          </Link>
          <nav className="hidden items-center justify-self-center rounded-full border border-white/60 bg-white/35 p-1 text-sm shadow-sm lg:flex">
            <NavLink to="/blogs" className={({ isActive }) => navClass(isActive)}>Blogs</NavLink>
            {isStaff && <NavLink to="/editor/articles/new" className={({ isActive }) => navClass(isActive)}>Write</NavLink>}
            {user && <NavLink to="/saved" className={({ isActive }) => navClass(isActive)}><Bookmark className="h-4 w-4" /> Saved</NavLink>}
            {isStaff && <NavLink to="/editor" className={({ isActive }) => navClass(isActive)}><UserCog className="h-4 w-4" /> Editor</NavLink>}
            {user?.role === 'ADMIN' && <NavLink to="/admin" className={({ isActive }) => navClass(isActive)}><Shield className="h-4 w-4" /> Admin</NavLink>}
          </nav>
          <div className="flex items-center justify-self-end gap-2">
            {user ? (
              <>
                <button className="hidden h-10 w-10 items-center justify-center rounded-xl border border-white/60 bg-[#eef0e9] text-[#5c4b3d] shadow-[6px_6px_14px_rgba(97,85,68,0.15),-5px_-5px_12px_rgba(255,255,250,0.8)] sm:flex" type="button" aria-label="Notifications">
                  <Bell className="h-4 w-4" />
                </button>
                <Link to="/profile" className="hidden h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-[#53693a] font-serif font-semibold text-[#fffaf1] shadow-[7px_7px_15px_rgba(83,105,58,0.24),-4px_-4px_11px_rgba(255,255,250,0.72)] sm:flex" aria-label="Profile">
                  {user.avatarUrl ? <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" /> : initials(user.name)}
                </Link>
                <Button variant="outline" size="sm" onClick={logout}><LogOut className="h-4 w-4" /><span className="hidden xl:inline">Logout</span></Button>
              </>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm"><Link to="/login">Login</Link></Button>
                <Button asChild size="sm"><Link to="/register">Register</Link></Button>
              </>
            )}
          </div>
        </div>
      </header>
      <div className="min-h-[calc(100vh-72px)] bg-[#eef0e9] pb-24 lg:pb-0">
        <Outlet />
      </div>
      <nav className="fixed inset-x-3 bottom-3 z-40 flex rounded-2xl border border-white/60 bg-[#eef0e9]/95 p-2 shadow-[10px_10px_24px_rgba(97,85,68,0.2),-6px_-6px_16px_rgba(255,255,250,0.84)] backdrop-blur lg:hidden">
        <MobileNavLink to="/" label="Home" icon={<Home className="h-4 w-4" />} />
        <MobileNavLink to="/blogs" label="Feed" icon={<BookOpen className="h-4 w-4" />} />
        {isStaff && <MobileNavLink to="/editor/articles/new" label="Write" icon={<UploadCloud className="h-4 w-4" />} />}
        {user && <MobileNavLink to="/history" label="History" icon={<History className="h-4 w-4" />} />}
        {isStaff && <MobileNavLink to="/editor/submissions" label="Editor" icon={<UserCog className="h-4 w-4" />} />}
        {user?.role === 'ADMIN' && <MobileNavLink to="/admin" label="Admin" icon={<Shield className="h-4 w-4" />} />}
      </nav>
      <Toaster position="top-right" />
    </div>
  );
}

function navClass(active: boolean) {
  return `inline-flex items-center gap-1 rounded-full px-3.5 py-2 font-medium transition-colors ${active ? 'bg-[#7b2d32] text-[#fffaf1] shadow-sm' : 'text-[#5c4b3d] hover:bg-white/60 hover:text-[#231b17]'}`;
}

function MobileNavLink({ to, label, icon }: { to: string; label: string; icon: ReactNode }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => `flex flex-1 flex-col items-center justify-center gap-1 rounded-xl px-2 py-1.5 text-[11px] font-medium ${isActive ? 'bg-[#e5e9df] text-[#7b2d32] shadow-[inset_4px_4px_9px_rgba(97,85,68,0.14),inset_-4px_-4px_9px_rgba(255,255,250,0.8)]' : 'text-[#74685f]'}`}
    >
      {icon}
      {label}
    </NavLink>
  );
}

function initials(name?: string) {
  return (name ?? 'TR').split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}
