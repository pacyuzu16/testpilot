# TestPilot

**Automated test coverage improvement and code-health reporting, powered by IBM Bob.**

---

## Problem

Real-world projects accumulate test debt silently. Coverage drops file by file. Deprecation warnings pile up across releases. Setting up a test runner from scratch takes hours. And when someone finally audits the gaps, writing the tests, fixing the warnings, and reporting the before/after numbers is tedious, repetitive work that nobody wants to do—so it never gets done.

---

## Solution

TestPilot is a Bob-native automation layer that treats test improvement as a first-class engineering task. It ships as:

- A **custom mode** (`🧪 TestPilot`) with the right tool permissions and a persona that refuses to change application behaviour just to make a test pass.
- A **skill** (`test-gap-hunter`) that encodes the full five-step improvement workflow.
- A **GitHub Actions workflow** that enforces the coverage floor on every pull request.

One command in Bob — `Use the test-gap-hunter skill on booking_system_backend` — goes from baseline measurement to a written `docs/RESULTS.md` report with no manual steps.

---

## How it works

### 1. Custom mode — `🧪 TestPilot`

Defined in [`.bob/custom_modes.yaml`](.bob/custom_modes.yaml). The mode sets a strict engineering persona and a `customInstructions` rule:

> *Never change application behaviour just to make a test pass. Always run the tests after writing them. Always record before/after numbers in `docs/RESULTS.md`.*

Tool groups granted: `read`, `edit`, `execute`, `skill`, `todo`, `subagent`.

### 2. Skill — `test-gap-hunter`

Defined in [`.bob/skills/test-gap-hunter/SKILL.md`](.bob/skills/test-gap-hunter/SKILL.md). The skill encodes a five-step workflow that runs every time:

| Step | What happens |
|---|---|
| **1 — Measure** | Runs the test suite with `--cov` and `-W all`; records baseline numbers |
| **2 — Plan** | Ranks gaps by risk: untested endpoints → service functions → UI logic → deprecations |
| **3 — Fix in parallel** | Spawns one subagent per layer (backend / frontend) so both work simultaneously |
| **4 — Verify** | Re-runs all tests; fixes wrong tests, flags real bugs without touching app code |
| **5 — Report** | Writes `docs/RESULTS.md` with a before/after table and a bug list |

A companion [`.bob/skills/test-gap-hunter/checklist.md`](.bob/skills/test-gap-hunter/checklist.md) defines what a good test must include (arrange/act/assert, one behaviour per test, no network calls, edge cases).

### 3. Parallel subagents

In the Fix step, Bob spawns two independent subagents via `spawn_subagent` with `fork_context: true`:

- **Backend subagent** — works in `booking_system_backend/`, adds pytest tests, fixes deprecations at the call site (no suppression), runs `pytest` after each change.
- **Frontend subagent** — works in `booking_system_frontend/`, installs Vitest + React Testing Library if missing, mocks `src/services/api.ts` at the module level, runs `npm test -- --run` after each component.

Both run concurrently and report back independently, cutting wall-clock time roughly in half.

---

## Results

Full details: [`docs/RESULTS.md`](docs/RESULTS.md)

### Backend (Run 1)

| Metric | Before | After |
|---|---|---|
| Tests (total) | 29 | **46** |
| Tests passing | 29 | **46** |
| Coverage (overall) | 86% | **95%** |
| `server.py` coverage | 59% | **100%** |
| Deprecation warnings | 6 | **0** |

### Frontend (Run 2)

| Metric | Before | After |
|---|---|---|
| Test files | 0 | **5** |
| Tests (total) | 0 | **56** |
| Tests passing | 0 | **56** |
| Test runner | none | **Vitest 5.0 + RTL** |

2 real application bugs were found and documented (not silently fixed): a wrong return type in `isErrorResponse` and a dead `try/catch` in `calculateDuration`. See [`docs/RESULTS.md`](docs/RESULTS.md#bugs-found----run-2).

---

## How to run it

### Prerequisites

- Python 3.8+
- Node.js 18+
- IBM Bob

### Start the application

```bash
# macOS / Linux
./start.sh

# Windows
start.bat
```

Starts the FastAPI backend on `http://localhost:8080` and the React frontend on `http://localhost:5173`.

### Run the tests manually

```bash
# Backend (from booking_system_backend/)
cd booking_system_backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt pytest-cov
pytest --cov=. --cov-report=term-missing

# Frontend (from booking_system_frontend/)
cd booking_system_frontend
npm ci
npm test -- --run
```

### Run TestPilot via Bob

Switch to the `🧪 TestPilot` mode in Bob, then:

```
Use the test-gap-hunter skill on booking_system_backend.
```

or

```
Use the test-gap-hunter skill on booking_system_frontend.
```

Bob will measure, plan, fix, verify, and write `docs/RESULTS.md` automatically.

### CI (GitHub Actions)

Every pull request triggers [`.github/workflows/testpilot.yml`](.github/workflows/testpilot.yml):

- **Backend job** — runs pytest with `--cov-fail-under=95` and treats deprecation warnings as errors.
- **Frontend job** — runs `npm test -- --run --reporter=verbose`.

Both jobs run in parallel. A coverage drop or any new deprecation warning fails the PR.

---

## Bob usage evidence

Live Bob session recordings are in [`bob_sessions/`](bob_sessions/). These show the full TestPilot workflow running end-to-end inside Bob: mode creation, skill invocation, parallel subagent dispatch, and report generation.

---

## Data sources

See [`DATA_SOURCES.md`](DATA_SOURCES.md).

The sample application TestPilot runs on is [IBM/galaxium-travels](https://github.com/IBM/galaxium-travels) (`bob-learning-path-branch`), an interplanetary booking system with a FastAPI backend and a React frontend. All user and flight records are fictional seed data. No personal or confidential information is used.

---

## Credits

- **Built on:** [IBM/galaxium-travels](https://github.com/IBM/galaxium-travels) — Apache-2.0
- **Powered by:** [IBM Bob](https://www.ibm.com/bob)
- **License:** [Apache-2.0](LICENSE)
