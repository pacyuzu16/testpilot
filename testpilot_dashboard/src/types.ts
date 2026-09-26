export interface FileCoverage {
  name: string
  coverage: number
}

export interface BackendStats {
  tests: number
  passed: number
  failed: number
  warnings: number
  coverage_total: number
  files: FileCoverage[]
}

export interface FrontendStats {
  test_files: number
  tests: number
  passed: number
  failed: number
}

export interface Bug {
  id: number
  file: string
  title: string
  status: 'fixed' | 'open'
}

export interface BaselineBackend {
  tests: number
  passed: number
  failed: number
  warnings: number
  coverage_total: number
  files: FileCoverage[]
}

export interface BaselineFrontend {
  test_files: number
  tests: number
  passed: number
  failed: number
}

export interface Baseline {
  backend: BaselineBackend
  frontend: BaselineFrontend
  bugs_found: number
  bugs_fixed: number
}

export interface Report {
  timestamp: string
  backend: BackendStats
  frontend: FrontendStats
  bugs: Bug[]
  baseline: Baseline
}

export interface HistoryEntry {
  timestamp: string
  backend_coverage: number
  backend_tests: number
  backend_passed: number
  backend_warnings: number
  frontend_tests: number
  frontend_passed: number
}

export type Theme = 'light' | 'dark' | 'system'
