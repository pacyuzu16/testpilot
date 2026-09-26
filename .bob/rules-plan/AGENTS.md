# Project Architecture Rules (Non-Obvious Only)

- **MCP server must be fully configured before `mcp.http_app()` is called** — all `@mcp.tool()` registrations happen above line ~101 in `server.py`; then `app.mount("/mcp", mcp_app)` at the bottom.
- The FastAPI `lifespan` calls `init_db()` then `seed()` — any schema migration requires updating `models.py` and ensuring `seed.py` is idempotent, or the DB will corrupt on restart.
- Services layer (`booking_system_backend/services/`) is the single source of business logic — both REST endpoints and MCP tools delegate to the same service functions, ensuring consistent validation.
- There is no ORM relationship defined between models — joins/lookups are done manually via separate `db.query()` calls (e.g., in `cancel_booking`, `flight` is re-fetched by `flight_id`).
- The frontend has **no state management library** — user identity is managed solely via `src/hooks/useUser.tsx` (React context + localStorage implied); do not introduce Redux/Zustand without reading that hook first.
- Frontend has no test suite — the only "test" is `npm run build` (TypeScript compile + Vite build).
