# Good Test Checklist

Every test written by this skill must satisfy all of the following before it is committed.

---

## Structure

- [ ] **Arrange / Act / Assert** — three clearly separated phases. Arrange sets up state and inputs. Act calls the unit under test. Assert checks the outcome.
- [ ] **One behaviour per test** — a test should have exactly one reason to fail. If you need to verify two distinct behaviours, write two tests.
- [ ] **Descriptive name** — the test name states what it tests and what the expected outcome is (e.g. `test_book_flight_returns_error_when_no_seats_available`, not `test_book_flight_2`).

---

## Coverage

- [ ] **Happy path** — the expected, valid input produces the expected output.
- [ ] **Edge cases** — empty inputs, boundary values, maximum values.
- [ ] **Error / failure cases** — invalid inputs, missing records, constraint violations.
- [ ] **Status transitions** — for anything with state (e.g. `Booking.status`), test each valid transition and each invalid one.

---

## Isolation

- [ ] **No network calls** — mock or stub all HTTP calls and external services. In the frontend, mock `src/services/api.ts` at the module level. In the backend, use the in-memory SQLite fixture from `conftest.py`.
- [ ] **No shared mutable state** — each test must be independent. One test failing must not cause another to fail or pass.
- [ ] **No file system side effects** — tests must not create, modify, or delete real files. Use temp directories or in-memory equivalents.
- [ ] **Deterministic** — running the same test twice must produce the same result. No `random`, no `datetime.utcnow()` without mocking.

---

## Assertions

- [ ] **Assert the output, not the implementation** — check return values and observable state, not internal calls unless testing a contract boundary.
- [ ] **Specific assertions** — `assert result.error_code == "NO_SEATS_AVAILABLE"` is better than `assert result is not None`.
- [ ] **Error path assertions** — for functions that return `ErrorResponse`, assert both `error_code` and that the correct field (e.g. `seats_available`) was NOT mutated.

---

## Backend-specific (Python / pytest)

- [ ] Use the `db_session` fixture from `conftest.py` for all database tests — never use the production `SessionLocal`.
- [ ] Use the `client` fixture for REST endpoint tests — it patches `seed()` to a no-op and wires the in-memory DB.
- [ ] Group related tests in a `class Test<Feature>` matching the existing convention in `test_rest.py` and `test_services.py`.
- [ ] Mark tests that document known app bugs with `@pytest.mark.xfail(reason="bug: <description>", strict=True)`.

---

## Frontend-specific (TypeScript / Vitest + React Testing Library)

- [ ] Use `@testing-library/user-event` for interactions (clicks, typing) — not `fireEvent` directly.
- [ ] Query by accessible role or label text, not by CSS class or test ID, unless no semantic query exists.
- [ ] Mock `src/services/api.ts` at the module level with `vi.mock(...)` — individual tests can override with `vi.mocked(...).mockResolvedValueOnce(...)`.
- [ ] Assert on what the user sees (rendered text, element presence) not on component state.
- [ ] Mark tests that document known app bugs with `test.todo('bug: <description>')`.
