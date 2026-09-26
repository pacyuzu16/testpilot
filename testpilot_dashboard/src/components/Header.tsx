import { formatDistanceToNow, parseISO } from 'date-fns'
import { FlaskConical } from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'
import type { Theme } from '../types'

interface HeaderProps {
  timestamp: string | null
  theme: Theme
  setTheme: (t: Theme) => void
}

export function Header({ timestamp, theme, setTheme }: HeaderProps) {
  const timeAgo = timestamp
    ? formatDistanceToNow(parseISO(timestamp), { addSuffix: true })
    : null

  return (
    <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
            <FlaskConical size={18} className="text-white" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base font-bold leading-none truncate">TestPilot</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-none mt-0.5">
              Coverage Dashboard
            </p>
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {timeAgo && (
            <p className="hidden sm:block text-xs text-gray-500 dark:text-gray-400" aria-live="polite">
              Last scan: <span className="font-medium text-gray-700 dark:text-gray-300">{timeAgo}</span>
            </p>
          )}
          <ThemeToggle theme={theme} setTheme={setTheme} />
        </div>
      </div>
    </header>
  )
}
