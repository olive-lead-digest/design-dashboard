'use client';

import { useEffect, useState } from 'react';

/**
 * Animates 0 → target over `duration` ms (ease-out cubic) via requestAnimationFrame.
 * Returns a float — round or format at display time.
 */
export function useCountUp(target: number, duration = 1000): number {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!Number.isFinite(target)) {
      setValue(0);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(t < 1 ? target * eased : target);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return value;
}
