'use client';

import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = 'primary', loading, disabled, children, className, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        {
          primary: 'btn-primary',
          secondary: 'btn-secondary',
          ghost: 'btn-ghost',
          danger: 'btn-danger',
        }[variant],
        className,
      )}
      {...rest}
    >
      {loading && <Loader2 size={16} className="animate-spin" aria-hidden />}
      {children}
    </button>
  );
});

export default Button;
