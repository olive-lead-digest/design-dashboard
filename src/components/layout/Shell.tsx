'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Header from './Header';
import { PageLoader } from '@/components/common/Loading';

/** Authenticated app shell — header + content. Redirects to /login when signed out. */
export default function Shell({ children }: { children: React.ReactNode }) {
  const { email, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !email) router.replace('/login');
  }, [loading, email, router, pathname]);

  if (loading) return <PageLoader label="Checking session…" />;
  if (!email) return null;

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-primary">
      {/* Ambient background glows */}
      <div className="absolute top-0 left-[10%] w-[30%] h-[30%] rounded-full bg-secondary/10 blur-[120px] pointer-events-none animate-float" style={{ animationDelay: '0s' }} />
      <div className="absolute bottom-0 right-[10%] w-[40%] h-[40%] rounded-full bg-accent/5 blur-[120px] pointer-events-none animate-float" style={{ animationDelay: '2s' }} />

      <Header />
      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 py-8 anim-fade-slide-up relative z-10">{children}</main>
      <footer className="border-t border-border/60 py-6 text-center text-xs text-inkMuted relative z-10">
        Olive Living · Design &amp; Project Management · Internal tool — @oliveliving.com only
      </footer>
    </div>
  );
}
