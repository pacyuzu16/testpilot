import type { HistoryEntry } from '../types'

interface HistoryChartProps {
  history: HistoryEntry[]
}

const W = 600
const H = 180
const PAD = { top: 16, right: 20, bottom: 36, left: 40 }
const INNER_W = W - PAD.left - PAD.right
const INNER_H = H - PAD.top - PAD.bottom

function polyline(points: [number, number][]): string {
  return points.map(([x, y]) => `${x},${y}`).join(' ')
}

function scaleX(i: number, n: number): number {
  if (n <= 1) return PAD.left
  return PAD.left + (i / (n - 1)) * INNER_W
}

function scaleY(v: number, min: number, max: number): number {
  if (max === min) return PAD.top + INNER_H / 2
  return PAD.top + INNER_H - ((v - min) / (max - min)) * INNER_H
}

function formatDate(ts: string): string {
  const d = new Date(ts)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

export function HistoryChart({ history }: HistoryChartProps) {
  if (history.length < 2) {
    return (
      <div className="flex items-center justify-center h-28 rounded-xl border border-dashed border-gray-200 dark:border-gray-800 text-sm text-gray-400">
        Run the scan a second time to see a history chart.
      </div>
    )
  }

  const n = history.length
  const coverages = history.map(h => h.backend_coverage)
  const tests = history.map(h => h.backend_tests + h.frontend_tests)

  const minCov = Math.max(0, Math.min(...coverages) - 5)
  const maxCov = Math.min(100, Math.max(...coverages) + 5)
  const minTests = Math.max(0, Math.min(...tests) - 5)
  const maxTests = Math.max(...tests) + 5

  const covPoints: [number, number][] = coverages.map((v, i) => [scaleX(i, n), scaleY(v, minCov, maxCov)])
  const testPoints: [number, number][] = tests.map((v, i) => [scaleX(i, n), scaleY(v, minTests, maxTests)])

  // Build tick labels (show up to 7)
  const step = Math.max(1, Math.floor(n / 6))
  const ticks = history
    .map((h, i) => ({ i, label: formatDate(h.timestamp) }))
    .filter(({ i }) => i % step === 0 || i === n - 1)

  return (
    <div role="img" aria-label="Coverage and test count history chart">
      <div className="flex items-center gap-4 mb-3 text-xs text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1.5">
          <svg width="16" height="4" aria-hidden="true"><line x1="0" y1="2" x2="16" y2="2" stroke="#6366f1" strokeWidth="2" /></svg>
          Backend coverage %
        </span>
        <span className="flex items-center gap-1.5">
          <svg width="16" height="4" aria-hidden="true"><line x1="0" y1="2" x2="16" y2="2" stroke="#10b981" strokeWidth="2" strokeDasharray="4,2" /></svg>
          Total tests
        </span>
      </div>
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          width="100%"
          style={{ minWidth: 280 }}
          className="block"
        >
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map(t => {
            const y = PAD.top + t * INNER_H
            return (
              <line
                key={t}
                x1={PAD.left} y1={y}
                x2={PAD.left + INNER_W} y2={y}
                stroke="currentColor"
                strokeOpacity="0.08"
                strokeWidth="1"
              />
            )
          })}

          {/* Coverage line */}
          <polyline
            points={polyline(covPoints)}
            fill="none"
            stroke="#6366f1"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {covPoints.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="3" fill="#6366f1" />
          ))}

          {/* Tests line */}
          <polyline
            points={polyline(testPoints)}
            fill="none"
            stroke="#10b981"
            strokeWidth="2"
            strokeDasharray="5,3"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {testPoints.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="3" fill="#10b981" />
          ))}

          {/* X-axis ticks */}
          {ticks.map(({ i, label }) => (
            <text
              key={i}
              x={scaleX(i, n)}
              y={H - 8}
              textAnchor="middle"
              fontSize="10"
              fill="currentColor"
              opacity="0.5"
            >
              {label}
            </text>
          ))}

          {/* Y-axis label (coverage) */}
          <text
            x={PAD.left - 6}
            y={PAD.top}
            textAnchor="end"
            fontSize="9"
            fill="currentColor"
            opacity="0.4"
          >
            {maxCov}%
          </text>
          <text
            x={PAD.left - 6}
            y={PAD.top + INNER_H}
            textAnchor="end"
            fontSize="9"
            fill="currentColor"
            opacity="0.4"
          >
            {minCov}%
          </text>
        </svg>
      </div>
    </div>
  )
}
