import { motion } from 'framer-motion'
import { CheckCircle2, AlertCircle } from 'lucide-react'
import type { Bug } from '../types'
import clsx from 'clsx'

interface BugCardsProps {
  bugs: Bug[]
}

export function BugCards({ bugs }: BugCardsProps) {
  return (
    <section aria-label="Bugs found by TestPilot">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {bugs.map((bug, i) => (
          <motion.div
            key={bug.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5"
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <span className="text-xs font-mono text-gray-500 dark:text-gray-400 break-all">{bug.file}</span>
              <StatusBadge status={bug.status} />
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-snug">{bug.title}</p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

function StatusBadge({ status }: { status: Bug['status'] }) {
  return status === 'fixed' ? (
    <span
      className={clsx(
        'flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0',
        'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
      )}
      aria-label="Status: Fixed"
    >
      <CheckCircle2 size={12} aria-hidden="true" />
      Fixed
    </span>
  ) : (
    <span
      className={clsx(
        'flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0',
        'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
      )}
      aria-label="Status: Open"
    >
      <AlertCircle size={12} aria-hidden="true" />
      Open
    </span>
  )
}
