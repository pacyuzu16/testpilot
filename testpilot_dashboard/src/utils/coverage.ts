/** Returns 'red' for <60%, 'amber' for <90%, 'green' for ≥90% */
export function coverageColor(pct: number): 'red' | 'amber' | 'green' {
  if (pct < 60) return 'red'
  if (pct < 90) return 'amber'
  return 'green'
}

export const COLOR_CLASSES = {
  red: {
    bg: 'bg-red-500',
    text: 'text-red-600 dark:text-red-400',
    badge: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  },
  amber: {
    bg: 'bg-amber-500',
    text: 'text-amber-600 dark:text-amber-400',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  },
  green: {
    bg: 'bg-emerald-500',
    text: 'text-emerald-600 dark:text-emerald-400',
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  },
} as const
