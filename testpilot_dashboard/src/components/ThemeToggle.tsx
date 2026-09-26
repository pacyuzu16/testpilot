import { Sun, Moon, Monitor } from 'lucide-react'
import type { Theme } from '../types'
import clsx from 'clsx'

interface ThemeToggleProps {
  theme: Theme
  setTheme: (t: Theme) => void
}

const options: { value: Theme; icon: React.ReactNode; label: string }[] = [
  { value: 'light', icon: <Sun size={14} />, label: 'Light' },
  { value: 'dark', icon: <Moon size={14} />, label: 'Dark' },
  { value: 'system', icon: <Monitor size={14} />, label: 'System' },
]

export function ThemeToggle({ theme, setTheme }: ThemeToggleProps) {
  return (
    <div
      role="group"
      aria-label="Theme"
      className="flex items-center gap-1 rounded-lg bg-gray-100 dark:bg-gray-800 p-1"
    >
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => setTheme(opt.value)}
          aria-pressed={theme === opt.value}
          aria-label={`${opt.label} theme`}
          className={clsx(
            'flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors',
            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-500',
            theme === opt.value
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          )}
        >
          {opt.icon}
          <span className="hidden sm:inline">{opt.label}</span>
        </button>
      ))}
    </div>
  )
}
