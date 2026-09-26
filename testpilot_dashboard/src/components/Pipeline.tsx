import { motion } from 'framer-motion'
import { Ruler, BrainCircuit, Cpu, ShieldCheck, FileText } from 'lucide-react'
import clsx from 'clsx'

const STEPS = [
  {
    icon: <Ruler size={20} />,
    title: 'Measure',
    desc: 'Run test suite with --cov; record baseline coverage and warnings.',
  },
  {
    icon: <BrainCircuit size={20} />,
    title: 'Plan',
    desc: 'Rank gaps by risk: untested endpoints → services → UI logic → deprecations.',
  },
  {
    icon: <Cpu size={20} />,
    title: 'Parallel subagents',
    desc: 'Backend subagent + frontend subagent run concurrently, cutting wall-clock time in half.',
    highlight: true,
  },
  {
    icon: <ShieldCheck size={20} />,
    title: 'Verify',
    desc: 'Re-run all tests. Fix wrong tests; flag real bugs without touching app code.',
  },
  {
    icon: <FileText size={20} />,
    title: 'Report',
    desc: 'Write docs/RESULTS.md with before/after table, bug list, and remaining gaps.',
  },
]

export function Pipeline() {
  return (
    <section aria-label="How TestPilot works">
      {/* Horizontal (md+) */}
      <div className="hidden md:flex items-start gap-0">
        {STEPS.map((step, i) => (
          <div key={step.title} className="flex-1 flex items-start">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={clsx(
                'flex-1 rounded-xl p-4 text-center',
                step.highlight
                  ? 'border-2 border-brand-500 bg-brand-50 dark:bg-brand-500/10'
                  : 'border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900'
              )}
            >
              <div className={clsx(
                'w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-3',
                step.highlight
                  ? 'bg-brand-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
              )}>
                {step.icon}
              </div>
              <div className="font-semibold text-sm mb-1">{step.title}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{step.desc}</div>
            </motion.div>
            {i < STEPS.length - 1 && (
              <div className="flex-shrink-0 w-6 flex items-center justify-center mt-5">
                <svg width="20" height="12" viewBox="0 0 20 12" aria-hidden="true" className="text-gray-300 dark:text-gray-700">
                  <path d="M0 6h16M12 1l6 5-6 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Vertical (mobile) */}
      <div className="md:hidden flex flex-col gap-3">
        {STEPS.map((step, i) => (
          <div key={step.title} className="flex flex-col items-center">
            <motion.div
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className={clsx(
                'w-full rounded-xl p-4 flex items-start gap-4',
                step.highlight
                  ? 'border-2 border-brand-500 bg-brand-50 dark:bg-brand-500/10'
                  : 'border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900'
              )}
            >
              <div className={clsx(
                'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                step.highlight
                  ? 'bg-brand-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
              )}>
                {step.icon}
              </div>
              <div>
                <div className="font-semibold text-sm mb-0.5">{step.title}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{step.desc}</div>
              </div>
            </motion.div>
            {i < STEPS.length - 1 && (
              <svg width="12" height="20" viewBox="0 0 12 20" aria-hidden="true" className="text-gray-300 dark:text-gray-700 my-1">
                <path d="M6 0v16M1 12l5 6 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
