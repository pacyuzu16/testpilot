# Baseline — before TestPilot

Measured on 2026-09-25 on `IBM/galaxium-travels` (branch `bob-learning-path-branch`, commit `436716e`),
before any TestPilot changes. Command: `cd booking_system_backend && pytest --cov=. --cov-report=term`

## Backend (Python / FastAPI)

| File | Statements | Missed | Coverage |
|---|---|---|---|
| db.py | 13 | 4 | 69% |
| models.py | 24 | 0 | 100% |
| schemas.py | 16 | 0 | 100% |
| seed.py | 34 | 28 | 18% |
| server.py | 92 | 38 | **59%** |
| services/__init__.py | 2 | 0 | 100% |
| services/booking.py | 38 | 0 | 100% |
| services/flight.py | 6 | 0 | 100% |
| services/user.py | 17 | 0 | 100% |
| **Total** | 526 | 73 | **86%** |

- Tests: 29 passed
- **Warnings: 6**, including:
  - `schemas.py:40`: Pydantic class-based `Config` is deprecated (removed in Pydantic V3)
  - `services/booking.py:49`: `datetime.utcnow()` is deprecated

## Frontend (React / TypeScript)

- Test files: **0**
- Test runner configured: **none**
- Coverage: **0%** (24 `.ts`/`.tsx` source files)
