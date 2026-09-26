import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { ArrowUpDown } from 'lucide-react'
import type { FileCoverage } from '../types'
import { coverageColor, COLOR_CLASSES } from '../utils/coverage'
import clsx from 'clsx'

type SortKey = 'name' | 'before' | 'after' | 'delta'
type SortDir = 'asc' | 'desc'

function getBaseline(name: string, baselineFiles: FileCoverage[]): number {
  return baselineFiles.find(f => f.name === name)?.coverage ?? 0
}

interface SortBtnProps {
  col: SortKey
  sortKey: SortKey
  sortDir: SortDir
  onSort: (col: SortKey) => void
  children: React.ReactNode
}

function SortBtn({ col, sortKey, sortDir, onSort, children }: SortBtnProps) {
  const active = sortKey === col
  return (
    <button
      onClick={() => onSort(col)}
      aria-sort={active ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
      className={clsx(
        'flex items-center gap-1 text-xs font-semibold uppercase tracking-wide whitespace-nowrap',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-500',
        active ? 'text-brand-600 dark:text-brand-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
      )}
    >
      {children}
      <ArrowUpDown size={12} aria-hidden="true" />
    </button>
  )
}

function Bar({ pct }: { pct: number }) {
  const color = coverageColor(pct)
  return (
    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
      <div
        className={clsx('h-1.5 rounded-full', COLOR_CLASSES[color].bg)}
        style={{ width: `${pct}%` }}
        aria-hidden="true"
      />
    </div>
  )
}

interface CoverageTableProps {
  files: FileCoverage[]
  baselineFiles: FileCoverage[]
}

export function CoverageTable({ files, baselineFiles }: CoverageTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir(key === 'name' ? 'asc' : 'desc')
    }
  }

  const sorted = useMemo(() => {
    return [...files].sort((a, b) => {
      const bA = getBaseline(a.name, baselineFiles)
      const bB = getBaseline(b.name, baselineFiles)
      let va: number | string, vb: number | string
      switch (sortKey) {
        case 'name': va = a.name; vb = b.name; break
        case 'before': va = bA; vb = bB; break
        case 'after': va = a.coverage; vb = b.coverage; break
        case 'delta': va = a.coverage - bA; vb = b.coverage - bB; break
      }
      if (typeof va === 'string') return sortDir === 'asc' ? va.localeCompare(vb as string) : (vb as string).localeCompare(va)
      return sortDir === 'asc' ? va - (vb as number) : (vb as number) - va
    })
  }, [files, baselineFiles, sortKey, sortDir])

  return (
    <section aria-label="Per-file coverage">
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
              <th className="text-left px-4 py-3">
                <SortBtn col="name" sortKey={sortKey} sortDir={sortDir} onSort={handleSort}>File</SortBtn>
              </th>
              <th className="text-left px-4 py-3 w-44">
                <SortBtn col="before" sortKey={sortKey} sortDir={sortDir} onSort={handleSort}>Before</SortBtn>
              </th>
              <th className="text-left px-4 py-3 w-44">
                <SortBtn col="after" sortKey={sortKey} sortDir={sortDir} onSort={handleSort}>After</SortBtn>
              </th>
              <th className="text-right px-4 py-3 w-20">
                <SortBtn col="delta" sortKey={sortKey} sortDir={sortDir} onSort={handleSort}>Δ</SortBtn>
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((f, i) => {
              const baseline = getBaseline(f.name, baselineFiles)
              const delta = f.coverage - baseline
              const afterColor = coverageColor(f.coverage)
              return (
                <motion.tr
                  key={f.name}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-900/50"
                >
                  <td className="px-4 py-3 font-mono text-xs text-gray-700 dark:text-gray-300">{f.name}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="w-10 text-right tabular-nums text-gray-500 dark:text-gray-400">{baseline}%</span>
                      <Bar pct={baseline} />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className={clsx('w-10 text-right tabular-nums font-semibold', COLOR_CLASSES[afterColor].text)}>
                        {f.coverage}%
                      </span>
                      <Bar pct={f.coverage} />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    <span className={clsx(
                      'text-xs font-semibold',
                      delta > 0 ? 'text-emerald-600 dark:text-emerald-400' :
                      delta < 0 ? 'text-red-600 dark:text-red-400' :
                      'text-gray-400'
                    )}>
                      {delta > 0 ? '+' : ''}{delta}%
                    </span>
                  </td>
                </motion.tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile stacked cards */}
      <div className="md:hidden flex flex-col gap-3">
        {sorted.map((f, i) => {
          const baseline = getBaseline(f.name, baselineFiles)
          const delta = f.coverage - baseline
          const afterColor = coverageColor(f.coverage)
          return (
            <motion.div
              key={f.name}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <span className="font-mono text-xs text-gray-700 dark:text-gray-300 break-all">{f.name}</span>
                <span className={clsx(
                  'text-xs font-bold flex-shrink-0',
                  delta > 0 ? 'text-emerald-600 dark:text-emerald-400' :
                  delta < 0 ? 'text-red-600 dark:text-red-400' :
                  'text-gray-400'
                )}>
                  {delta > 0 ? '+' : ''}{delta}%
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Before</div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm tabular-nums text-gray-500 dark:text-gray-400 w-8">{baseline}%</span>
                    <div className="flex-1"><Bar pct={baseline} /></div>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">After</div>
                  <div className="flex items-center gap-2">
                    <span className={clsx('text-sm tabular-nums font-semibold w-8', COLOR_CLASSES[afterColor].text)}>{f.coverage}%</span>
                    <div className="flex-1"><Bar pct={f.coverage} /></div>
                  </div>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}
