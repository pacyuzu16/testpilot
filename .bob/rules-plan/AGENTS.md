# Project Architecture Rules (Non-Obvious Only)

- **MCP server must be fully configured before `mcp.http_app()` is called** — all `@mcp.tool()` registrations must precede `mcp_app = mcp.http_app()` in `server.py`; the app is then mounted via `app.mount("/mcp", mcp_app)`.
- `seed.py` runs inside the FastAPI `lifespan` and **deletes all rows before reinserting** — any schema migration must update `models.py`; there are no migration files (Alembic is not used).
- Services layer (`booking_system_backend/services/`) is the single source of business logic — both REST endpoints and MCP tools delegate to the same service functions. No logic lives in `server.py` route handlers.
- **No ORM relationships are defined** — all cross-table lookups are manual `db.query()` calls (e.g. `cancel_booking` re-fetches the flight by `flight_id` to restore seats).
- User identity is stored in `localStorage` (`'galaxium_user'`) — the frontend has no server-side session; losing localStorage clears the session.
- **Frontend has no test suite** — `npm run build` (TypeScript compile + Vite build) is the only automated check.
- `seed.py` does not adjust `seats_available` when creating seeded bookings — the seats column only changes through the live `book_flight` / `cancel_booking` service calls.
