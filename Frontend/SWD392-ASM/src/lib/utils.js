import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes — required by shadcn/ui.
 * @example cn('px-4 py-2', isActive && 'bg-primary', className)
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
