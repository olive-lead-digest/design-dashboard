'use client';

import { forwardRef, useId } from 'react';
import { cn } from '@/lib/utils';

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, Props>(function Input({ label, error, className, id, ...rest }, ref) {
  const autoId = useId();
  const inputId = id || autoId;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="label">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-err` : undefined}
        className={cn('input', error && 'border-warning focus:border-warning focus:ring-warning/20 anim-shake', className)}
        {...rest}
      />
      {error && (
        <p id={`${inputId}-err`} className="mt-1 text-xs text-warning font-medium" role="alert">
          {error}
        </p>
      )}
    </div>
  );
});

export default Input;
