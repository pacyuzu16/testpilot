import { useState, useRef, useEffect, useCallback } from 'react'
import { Play, Terminal } from 'lucide-react'
import clsx from 'clsx'

const IS_PROD = import.meta.env.PROD

// eslint-disable-next-line no-control-regex
const ANSI = /\x1b\[[0-9;]*m/g

interface RunScanButtonProps {
  onComplete: () => void
}

export function RunScanButton({ onComplete }: RunScanButtonProps) {
  const [running, setRunning] = useState(false)
  const [log, setLog] = useState<string>('')
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<'ok' | 'failed' | null>(null)
  const panelRef = useRef<HTMLPreElement>(null)

  const scroll = useCallback(() => {
    if (panelRef.current) {
      panelRef.current.scrollTop = panelRef.current.scrollHeight
    }
  }, [])

  useEffect(() => { scroll() }, [log, scroll])

  async function runScan() {
    setLog('')
    setStatus(null)
    setOpen(true)
    setRunning(true)

    let output = ''
    try {
      const res = await fetch('/api/scan', { method: 'POST' })
      if (!res.body) throw new Error('No stream')
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true }).replace(ANSI, '')
        output += chunk
        setLog(prev => prev + chunk)
      }
      setStatus(/exit code 0\]/.test(output) ? 'ok' : 'failed')
    } catch (e) {
      setLog(prev => prev + `\n[Error: ${String(e)}]\n`)
      setStatus('failed')
    } finally {
      setRunning(false)
      onComplete()
    }
  }

  if (IS_PROD) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400">
        <Terminal size={14} aria-hidden="true" />
        Static report
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        onClick={() => void runScan()}
        disabled={running}
        aria-label={running ? 'Scan running…' : 'Run TestPilot scan'}
        className={clsx(
          'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500',
          running
            ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
            : 'bg-brand-500 hover:bg-brand-600 text-white'
        )}
      >
        <Play size={14} aria-hidden="true" className={running ? 'animate-pulse' : ''} />
        {running ? 'Running…' : 'Run scan'}
      </button>

      {open && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="flex items-center justify-between bg-gray-900 px-4 py-2">
            <span className="text-xs text-gray-400 flex items-center gap-1.5">
              <Terminal size={12} aria-hidden="true" />
              testpilot_scan.py
            </span>
            {status && (
              <span
                role="status"
                className={clsx('text-xs font-medium', status === 'ok' ? 'text-emerald-400' : 'text-red-400')}
              >
                {status === 'ok' ? '✓ Scan complete — dashboard updated' : '✗ Scan failed — see log'}
              </span>
            )}
            {!running && (
              <button
                onClick={() => setOpen(false)}
                className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                aria-label="Close terminal"
              >
                ✕
              </button>
            )}
          </div>
          <pre
            ref={panelRef}
            className="terminal bg-gray-950 text-gray-200 p-4 max-h-64 overflow-y-auto"
            aria-live="polite"
            aria-label="Scan output"
          >
            {log || ' '}
          </pre>
        </div>
      )}
    </div>
  )
}
