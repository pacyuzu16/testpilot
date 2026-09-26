import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'

// Mock matchMedia (jsdom doesn't provide it)
function mockMatchMedia(prefersDark: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn((query: string) => ({
      matches: query.includes('dark') ? prefersDark : !prefersDark,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
}

// We import dynamically so we can reset module state between tests
async function freshUseTheme() {
  const mod = await import('../hooks/useTheme')
  return mod.useTheme
}

describe('useTheme', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove('dark')
    vi.resetModules()
    mockMatchMedia(false)
  })

  it('defaults to system when localStorage is empty', async () => {
    const useTheme = await freshUseTheme()
    const { result } = renderHook(() => useTheme())
    expect(result.current.theme).toBe('system')
  })

  it('reads stored theme from localStorage', async () => {
    localStorage.setItem('testpilot-theme', 'dark')
    const useTheme = await freshUseTheme()
    const { result } = renderHook(() => useTheme())
    expect(result.current.theme).toBe('dark')
  })

  it('setTheme("dark") adds "dark" class to documentElement', async () => {
    const useTheme = await freshUseTheme()
    const { result } = renderHook(() => useTheme())
    act(() => { result.current.setTheme('dark') })
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('setTheme("light") removes "dark" class', async () => {
    document.documentElement.classList.add('dark')
    localStorage.setItem('testpilot-theme', 'dark')
    const useTheme = await freshUseTheme()
    const { result } = renderHook(() => useTheme())
    act(() => { result.current.setTheme('light') })
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('setTheme("system") with system prefersDark=true adds "dark"', async () => {
    mockMatchMedia(true)
    const useTheme = await freshUseTheme()
    const { result } = renderHook(() => useTheme())
    act(() => { result.current.setTheme('system') })
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('setTheme("system") with system prefersDark=false removes "dark"', async () => {
    document.documentElement.classList.add('dark')
    mockMatchMedia(false)
    const useTheme = await freshUseTheme()
    const { result } = renderHook(() => useTheme())
    act(() => { result.current.setTheme('system') })
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('persists theme choice to localStorage', async () => {
    const useTheme = await freshUseTheme()
    const { result } = renderHook(() => useTheme())
    act(() => { result.current.setTheme('light') })
    expect(localStorage.getItem('testpilot-theme')).toBe('light')
  })

  it('ignores unknown localStorage values and defaults to system', async () => {
    localStorage.setItem('testpilot-theme', 'unicorn')
    const useTheme = await freshUseTheme()
    const { result } = renderHook(() => useTheme())
    expect(result.current.theme).toBe('system')
  })
})
