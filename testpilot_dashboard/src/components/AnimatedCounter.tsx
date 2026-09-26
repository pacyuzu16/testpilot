import { useEffect } from 'react'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'

interface AnimatedCounterProps {
  to: number
  suffix?: string
  duration?: number
}

export function AnimatedCounter({ to, suffix = '', duration = 1.2 }: AnimatedCounterProps) {
  const count = useMotionValue(0)
  const rounded = useTransform(count, v => `${Math.round(v)}${suffix}`)

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) {
      count.set(to)
      return
    }
    const controls = animate(count, to, { duration, ease: 'easeOut' })
    return () => controls.stop()
    // run once on mount; `to` is stable
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <motion.span>{rounded}</motion.span>
}
