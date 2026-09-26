# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Project Overview

Full-stack interplanetary booking app: **FastAPI + SQLite backend** (`booking_system_backend/`) and **React 19 + TypeScript + Vite frontend** (`booking_system_frontend/`). Backend also exposes an **MCP endpoint** at `/mcp` via `fastmcp`.

## Commands

All commands must be run from their respective subdirectory — there is no monorepo root runner.

### Backend (`booking_system_backend/`)
```bash
# Run server
python server.py   # starts uvicorn on port 8080

# Run all tests (must be run from booking_system_backend/)
pytest

# Run a single test
pytest tests/test_rest.py::TestFlightsEndpoint::test_get_flights_empty
pytest tests/test_services.py -k "test_name"
```

### Frontend (`booking_system_frontend/`)
```bash
npm run dev      # dev server on port 5173
npm run build    # tsc -b && vite build
npm run lint     # eslint
```

## Critical Patterns

### Backend
- **Tests must run from `booking_system_backend/`**, not the repo root — `pytest.ini` sets `testpaths = tests` relative to that directory.
- **`conftest.py` patches `SessionLocal` and disables `seed()`** during tests — never call `seed()` in production test paths.
- Service functions (e.g. `booking.book_flight`) **return `ErrorResponse` instead of raising exceptions**. In REST handlers, return the `ErrorResponse` directly (FastAPI serializes it); in MCP tools, check `isinstance(result, ErrorResponse)` and `raise Exception(...)`.
- `booking_time` and `departure_time`/`arrival_time` are stored as **plain strings** (not SQLAlchemy DateTime) in models — ISO format, UTC.
- DB is SQLite (`booking.db` in `booking_system_backend/`); wiped and reseeded on every server startup via `lifespan`.
- Pydantic schemas use `class Config: from_attributes = True` for ORM model→schema conversion; use `Model.model_validate(orm_obj)` not `Model.from_orm()`.
- MCP tools in `server.py` open their own `SessionLocal()` sessions (not via `Depends`) — always wrap in `try/finally: db.close()`.

### Frontend
- API base URL comes from `VITE_API_URL` env var (`.env` file, not committed); falls back to `http://localhost:8080`.
- **`isErrorResponse(response)`** helper in `src/services/api.ts` — use it to discriminate `User | ErrorResponse` / `Booking | ErrorResponse` union returns.
- All shared TypeScript types live in `src/types/index.ts`; frontend field names mirror backend snake_case (e.g. `flight_id`, `booking_time`).
- The axios instance has a response interceptor that **normalises all errors** to the `ErrorResponse` shape — don't catch raw Axios errors, just catch and check `.error_code`.

## Code Style

### Python (backend)
- No formatter config found; follow existing style (4-space indent, type hints on all function signatures).
- Service layer imports: `from models import X` and `from schemas import X` (flat imports, no package prefix — modules are co-located in `booking_system_backend/`).

### TypeScript (frontend)
- ESLint with `typescript-eslint` recommended + `react-hooks` + `react-refresh` rules.
- `import type { … }` for type-only imports (see `api.ts`).
- No Prettier config — match surrounding code style.
