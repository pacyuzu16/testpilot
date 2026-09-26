# Project Documentation Rules (Non-Obvious Only)

- The backend exposes **two protocols on one server**: REST at standard paths and MCP at `/mcp` — both handled by the same `server.py` FastAPI app.
- `booking_system_backend/seed.py` populates 10 users, 10 flights, 20 bookings on every server startup — the database is **reset each time** `server.py` starts.
- There is no authentication layer — "login" is purely a lookup by `name + email`; `user_id` is the only identity token.
- The `Booking.status` field is a free-form string in the DB model, but the frontend TypeScript type constrains it to `'booked' | 'cancelled' | 'completed'`.
- Frontend component re-exports live in `src/components/common/index.ts` — import common components from there, not individual files.
- `DATA_SOURCES.md` in the repo root documents the sample data seeded into the DB.
