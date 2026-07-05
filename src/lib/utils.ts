import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/** ₹4.04 Cr / ₹23.7 L style Indian currency formatting */
export function formatINR(amount: number): string {
  if (amount >= 1_00_00_000) return `₹${(amount / 1_00_00_000).toFixed(2)} Cr`;
  if (amount >= 1_00_000) return `₹${(amount / 1_00_000).toFixed(1)} L`;
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function formatCurrency(amount: number, currency: 'INR' | 'USD' = 'INR'): string {
  if (currency === 'INR') return formatINR(amount);
  return `$${amount.toLocaleString('en-US')}`;
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return '—';
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24); if (d < 30) return `${d}d ago`;
  return formatDate(iso);
}

export function daysUntil(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
}

export function isOverdue(dueDate: string, status: string): boolean {
  return status !== 'Done' && new Date(dueDate).getTime() < Date.now();
}

export function isValidOliveEmail(email: string): boolean {
  return /^[a-zA-Z0-9._%+-]+@oliveliving\.com$/i.test(email.trim());
}

/** Basic input sanitization — strip HTML/script vectors before persistence. */
export function sanitize(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim();
}

export function initials(email: string): string {
  const name = email.split('@')[0];
  return name.split(/[._-]/).map((p) => p[0]?.toUpperCase() ?? '').slice(0, 2).join('');
}

export function displayName(email: string): string {
  return email.split('@')[0].split(/[._-]/).map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
}

export function percent(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}
