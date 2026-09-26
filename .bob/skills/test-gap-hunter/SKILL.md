---
name: test-gap-hunter
description: Use when the user wants to improve test coverage, find untested code, remove deprecation warnings, or get a before/after health report for the repository.
---

# Test Gap Hunter

Follow these five steps in order. Complete each step fully before moving to the next.
Reference `.bob/skills/test-gap-hunter/checklist.md` whenever writing or reviewing tests.

---

## Step 1 — MEASURE (collect baseline numbers)

Run the backend test suite with coverage and capture deprecation warnings. Count existing frontend test files.

```bash
# From booking_system_backend/
cd booking_system_backend && pytest --tb=short -W all 2>&1 | tee /tmp/pytest-before.txt
```

From the output, record:
- Total tests passed / failed
- Coverage % per file (if `pytest-cov` is configured; if not, note that it is missing)
- Number of deprecation warnings (lines containing `DeprecationWarning` or `PendingDeprecationWarning`)

For the frontend:
```bash
find booking_system_frontend/src -name "*.test.*" -o -name "*.spec.*" | wc -l
```

Save all baseline numbers — you will need them for the REPORT step.

---

## Step 2 — PLAN (rank gaps by risk)

List every gap found. Rank in this order:

1. **Untested backend API endpoints** — any route in `booking_system_backend/server.py` with no corresponding test in `tests/test_rest.py`
2. **Untested service functions** — any function in `booking_system_backend/services/` with no corresponding test in `tests/test_services.py`
3. **Frontend components with logic** — any `.tsx` file in `booking_system_frontend/src/` that contains conditional rendering, event handlers, or custom hooks but has no test file alongside it
4. **Deprecation warnings** — each unique warning site in the backend output
5. **Missing coverage infrastructure** — e.g. `pytest-cov` not configured, no Vitest config

Write the ranked list out before proceeding. This list drives Step 3.

---

## Step 3 — FIX IN PARALLEL (spawn two subagents)

Use `spawn_subagent` to launch both agents simultaneously. Pass the ranked gap list to each via `fork_context: true` so they have the baseline and plan.

### Backend subagent instructions
- Work only inside `booking_system_backend/`
- Add missing tests to `tests/test_rest.py` (for endpoints) and `tests/test_services.py` (for services)
- Follow the checklist at `.bob/skills/test-gap-hunter/checklist.md`
- Fix each deprecation warning at its source — update the call site, not by suppressing the warning
- Do NOT change application behaviour; if a fix would require changing app logic, flag it as a bug instead
- Run `pytest` after each change to confirm nothing regresses

### Frontend subagent instructions
- Work only inside `booking_system_frontend/`
- If Vitest + React Testing Library are not installed, set them up first:
  ```bash
  npm install --save-dev vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
  ```
  Add a `vitest.config.ts` (or extend `vite.config.ts`) with `environment: 'jsdom'` and a `test` script in `package.json`
- Add tests for every component identified in Step 2
- Follow the checklist at `.bob/skills/test-gap-hunter/checklist.md`
- No network calls in tests — mock `src/services/api.ts` at the module level
- Run `npm test -- --run` after each component to confirm passing

---

## Step 4 — VERIFY (re-run everything and fix failures)

After both subagents complete, re-run the full test suites:

```bash
cd booking_system_backend && pytest --tb=short -W all 2>&1 | tee /tmp/pytest-after.txt
cd booking_system_frontend && npm test -- --run 2>&1 | tee /tmp/vitest-after.txt
```

For any failing test:
- **If the test is wrong** (bad assertion, wrong fixture) — fix the test.
- **If the test exposed a real app bug** — do NOT fix the app to make the test pass. Record the bug in `docs/RESULTS.md` under "Bugs Found" and leave the test marked with `pytest.mark.xfail` / `test.todo()` with a comment explaining why.

---

## Step 5 — REPORT (write docs/RESULTS.md)

Create or overwrite `docs/RESULTS.md` with:

1. **Before/After table**

| Metric | Before | After |
|---|---|---|
| Backend tests (total) | | |
| Backend tests passing | | |
| Backend coverage (overall %) | | |
| Backend deprecation warnings | | |
| Frontend test files | | |
| Frontend tests (total) | | |

Fill each cell with the numbers saved in Steps 1 and 4.

2. **Coverage per file** — two-column table (filename, before → after %) for every backend file touched.

3. **Gaps closed** — bulleted list of every gap from Step 2 that now has a test.

4. **Bugs found** — bulleted list of any real app bugs discovered. Each entry must include: file, function/line, description of the bug, and the name of the xfail/todo test that documents it.

5. **Remaining gaps** — any gap from Step 2 that could not be addressed, with reason.
