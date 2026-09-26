# Project Documentation Rules (Non-Obvious Only)

- The backend exposes **two protocols on one server**: REST at standard paths and MCP at `/mcp` — both served by the same `server.py` FastAPI app.
- `seed.py` **wipes all tables then re-inserts** on every server start — the dev database is fully replaced, not appended to.
- Seeded bookings have random status (`'booked'`, `'cancelled'`, `'completed'`) but `seats_available` is never decremented — flight availability shown in the UI won't match actual seeded booking counts.
- There is no authentication layer — "login" is a lookup by exact `name + email` match; `user_id` is the only session token.
- `Booking.status` is an unconstrained `String` in the DB model; the frontend TypeScript type artificially constrains it to `'booked' | 'cancelled' | 'completed'`.
- Frontend common components re-export from `src/components/common/index.ts` — import from there, not individual files.
- `DATA_SOURCES.md` in the repo root documents the seeded demo data.
