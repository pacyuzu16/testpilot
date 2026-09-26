import { describe, it, expect } from 'vitest'
import { coverageColor } from '../utils/coverage'

describe('coverageColor', () => {
  // Red: < 60
  it('returns "red" for 0%', () => {
    expect(coverageColor(0)).toBe('red')
  })

  it('returns "red" for 59%', () => {
    expect(coverageColor(59)).toBe('red')
  })

  // Boundary at 60 — amber starts
  it('returns "amber" for 60%', () => {
    expect(coverageColor(60)).toBe('amber')
  })

  it('returns "amber" for 75%', () => {
    expect(coverageColor(75)).toBe('amber')
  })

  it('returns "amber" for 89%', () => {
    expect(coverageColor(89)).toBe('amber')
  })

  // Boundary at 90 — green starts
  it('returns "green" for 90%', () => {
    expect(coverageColor(90)).toBe('green')
  })

  it('returns "green" for 95%', () => {
    expect(coverageColor(95)).toBe('green')
  })

  it('returns "green" for 100%', () => {
    expect(coverageColor(100)).toBe('green')
  })

  // Values from BASELINE.md / RESULTS.md
  it('returns "amber" for 69% (db.py baseline)', () => {
    expect(coverageColor(69)).toBe('amber')
  })

  it('returns "red" for 18% (seed.py baseline)', () => {
    expect(coverageColor(18)).toBe('red')
  })

  it('returns "red" for 59% (server.py baseline)', () => {
    expect(coverageColor(59)).toBe('red')
  })

  it('returns "green" for 100% (server.py after)', () => {
    expect(coverageColor(100)).toBe('green')
  })

  it('returns "green" for 95% (overall after)', () => {
    expect(coverageColor(95)).toBe('green')
  })
})
