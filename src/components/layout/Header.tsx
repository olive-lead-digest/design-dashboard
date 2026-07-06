'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, ChevronDown, FlaskConical, LayoutDashboard, ListChecks, LogOut, Menu, TrendingUp, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { TESTER_SENDER, TESTER_RECEIVER } from '@/lib/constants';
import { cn, initials } from '@/lib/utils';

const NAV = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/projects', label: 'Projects', icon: ListChecks },
  { href: '/tasks', label: 'Tasks', icon: ListChecks },
  { href: '/projections', label: 'Projections', icon: TrendingUp },
];

export default function Header() {
  const { email, logout } = useAuth();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const testerMode = process.env.NEXT_PUBLIC_TESTER_MODE === 'true';

  return (
    <header className="sticky top-0 z-50 bg-surface/70 backdrop-blur-xl border-b border-white/10 shadow-sm relative">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
        <Link href="/" className="flex items-center gap-3 shrink-0 hover:scale-[1.02] transition-transform" aria-label="Olive Living home">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-secondary to-teal-700 flex items-center justify-center shadow-glow">
            <span className="text-white font-heading font-bold text-sm tracking-wide">OL</span>
          </div>
          <div className="hidden sm:block leading-tight">
            <p className="font-heading font-bold text-sm text-ink tracking-wide">OLIVE LIVING</p>
            <p className="text-[10px] text-inkMuted tracking-widest font-medium uppercase mt-0.5">Design &amp; Project</p>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1.5 ml-6" aria-label="Main navigation">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
            return (
              <Link
                key={href + label}
                href={href}
                className={cn(
                  'flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all relative',
                  active ? 'text-secondary' : 'text-inkMuted hover:text-ink hover:bg-white/5',
                )}
              >
                <Icon size={16} className={cn("transition-colors", active ? "text-secondary" : "text-inkMuted")} />
                {label}
                {active && (
                  <motion.span 
                    layoutId="nav-underline" 
                    className="absolute inset-x-3 -bottom-[21px] h-[3px] bg-secondary rounded-t-full shadow-[0_0_12px_rgba(20,184,166,0.8)]" 
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex-1" />

        {testerMode && (
          <div
            className="hidden lg:flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1.5 text-[11px] font-semibold text-accent shadow-[0_0_10px_-2px_rgba(245,158,11,0.2)]"
            title={`All emails route ${TESTER_SENDER} → ${TESTER_RECEIVER}. Nothing is actually sent.`}
          >
            <FlaskConical size={13} className="animate-pulse" />
            <span>TESTER MODE — Emails: {TESTER_SENDER} → {TESTER_RECEIVER}</span>
          </div>
        )}

        <button aria-label="Notifications" className="relative p-2.5 rounded-xl text-inkMuted hover:bg-white/5 hover:text-ink transition-colors">
          <Bell size={18} />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-warning shadow-[0_0_8px_rgba(239,68,68,0.8)] anim-badge-pulse" aria-hidden />
        </button>

        <div className="relative">
          <button
            onClick={() => setProfileOpen((v) => !v)}
            className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-white/5 transition-colors border border-transparent hover:border-white/5"
            aria-haspopup="menu"
            aria-expanded={profileOpen}
          >
            <span className="w-8 h-8 rounded-full bg-secondary/15 text-secondary text-xs font-bold flex items-center justify-center border border-secondary/30 shadow-[0_0_10px_-2px_rgba(20,184,166,0.3)]">
              {email ? initials(email) : '–'}
            </span>
            <ChevronDown size={14} className="text-inkMuted hidden sm:block" />
          </button>
          <AnimatePresence>
            {profileOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.95 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="absolute right-0 mt-3 w-64 glass-panel p-3 z-50 rounded-2xl"
                role="menu"
              >
                <p className="text-xs text-inkMuted px-2">Signed in as</p>
                <p className="text-sm font-semibold px-2 pb-3 mb-1 border-b border-white/10 truncate text-ink">{email}</p>
                {testerMode && (
                  <p className="text-[11px] text-accent px-2 py-2 leading-relaxed bg-accent/5 rounded-lg my-2 border border-accent/10">
                    🧪 $0 · NOT PRODUCTION<br />Emails: {TESTER_SENDER} → {TESTER_RECEIVER}
                  </p>
                )}
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-2 px-2 py-2.5 mt-1 rounded-xl text-sm text-warning hover:bg-warning/10 transition-colors font-medium"
                  role="menuitem"
                >
                  <LogOut size={16} /> Logout
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button className="md:hidden p-2 rounded-xl text-inkMuted hover:bg-white/5" onClick={() => setMenuOpen((v) => !v)} aria-label="Toggle menu">
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden overflow-hidden border-t border-white/10 bg-surface/95 backdrop-blur-2xl"
            aria-label="Mobile navigation"
          >
            <div className="px-4 py-4 space-y-1.5">
              {testerMode && (
                <p className="text-[11px] font-semibold text-accent bg-accent/10 border border-accent/20 rounded-xl px-3 py-2.5 mb-2 shadow-inner">
                  🧪 TESTER MODE — {TESTER_SENDER} → {TESTER_RECEIVER}
                </p>
              )}
              {NAV.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href + label}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium text-ink hover:bg-white/5 transition-colors"
                >
                  <Icon size={18} className="text-secondary" /> {label}
                </Link>
              ))}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
