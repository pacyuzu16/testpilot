import { motion } from 'framer-motion'
import { AnimatedCounter } from './AnimatedCounter'
import clsx from 'clsx'

interface KpiCardProps {
  label: string
  before: number
  after: number
  suffix?: string
  /** If true, lower = better (warnings) */
  lowerIsBetter?: boolean
  icon?: React.ReactNode
}

export function KpiCard({ label, before, after, suffix = '', lowerIsBetter = false, icon }: KpiCardProps) {
  const improved = lowerIsBetter ? after < before : after > before
  const same = after === before

  const trendColor = same
    ? 'text-gray-500 dark:text-gray-400'
    : improved
    ? 'text-emerald-600 dark:text-emerald-400'
    : 'text-red-600 dark:text-red-400'

  const delta = after - before
  const sign = delta > 0 ? '+' : ''

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 flex flex-col gap-3"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}</span>
        {icon && (
          <span className="text-gray-400 dark:text-gray-500" aria-hidden="true">{icon}</span>
        )}
      </div>

      {/* Main value */}
      <div className="flex items-end gap-3">
        <span className="text-4xl font-bold tabular-nums leading-none">
          <AnimatedCounter to={after} suffix={suffix} />
        </span>
        {!same && (
          <span className={clsx('text-sm font-semibold mb-0.5', trendColor)}>
            {sign}{delta}{suffix}
          </span>
        )}
      </div>

      {/* Before / After */}
      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
        <span className="line-through">{before}{suffix}</span>
        <span aria-hidden="true">→</span>
        <span className={clsx('font-semibold', trendColor)}>{after}{suffix}</span>
      </div>
    </motion.div>
  )
}
