# Project Coding Rules (Non-Obvious Only)

- Service functions return `ErrorResponse` on failure — **never raise**. REST handlers return it directly; MCP tools must `isinstance`-check and `raise Exception(result.details or result.error)`.
- MCP tools in `server.py` **cannot use FastAPI `Depends`** — they must open `SessionLocal()` directly in a `try/finally` block.
- DB models store all datetimes as **plain `String` columns** — do not use SQLAlchemy `DateTime` type.
- Use `Model.model_validate(orm_obj)` (Pydantic v2) — `from_orm()` is removed.
- Backend tests **must be run from `booking_system_backend/`** — `pytest.ini`'s `testpaths = tests` is relative.
- `conftest.py` monkeypatches `server.seed` to a no-op — tests start with an empty DB each function scope.
- Adding a new MCP tool requires a `@mcp.tool()` decorator **before** `mcp_app = mcp.http_app()` is called (line ~101 in `server.py`).
- Frontend `isErrorResponse()` (`src/services/api.ts`) is the canonical discriminator for union API returns — always use it instead of `'error' in response`.
- Frontend env var is `VITE_API_URL` (Vite prefix required); raw `API_URL` will be ignored at build time.
