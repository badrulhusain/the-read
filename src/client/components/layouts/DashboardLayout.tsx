import { NavLink, Outlet } from 'react-router-dom';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  title: string;
  subtitle?: string;
  nav: { to: string; label: string; icon?: ReactNode }[];
}

export function DashboardLayout({ title, subtitle, nav }: DashboardLayoutProps) {
  return (
    <main className="grid min-h-[calc(100vh-65px)] gap-0 bg-[#eef0e9] pb-24 md:min-h-[calc(100vh-105px)] md:pb-0 lg:grid-cols-[252px_1fr]">
      <aside className="border-b border-white/40 bg-[#e5e9df] p-3 shadow-[inset_-8px_0_18px_rgba(97,85,68,0.08),8px_0_22px_rgba(97,85,68,0.07)] lg:border-b-0 lg:border-r lg:border-white/40">
        <div className="px-2 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-[#a9793d]">The Read</p>
          <h1 className="mt-1 font-serif text-2xl font-semibold tracking-tight text-[#231b17]">{title}</h1>
          {subtitle && <p className="mt-1 text-sm leading-6 text-[#74685f]">{subtitle}</p>}
        </div>
        <nav className="mt-2 flex gap-1 overflow-x-auto lg:flex-col">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/dashboard' || item.to === '/editor' || item.to === '/admin'}
              className={({ isActive }) => cn(
                'inline-flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-colors',
                isActive ? 'bg-[#eef0e9] text-[#7b2d32] shadow-[inset_5px_5px_10px_rgba(97,85,68,0.15),inset_-5px_-5px_10px_rgba(255,255,250,0.84)]' : 'text-[#5c4b3d] hover:bg-[#eef0e9] hover:text-[#231b17] hover:shadow-[5px_5px_12px_rgba(97,85,68,0.12),-4px_-4px_10px_rgba(255,255,250,0.75)]',
              )}
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <section className="min-w-0 bg-[#eef0e9]">
        <Outlet />
      </section>
    </main>
  );
}
