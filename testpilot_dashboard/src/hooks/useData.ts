import { useState, useEffect, useCallback } from 'react'
import type { Report, HistoryEntry } from '../types'

const BASE = import.meta.env.BASE_URL

export function useReport() {
  const [report, setReport] = useState<Report | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  // increment to trigger a re-fetch
  const [rev, setRev] = useState(0)

  useEffect(() => {
    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    setError(null)
    fetch(`${BASE}report.json?t=${Date.now()}`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json() as Promise<Report>
      })
      .then(data => { if (!cancelled) { setReport(data); setLoading(false) } })
      .catch(e => { if (!cancelled) { setError(String(e)); setLoading(false) } })
    return () => { cancelled = true }
  }, [rev])

  const reload = useCallback(() => { setRev(r => r + 1) }, [])

  return { report, error, loading, reload }
}

export function useHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [rev, setRev] = useState(0)

  useEffect(() => {
    let cancelled = false
    fetch(`${BASE}history.json?t=${Date.now()}`)
      .then(r => r.ok ? r.json() as Promise<HistoryEntry[]> : Promise.resolve([]))
      .then(data => { if (!cancelled) setHistory(data) })
      .catch(() => { if (!cancelled) setHistory([]) })
    return () => { cancelled = true }
  }, [rev])

  const reload = useCallback(() => { setRev(r => r + 1) }, [])

  return { history, reload }
}
