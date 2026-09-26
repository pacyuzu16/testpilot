# Step-by-step Bob prompts

Copy each prompt into Bob's chat **one at a time**. After each step finishes:
1. Read what Bob changed (approve / reject).
2. Take the task-summary screenshot → save to `bob_sessions/` (e.g. `yourteam_task01_init.png`).
3. Commit: `git add -A && git commit -m "step N: ..."`

Budget: 40 Bobcoins. Check usage in Settings → General after every step.
If a step burns a lot, stop and ask for help before continuing.

---

## Step 1 — Give Bob project context (mode: **Agent**)

```
/init
```

---

## Step 2 — Create the TestPilot custom mode (mode: **Agent**)

```
Create a project custom mode in .bob/custom_modes.yaml with:
- slug: testpilot
- name: 🧪 TestPilot
- description: Finds untested and outdated code, writes tests, fixes deprecations, and reports before/after metrics.
- roleDefinition: You are a senior test and maintenance engineer. You improve test coverage and remove deprecation warnings without changing application behaviour.
- whenToUse: Use when the user asks to improve tests, coverage, or code health.
- groups: read, edit, execute, skill, todo, subagent
- customInstructions: Never change application behaviour just to make a test pass. Always run the tests after writing them. Always record before/after numbers in docs/RESULTS.md.
Do not create anything else yet.
```

After it finishes: close and reopen the Bob panel. Check that **🧪 TestPilot** appears in the mode picker.

---

## Step 3 — Create the TestPilot skill (mode: **🧪 TestPilot**)

```
Create a skill at .bob/skills/test-gap-hunter/SKILL.md with front matter
name: test-gap-hunter
description: Scan a repository for untested code and deprecation warnings, then fix them in parallel and report before/after metrics.

The instructions must define this workflow:
1. MEASURE: run the backend tests with coverage and count warnings; count frontend test files. Save the numbers.
2. PLAN: list the gaps, ranked by risk (untested API endpoints first, then UI components with logic, then deprecations).
3. FIX IN PARALLEL: spawn one subagent for backend gaps and one subagent for frontend gaps. The frontend subagent sets up Vitest + React Testing Library if missing.
4. VERIFY: re-run all tests. If any fail, fix the test (not the app) unless the app has a real bug — in that case report the bug instead.
5. REPORT: write docs/RESULTS.md with a before/after table (coverage per file, number of tests, number of warnings) and a list of any real bugs found.

Also add a supporting file .bob/skills/test-gap-hunter/checklist.md with what a good test must include (arrange/act/assert, one behaviour per test, edge cases, no network calls).
```

---

## Step 4 — Run it on the backend (mode: **🧪 TestPilot**)

```
Use the test-gap-hunter skill on booking_system_backend only.
Focus on server.py (59% covered) and the 6 deprecation warnings in the baseline (docs/BASELINE.md).
```

---

## Step 5 — Run it on the frontend (mode: **🧪 TestPilot**)

```
Use the test-gap-hunter skill on booking_system_frontend. There are currently zero frontend tests.
Set up Vitest and React Testing Library, then test the components with real logic first:
services/api.ts, utils/formatters.ts, hooks/useUser.tsx, BookingModal.tsx, FlightCard.tsx.
```

---

## Step 6 — Automate it (mode: **Agent**)

```
Create a GitHub Actions workflow .github/workflows/testpilot.yml that runs the backend tests with coverage
and the frontend Vitest tests on every pull request, and fails if backend coverage drops below the
number in docs/RESULTS.md.
```

---

## Step 7 — Write the README (mode: **Agent**)

```
Rewrite README.md for our hackathon project "TestPilot". Sections: Problem, Solution, How it works
(custom mode + skill + parallel subagents), Results (copy the before/after table from docs/RESULTS.md),
How to run it, Bob usage evidence (link to bob_sessions/), Data sources (link DATA_SOURCES.md),
Credits (built on IBM/galaxium-travels, Apache-2.0).
```

---

## Step 8 — Fix the bugs TestPilot found (NEW task, mode: **🧪 TestPilot**)

```
Use the test-gap-hunter skill. docs/RESULTS.md lists 2 real bugs found in Run 2:
1. isErrorResponse in src/services/api.ts returns null/undefined instead of false.
2. calculateDuration in src/utils/formatters.ts returns 'NaNh NaNm' instead of 'N/A' for invalid dates.
Fix both bugs in the app code, update the tests so they assert the correct behaviour (false and 'N/A'),
run all frontend tests, and add a "Run 3 — Bug fixes" section to docs/RESULTS.md.
```

---

## Step 9 — TestPilot Dashboard (NEW task, mode: **Agent**)

```
Build a TestPilot Dashboard so people can SEE what TestPilot does. Read docs/BASELINE.md and docs/RESULTS.md first.

1. SCAN SCRIPT — scripts/testpilot_scan.py (Python, stdlib only):
   - Runs backend: `pytest --cov=. --cov-report=json` in booking_system_backend, captures pass/fail counts and warning count.
   - Runs frontend: `npx vitest run --reporter=json` in booking_system_frontend, captures pass/fail counts.
   - Writes testpilot_dashboard/public/report.json: timestamp, backend {tests, passed, failed, warnings, coverage_total, files:[{name, coverage}]}, frontend {test_files, tests, passed, failed}, bugs (from docs/RESULTS.md: id, file, title, status fixed), and a "baseline" object with the before numbers from docs/BASELINE.md.
   - Appends a summary entry to testpilot_dashboard/public/history.json (keep last 20 runs).

2. DASHBOARD — new app testpilot_dashboard/ (Vite + React + TypeScript + Tailwind + framer-motion + lucide-react, same versions as booking_system_frontend):
   - Header: TestPilot logo/name, "Last scan: <time ago>", theme toggle (Light / Dark / System) saved in localStorage, defaults to system preference, no flash on load.
   - Hero KPI cards with animated counters and before → after: Backend coverage, Backend tests, Deprecation warnings, Frontend tests, Bugs found / fixed.
   - Per-file coverage table: before vs after bars, sortable, colour-coded (red <60, amber <90, green ≥90). On mobile it becomes stacked cards.
   - "Bugs TestPilot found" cards: file, description, status badge (Fixed).
   - "How it works" pipeline: Measure → Plan → Parallel subagents (backend + frontend) → Verify → Report, as a responsive horizontal/vertical stepper.
   - Run history chart (simple SVG line chart of coverage and test count over runs).
   - "Run scan" button: add a Vite dev-server plugin with POST /api/scan that runs scripts/testpilot_scan.py, streams its log into a live terminal-style panel, then reloads report.json. In the production build hide the button and show "Static report" instead.
   - Design: modern, clean, accessible (WCAG AA contrast in BOTH themes, focus rings, aria labels, keyboard navigable), respects prefers-reduced-motion, fully responsive at 360px / 768px / 1280px, no horizontal scroll on phones, empty and loading and error states.
   - Add Vitest tests for the theme toggle and the coverage colour logic.

3. DEPLOY — .github/workflows/dashboard-pages.yml: on push to main, build testpilot_dashboard (base path /testpilot/) and deploy to GitHub Pages. Use Node 24.

4. Run the scan once so report.json and history.json are real, run the dashboard tests, run `npm run build`, and add a "Dashboard" section to README.md with how to run it: `python3 scripts/testpilot_scan.py` then `cd testpilot_dashboard && npm install && npm run dev`.
```
