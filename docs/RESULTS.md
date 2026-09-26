# TestPilot Results

---

## Run 1 — Backend (2026-09-25)

Scope: `server.py` coverage (was 59%) + 6 deprecation warnings.

### Before / After

| Metric | Before | After |
|---|---|---|
| Backend tests (total) | 29 | **46** |
| Backend tests passing | 29 | **46** |
| Backend coverage (overall %) | 86% | **95%** |
| Backend deprecation warnings | 6 | **0** |

### Coverage per file

| File | Before | After | Notes |
|---|---|---|---|
| `server.py` | 59% | **100%** | Primary target |
| `schemas.py` | 100% | 100% | Statements reduced 16 → 13 after removing `class Config` blocks |
| `models.py` | 100% | 100% | Import path updated; statement count unchanged |
| `services/booking.py` | 100% | 100% | `datetime.utcnow()` fixed |
| `db.py` | 69% | 69% | `get_db()` generator body — not in scope |
| `seed.py` | 18% | 18% | Seed body — not in scope |

### Gaps closed

- **MCP tool `list_flights`** — 2 tests in `tests/test_mcp.py`
- **MCP tool `book_flight`** — 3 tests (success, flight not found, no seats)
- **MCP tool `get_bookings`** — 2 tests
- **MCP tool `cancel_booking`** — 3 tests (success, not found, already cancelled)
- **MCP tool `register_user`** — 2 tests
- **MCP tool `get_user_id`** — 2 tests
- **REST `POST /book` — no seats** — `test_book_flight_no_seats_available` in `TestBookEndpoint`
- **REST `POST /book` — name mismatch** — `test_book_flight_name_mismatch` in `TestBookEndpoint`
- **REST `POST /cancel` — already cancelled** — `test_cancel_booking_already_cancelled` in `TestCancelEndpoint`
- **`server.py` `if __name__ == "__main__"` block** — marked `# pragma: no cover`

### Deprecations fixed

| Warning | File | Change |
|---|---|---|
| `MovedIn20Warning`: `declarative_base()` from old import path | `models.py` | `sqlalchemy.ext.declarative` → `sqlalchemy.orm` |
| `PydanticDeprecatedSince20`: class-based `Config` in `FlightOut` | `schemas.py` | `class Config` → `model_config = ConfigDict(from_attributes=True)` |
| `PydanticDeprecatedSince20`: class-based `Config` in `BookingOut` | `schemas.py` | same |
| `PydanticDeprecatedSince20`: class-based `Config` in `UserOut` | `schemas.py` | same |
| `DeprecationWarning`: `datetime.utcnow()` | `services/booking.py` | `datetime.utcnow()` → `datetime.now(UTC)` |

### Bugs found — Run 1

None. All deprecation fixes were non-breaking API-level updates.

### Remaining gaps — Run 1

| File | Lines missed | Reason |
|---|---|---|
| `db.py` 18–22 | `get_db()` generator body | Exercised indirectly through every REST test; direct unit test has low value. |
| `seed.py` 7–59, 62 | Entire seed body | Patched to no-op in all tests by design; requires writable SQLite. |

---

## Run 2 — Frontend (2026-09-25)

Scope: Install Vitest + RTL from zero; test `services/api.ts`, `utils/formatters.ts`, `hooks/useUser.tsx`, `FlightCard.tsx`, `BookingModal.tsx`.

### Before / After

| Metric | Before | After |
|---|---|---|
| Frontend test files | 0 | **5** |
| Frontend tests (total) | 0 | **56** |
| Frontend tests passing | 0 | **56** |
| Frontend test runner | none | **Vitest 5.0 + RTL** |

### Infrastructure added

| File | Purpose |
|---|---|
| `vitest.config.ts` | Vitest config — jsdom environment, globals, v8 coverage |
| `src/test-setup.ts` | Imports `@testing-library/jest-dom` matchers |
| `tsconfig.test.json` | TS config for tests — adds `vitest/globals` + jest-dom types, relaxes unused-locals |
| `tsconfig.app.json` (modified) | Added `exclude` for `__tests__/` dirs and `test-setup.ts` so build `tsc` ignores test files |
| `package.json` (modified) | Added `"test": "vitest"` script |

### Test files created

| File | Tests | What is covered |
|---|---|---|
| `src/services/__tests__/api.test.ts` | 16 | `isErrorResponse`, all 6 API functions (axios mocked at module level) |
| `src/utils/__tests__/formatters.test.ts` | 18 | All 6 formatter functions, including `getRelativeTime` with fake timers |
| `src/hooks/__tests__/useUser.test.tsx` | 6 | `UserProvider` init, localStorage load/persist/clear, corrupted JSON, `useUser` outside provider |
| `src/components/flights/__tests__/FlightCard.test.tsx` | 8 | Route display, seat availability branching, sold-out disabled state, `onBook` callback |
| `src/components/bookings/__tests__/BookingModal.test.tsx` | 8 | Null-flight guard, passenger info, success path, error response, thrown error, logged-out guard |

### Gaps closed — Run 2

- `services/api.ts` — `isErrorResponse` and all 6 API functions tested
- `utils/formatters.ts` — all 6 formatting utilities tested
- `hooks/useUser.tsx` — `UserProvider` + `useUser` fully tested including localStorage lifecycle
- `components/flights/FlightCard.tsx` — all seat-availability branches tested
- `components/bookings/BookingModal.tsx` — all booking flow paths tested

### Bugs found — Run 2

| # | File | Location | Description | Documented by |
|---|---|---|---|---|
| 1 | `src/services/api.ts` | line 112 | `isErrorResponse` returns `null`/`undefined` (not `false`) for nullish inputs — violates its declared `boolean` return type. Guard should be `response != null && response.success === false`. | `api.test.ts` — `isErrorResponse(null)` and `isErrorResponse(undefined)` assertions use `toBeFalsy()` as a workaround |
| 2 | `src/utils/formatters.ts` | line 80–99 | `calculateDuration` wraps logic in `try/catch` expecting `parseISO` to throw on invalid input, but `date-fns` `parseISO` silently returns `Invalid Date`. Bad inputs produce `'NaNh NaNm'` rather than `'N/A'`. Fix: add an explicit `isNaN` guard before arithmetic. | `formatters.test.ts` — `calculateDuration('bad', 'input')` asserts `toBe('NaNh NaNm')` documenting the current (wrong) behaviour |

### Remaining gaps — Run 2

| Component | Reason not addressed |
|---|---|
| `pages/Flights.tsx`, `pages/MyBookings.tsx`, `pages/Home.tsx` | Page-level integration tests — out of scope for this run; require router context and more complex fixtures |
| `components/bookings/BookingCard.tsx` | Out of scope for this run |
| `components/user/UserIdentification.tsx` | Out of scope for this run |
| `components/layout/Header.tsx`, `Footer.tsx`, `Layout.tsx` | Presentational; lower priority |

---

## Run 3 — Bug fixes (2026-09-25)

Scope: Fix the 2 bugs documented in Run 2, update their tests to assert correct behaviour, verify the full frontend suite still passes.

### Bugs fixed

| # | File | Location | Bug | Fix |
|---|---|---|---|---|
| 1 | `src/services/api.ts` | line 112 | `isErrorResponse` returned `null`/`undefined` (not `false`) for nullish inputs, violating its `boolean` return type | Changed guard to `response != null && response.success === false` so `null` and `undefined` both produce strict `false` |
| 2 | `src/utils/formatters.ts` | lines 84–85 | `calculateDuration` produced `'NaNh NaNm'` for invalid date strings because `parseISO` silently returns `Invalid Date` instead of throwing | Added `isNaN(departure.getTime()) \|\| isNaN(arrival.getTime())` guard that returns `'N/A'` before arithmetic |

### Test assertions corrected

| Test file | Test name | Before (documenting wrong behaviour) | After (asserting correct behaviour) |
|---|---|---|---|
| `src/services/__tests__/api.test.ts` | `isErrorResponse — returns false for null` | `toBeFalsy()` | `toBe(false)` |
| `src/services/__tests__/api.test.ts` | `isErrorResponse — returns false for undefined` | `toBeFalsy()` | `toBe(false)` |
| `src/utils/__tests__/formatters.test.ts` | `calculateDuration — returns N/A for invalid input` | `toBe('NaNh NaNm')` | `toBe('N/A')` |

### Before / After

| Metric | Before (Run 2) | After (Run 3) |
|---|---|---|
| Frontend test files | 5 | **5** |
| Frontend tests (total) | 56 | **56** |
| Frontend tests passing | 56 | **56** |
| Known bugs in app code | 2 | **0** |

### Remaining gaps

Same as Run 2 — page-level components (`Flights.tsx`, `MyBookings.tsx`, `Home.tsx`), `BookingCard.tsx`, `UserIdentification.tsx`, and presentational layout components are not yet covered.
