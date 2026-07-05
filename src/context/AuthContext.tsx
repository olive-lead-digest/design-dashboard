'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

interface AuthState {
  email: string | null;
  loading: boolean;
  login: (email: string, password: string, remember: boolean) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthCtx = createContext<AuthState>({ email: null, loading: true, login: async () => ({ ok: false }), logout: async () => {} });
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/auth', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setEmail(data.email ?? null);
      } else {
        setEmail(null);
      }
    } catch {
      setEmail(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh, pathname]);

  const login = useCallback(
    async (loginEmail: string, password: string, remember: boolean) => {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password, remember }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setEmail(data.email);
        return { ok: true };
      }
      return { ok: false, error: data.error || 'Login failed. Please try again.' };
    },
    [],
  );

  const logout = useCallback(async () => {
    await fetch('/api/auth', { method: 'DELETE' });
    setEmail(null);
    router.push('/login');
  }, [router]);

  return <AuthCtx.Provider value={{ email, loading, login, logout }}>{children}</AuthCtx.Provider>;
}
