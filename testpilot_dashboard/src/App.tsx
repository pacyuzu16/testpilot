import { useTheme } from './hooks/useTheme'
import { useReport, useHistory } from './hooks/useData'
import { Header } from './components/Header'
import { KpiCard } from './components/KpiCard'
import { CoverageTable } from './components/CoverageTable'
import { BugCards } from './components/BugCards'
import { Pipeline } from './components/Pipeline'
import { HistoryChart } from './components/HistoryChart'
import { RunScanButton } from './components/RunScanButton'
import {
  Activity, TestTubeDiagonal, AlertTriangle, Code2, Bug, ShieldCheck,
} from 'lucide-react'

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100">{children}</h2>
  )
}

function Section({ children, id }: { children: React.ReactNode; id?: string }) {
  return (
    <section id={id} className="mb-12">
      {children}
    </section>
  )
}

export default function App() {
  const { theme, setTheme } = useTheme()
  const { report, error, loading, reload } = useReport()
  const { history, reload: reloadHistory } = useHistory()

  if (loading && !report) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400 animate-pulse" role="status" aria-live="polite">
          Loading report…
        </div>
      </div>
    )
  }

  if (error || !report) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div
          className="max-w-sm text-center p-8 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20"
          role="alert"
        >
          <p className="text-sm font-semibold text-red-700 dark:text-red-400 mb-2">Failed to load report</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            Run <code className="font-mono bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">python3 scripts/testpilot_scan.py</code> first, then refresh.
          </p>
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
      </div>
    )
  }

  const { backend, frontend, bugs, baseline } = report

  return (
    <>
      <Header timestamp={report.timestamp} theme={theme} setTheme={setTheme} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
          <div>
            <h2 className="text-2xl font-bold">Coverage Dashboard</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Before &amp; after TestPilot — {bugs.length} bug{bugs.length !== 1 ? 's' : ''} found, all fixed
            </p>
          </div>
          <RunScanButton onComplete={() => { reload(); reloadHistory() }} />
        </div>

        {/* KPI Section */}
        <Section id="kpis">
          <SectionTitle>Key metrics</SectionTitle>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
            <KpiCard
              label="Backend coverage"
              before={baseline.backend.coverage_total}
              after={backend.coverage_total}
              suffix="%"
              icon={<Activity size={16} />}
            />
            <KpiCard
              label="Backend tests"
              before={baseline.backend.tests}
              after={backend.tests}
              icon={<TestTubeDiagonal size={16} />}
            />
            <KpiCard
              label="Deprecation warnings"
              before={baseline.backend.warnings}
              after={backend.warnings}
              lowerIsBetter
              icon={<AlertTriangle size={16} />}
            />
            <KpiCard
              label="Frontend tests"
              before={baseline.frontend.tests}
              after={frontend.tests}
              icon={<Code2 size={16} />}
            />
            <KpiCard
              label="Bugs fixed"
              before={0}
              after={baseline.bugs_fixed}
              icon={<ShieldCheck size={16} />}
            />
          </div>
        </Section>

        {/* Coverage Table */}
        <Section id="coverage">
          <SectionTitle>Per-file coverage</SectionTitle>
          {backend.files.length > 0 ? (
            <CoverageTable files={backend.files} baselineFiles={baseline.backend.files} />
          ) : (
            <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-800 p-8 text-center text-sm text-gray-400">
              No file coverage data — run with <code className="font-mono">--cov-report=json</code>
            </div>
          )}
        </Section>

        {/* Bugs */}
        <Section id="bugs">
          <SectionTitle>
            <span className="flex items-center gap-2">
              <Bug size={18} aria-hidden="true" />
              Bugs TestPilot found
            </span>
          </SectionTitle>
          <BugCards bugs={bugs} />
        </Section>

        {/* Pipeline */}
        <Section id="how">
          <SectionTitle>How it works</SectionTitle>
          <Pipeline />
        </Section>

        {/* History */}
        <Section id="history">
          <SectionTitle>Run history</SectionTitle>
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
            <HistoryChart history={history} />
          </div>
        </Section>
      </main>
    </>
  )
}
