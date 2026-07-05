'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, type FieldErrors, type Resolver } from 'react-hook-form';
import { z } from 'zod';
import { FlaskConical, LogIn } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/common/Toast';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import { TESTER_RECEIVER, TESTER_SENDER } from '@/lib/constants';
import { displayName } from '@/lib/utils';

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Enter a valid email address')
    .refine((e) => e.trim().toLowerCase().endsWith('@oliveliving.com'), {
      message: 'Only @oliveliving.com accounts allowed',
    }),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  remember: z.boolean(),
});

type LoginValues = z.infer<typeof loginSchema>;

/** Tiny zod resolver — avoids the @hookform/resolvers dependency. */
const zodLoginResolver: Resolver<LoginValues> = async (values) => {
  const parsed = loginSchema.safeParse(values);
  if (parsed.success) return { values: parsed.data, errors: {} };
  const fieldErrors: Record<string, { type: string; message: string }> = {};
  for (const issue of parsed.error.issues) {
    const key = String(issue.path[0] ?? 'email');
    if (!fieldErrors[key]) fieldErrors[key] = { type: String(issue.code), message: issue.message };
  }
  return { values: {}, errors: fieldErrors as FieldErrors<LoginValues> };
};

export default function LoginPage() {
  const { email: sessionEmail, loading, login } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [shake, setShake] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodLoginResolver,
    mode: 'onChange',
    defaultValues: { email: '', password: '', remember: false },
  });

  // Already authenticated → straight to the dashboard.
  useEffect(() => {
    if (!loading && sessionEmail) router.replace('/');
  }, [loading, sessionEmail, router]);

  const onSubmit = handleSubmit(async (values) => {
    const res = await login(values.email.trim(), values.password, values.remember);
    if (res.ok) {
      toast(`👋 Welcome back, ${displayName(values.email)}!`);
      router.push('/');
    } else {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      toast(res.error ?? 'Login failed. Please try again.', 'error');
    }
  });

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-[#13223f] to-slate-800 px-4 py-10">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8 anim-fade-in">
          <svg width="72" height="72" viewBox="0 0 96 96" role="img" aria-label="Olive Living logo" className="drop-shadow-lg">
            <rect x="4" y="4" width="88" height="88" rx="22" fill="#0F172A" stroke="#1E293B" strokeWidth="1.5" />
            <text
              x="48"
              y="61"
              textAnchor="middle"
              fontFamily="Poppins, Inter, Arial, sans-serif"
              fontSize="32"
              fontWeight="700"
              fill="#FFFFFF"
              letterSpacing="1"
            >
              OL
            </text>
            <path d="M70 20c-9.5 0.5-15.5 6-16.5 14.5 8.5 0.5 15.5-5 16.5-14.5z" fill="#14B8A6" />
            <path d="M69 21.5c-7 3.5-12 7.5-14.5 12.5" stroke="#0D9488" strokeWidth="1.6" fill="none" strokeLinecap="round" />
          </svg>
          <h1 className="mt-4 font-heading font-bold text-xl text-white tracking-wide">
            OLIVE <span className="text-secondary">LIVING</span>
          </h1>
          <p className="text-xs text-slate-400 tracking-widest uppercase mt-1">Design &amp; Project Management</p>
        </div>

        {/* Card */}
        <div className={`card p-7 sm:p-8 shadow-lift ${shake ? 'anim-shake' : ''}`}>
          <h2 className="font-heading font-bold text-lg text-primary mb-1">Sign in</h2>
          <p className="text-sm text-gray-500 mb-6">Internal dashboard — @oliveliving.com accounts only</p>

          <form onSubmit={onSubmit} className="stagger space-y-4" noValidate>
            <Input
              label="Work Email"
              type="email"
              autoComplete="email"
              placeholder="you@oliveliving.com"
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="Password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register('password')}
            />

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-gray-300 accent-[#14B8A6]"
                  {...register('remember')}
                />
                Remember me
              </label>
              <a
                href="mailto:harshit.s@oliveliving.com?subject=Password%20reset%20request"
                className="text-sm font-semibold text-secondary hover:underline"
              >
                Forgot password?
              </a>
            </div>

            <Button type="submit" variant="primary" loading={isSubmitting} className="w-full !py-3">
              <LogIn size={16} /> Login
            </Button>
          </form>

          <div className="mt-5 rounded-xl border border-accent/40 bg-accent/10 px-4 py-3 text-xs text-accent leading-relaxed">
            <p className="font-bold flex items-center gap-1.5 mb-0.5">
              <FlaskConical size={13} aria-hidden /> Tester mode
            </p>
            Any @oliveliving.com email + any 8+ char password. Emails route {TESTER_SENDER} → {TESTER_RECEIVER}.
          </div>

          <p className="mt-5 text-center text-xs text-gray-400">
            Trouble signing in?{' '}
            <a href="mailto:harshit.s@oliveliving.com?subject=Dashboard%20support" className="font-semibold text-secondary hover:underline">
              Contact support
            </a>
          </p>
        </div>

        <p className="text-center text-[11px] text-slate-500 mt-6">
          Olive Living · Internal tool · Sessions auto-expire after 30 minutes of inactivity
        </p>
      </div>
    </main>
  );
}
