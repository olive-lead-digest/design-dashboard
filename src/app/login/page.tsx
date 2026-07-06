'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, type FieldErrors, type Resolver } from 'react-hook-form';
import { z } from 'zod';
import { FlaskConical, LogIn } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/common/Toast';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import { isAllowedSessionEmail, TESTER_RECEIVER, TESTER_SENDER } from '@/lib/constants';
import { displayName } from '@/lib/utils';

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Enter a valid email address')
    .refine((e) => isAllowedSessionEmail(e), {
      message: 'Only @oliveliving.com accounts (or the test login) allowed',
    }),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  remember: z.boolean(),
});

type LoginValues = z.infer<typeof loginSchema>;

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
    <main className="min-h-screen flex items-center justify-center bg-primary relative overflow-hidden px-4 py-10">
      {/* Ambient background glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-secondary/15 blur-[120px] pointer-events-none animate-float" style={{ animationDelay: '0s' }} />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-accent/10 blur-[120px] pointer-events-none animate-float" style={{ animationDelay: '2s' }} />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center mb-8"
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-secondary to-teal-700 flex items-center justify-center shadow-glow mb-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-white/20 blur-md rounded-full translate-y-[-50%] translate-x-[-50%]" />
            <span className="text-white font-heading font-bold text-2xl tracking-wide relative z-10">OL</span>
          </div>
          <h1 className="font-heading font-bold text-2xl text-ink tracking-wide">
            OLIVE <span className="text-secondary drop-shadow-[0_0_8px_rgba(20,184,166,0.5)]">LIVING</span>
          </h1>
          <p className="text-xs text-inkMuted tracking-widest uppercase mt-1.5 font-medium">Design &amp; Project Management</p>
        </motion.div>

        {/* Card */}
        <motion.div 
          initial={{ opacity: 0, y: 30, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          className={`glass-panel p-8 sm:p-10 rounded-[2rem] border-white/10 ${shake ? 'anim-shake' : ''}`}
        >
          <div className="mb-8 text-center">
            <h2 className="font-heading font-bold text-xl text-ink mb-1.5">Welcome back</h2>
            <p className="text-sm text-inkMuted">Sign in to your dashboard</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-5" noValidate>
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

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2.5 text-sm text-inkMuted hover:text-ink transition-colors cursor-pointer select-none group">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-border/60 bg-surface/50 text-secondary focus:ring-secondary/50 focus:ring-offset-0 transition-all cursor-pointer group-hover:border-secondary/50"
                  {...register('remember')}
                />
                Remember me
              </label>
              <a
                href="mailto:harshit.s@oliveliving.com?subject=Password%20reset%20request"
                className="text-sm font-semibold text-secondary hover:text-secondary/80 hover:underline transition-colors"
              >
                Forgot password?
              </a>
            </div>

            <Button type="submit" variant="primary" loading={isSubmitting} className="w-full !py-3.5 mt-2 text-[15px]">
              <LogIn size={18} /> Sign in to Dashboard
            </Button>
          </form>

          {testerMode && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-6 rounded-xl border border-accent/20 bg-accent/10 px-4 py-3.5 text-[11.5px] text-accent leading-relaxed shadow-inner"
            >
              <p className="font-bold flex items-center gap-1.5 mb-1 text-[12px]">
                <FlaskConical size={14} className="animate-pulse" aria-hidden /> TESTER MODE ACTIVE
              </p>
              Any @oliveliving.com email — or the test account <span className="font-mono text-[10px] bg-accent/10 px-1 rounded mx-0.5">{TESTER_SENDER}</span> — + any 8+ char password. Emails route <span className="font-mono text-[10px] bg-accent/10 px-1 rounded mx-0.5">{TESTER_SENDER}</span> → <span className="font-mono text-[10px] bg-accent/10 px-1 rounded mx-0.5">{TESTER_RECEIVER}</span>.
            </motion.div>
          )}

          <p className="mt-6 text-center text-xs text-inkMuted">
            Trouble signing in?{' '}
            <a href="mailto:harshit.s@oliveliving.com?subject=Dashboard%20support" className="font-medium text-secondary hover:underline transition-colors">
              Contact support
            </a>
          </p>
        </motion.div>

        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 1 }}
          className="text-center text-[11px] text-inkMuted/60 mt-8"
        >
          Olive Living · Internal tool · Sessions auto-expire after 30 minutes of inactivity
        </motion.p>
      </div>
    </main>
  );
}
