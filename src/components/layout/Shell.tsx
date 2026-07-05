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
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 py-6 anim-fade-slide-up">{children}</main>
      <footer className="border-t border-gray-100 py-4 text-center text-xs text-gray-400">
        Olive Living · Design &amp; Project Management · Internal tool — @oliveliving.com only
      </footer>
    </div>
  );
}
