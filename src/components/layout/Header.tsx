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
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-gray-100">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2 shrink-0 hover:scale-[1.03] transition-transform" aria-label="Olive Living home">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
            <span className="text-white font-heading font-bold text-sm">OL</span>
          </div>
          <div className="hidden sm:block leading-tight">
            <p className="font-heading font-bold text-sm text-primary">OLIVE LIVING</p>
            <p className="text-[10px] text-gray-400 tracking-wide">DESIGN &amp; PROJECT MGMT</p>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1 ml-4" aria-label="Main navigation">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
            return (
              <Link
                key={href + label}
                href={href}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors relative',
                  active ? 'text-secondary' : 'text-gray-500 hover:text-ink hover:bg-gray-50',
                )}
              >
                <Icon size={15} />
                {label}
                {active && <motion.span layoutId="nav-underline" className="absolute inset-x-3 -bottom-[1px] h-0.5 bg-secondary rounded-full" />}
              </Link>
            );
          })}
        </nav>

        <div className="flex-1" />

        {testerMode && (
          <div
            className="hidden lg:flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-3 py-1.5 text-[11px] font-semibold text-accent"
            title={`All emails route ${TESTER_SENDER} → ${TESTER_RECEIVER}. Nothing is actually sent.`}
          >
            <FlaskConical size={13} />
            <span>TESTER MODE — Emails: {TESTER_SENDER} → {TESTER_RECEIVER}</span>
          </div>
        )}

        <button aria-label="Notifications" className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-50 hover:text-ink transition-colors">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-warning anim-badge-pulse" aria-hidden />
        </button>

        <div className="relative">
          <button
            onClick={() => setProfileOpen((v) => !v)}
            className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-gray-50 transition-colors"
            aria-haspopup="menu"
            aria-expanded={profileOpen}
          >
            <span className="w-8 h-8 rounded-full bg-secondary/15 text-secondary text-xs font-bold flex items-center justify-center">
              {email ? initials(email) : '–'}
            </span>
            <ChevronDown size={14} className="text-gray-400 hidden sm:block" />
          </button>
          <AnimatePresence>
            {profileOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-64 card p-3 z-50"
                role="menu"
              >
                <p className="text-xs text-gray-400 px-2">Signed in as</p>
                <p className="text-sm font-semibold px-2 pb-2 border-b border-gray-100 truncate">{email}</p>
                {testerMode && (
                  <p className="text-[11px] text-accent px-2 py-2 leading-snug">
                    🧪 $0 · NOT PRODUCTION<br />Emails: {TESTER_SENDER} → {TESTER_RECEIVER}
                  </p>
                )}
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-2 px-2 py-2 mt-1 rounded-lg text-sm text-warning hover:bg-warning/5 transition-colors"
                  role="menuitem"
                >
                  <LogOut size={15} /> Logout
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-50" onClick={() => setMenuOpen((v) => !v)} aria-label="Toggle menu">
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden overflow-hidden border-t border-gray-100 bg-white"
            aria-label="Mobile navigation"
          >
            <div className="px-4 py-3 space-y-1">
              {testerMode && (
                <p className="text-[11px] font-semibold text-accent bg-accent/10 border border-accent/30 rounded-lg px-3 py-2">
                  🧪 TESTER MODE — {TESTER_SENDER} → {TESTER_RECEIVER}
                </p>
              )}
              {NAV.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href + label}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  <Icon size={16} /> {label}
                </Link>
              ))}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
