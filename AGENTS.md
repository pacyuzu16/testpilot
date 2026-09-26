# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Project Overview

Full-stack interplanetary booking app: **FastAPI + SQLite backend** (`booking_system_backend/`) and **React 19 + TypeScript + Vite frontend** (`booking_system_frontend/`). Backend also exposes an **MCP endpoint** at `/mcp` via `fastmcp`.

## Commands

All commands must be run from their respective subdirectory — there is no monorepo root runner.

### Backend (`booking_system_backend/`)
```bash
pytest                                                          # all tests
pytest tests/test_rest.py::TestFlightsEndpoint::test_name      # single test by class+name
pytest tests/test_services.py -k "test_name"                   # single test by keyword
python server.py                                               # dev server on port 8080
```
`pytest.ini` sets `testpaths = tests` relative to `booking_system_backend/` — running pytest from the repo root will find no tests.

### Frontend (`booking_system_frontend/`)
```bash
npm run lint    # eslint (only non-obvious script; dev/build/preview are standard)
```

## Critical Patterns

### Backend
- **Service functions return `ErrorResponse` on failure — never raise.** REST handlers return the value directly (FastAPI serializes it via the `Union` response model); MCP tools must `isinstance`-check and `raise Exception(result.details or result.error)`.
- **MCP tools cannot use `Depends`** — they open `SessionLocal()` directly in a `try/finally: db.close()` block. New tools must be decorated with `@mcp.tool()` _before_ `mcp_app = mcp.http_app()` is called.
- **All datetime columns are `String`** in `models.py` — do not use SQLAlchemy `DateTime`; store ISO 8601 UTC strings.
- **`seed.py` wipes and replaces all data on every server startup** (explicit `DELETE` before inserting). Seeded `Booking` rows are inserted without decrementing `seats_available` — flight seat counts in a freshly started dev DB may not reflect seeded booking counts.
- Use `Model.model_validate(orm_obj)` (Pydantic v2) — `from_orm()` is removed.
- `conftest.py` patches `server.seed` to a no-op and provides a fresh in-memory DB per test function — tests always start empty.

### Frontend
- **`isErrorResponse(response)`** in [`src/services/api.ts`](booking_system_frontend/src/services/api.ts) is the canonical discriminator for `User | ErrorResponse` / `Booking | ErrorResponse` union returns. The axios interceptor normalises all HTTP errors to that shape — catch and check `.error_code`, not raw Axios errors.
- User session persists in `localStorage` under key `'galaxium_user'` via [`src/hooks/useUser.tsx`](booking_system_frontend/src/hooks/useUser.tsx). `useUser()` throws if called outside `<UserProvider>`.
- All datetime strings come from the backend as ISO 8601. Use `parseISO` + helpers from [`src/utils/formatters.ts`](booking_system_frontend/src/utils/formatters.ts) (uses `date-fns`) — do not use `new Date(string)` directly.
- API base URL: `VITE_API_URL` env var (Vite prefix required; plain `API_URL` is ignored); falls back to `http://localhost:8080`. Copy `.env.example` → `.env`.
- Frontend TypeScript types mirror backend snake_case field names (`flight_id`, `booking_time`, etc.) — see [`src/types/index.ts`](booking_system_frontend/src/types/index.ts).
