# Project Coding Rules (Non-Obvious Only)

- Service functions return `ErrorResponse` on failure — **never raise**. REST handlers return it directly; MCP tools must `isinstance`-check and `raise Exception(result.details or result.error)`.
- MCP tools **cannot use FastAPI `Depends`** — open `SessionLocal()` directly in a `try/finally: db.close()` block. New `@mcp.tool()` decorators must appear _before_ `mcp_app = mcp.http_app()` in `server.py`.
- DB models store all datetimes as **plain `String` columns** — do not use SQLAlchemy `DateTime`.
- Use `Model.model_validate(orm_obj)` (Pydantic v2) — `from_orm()` is removed.
- Backend tests **must run from `booking_system_backend/`** — `pytest.ini`'s `testpaths = tests` is relative to that dir.
- `conftest.py` patches `server.seed` to a no-op — tests start with an empty in-memory DB scoped per function.
- `seed.py` inserts 20 `Booking` rows without touching `seats_available` — dev DB seat counts won't match booking counts after startup.
- Frontend `isErrorResponse()` (`src/services/api.ts`) is the canonical union discriminator — use it instead of `'error' in response`.
- User state key in localStorage is `'galaxium_user'` — `useUser()` throws if called outside `<UserProvider>`.
- All date display must go through helpers in `src/utils/formatters.ts` (`parseISO` + `date-fns`) — never `new Date(isoString)` directly.
