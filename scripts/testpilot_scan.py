#!/usr/bin/env python3
"""TestPilot scan script — stdlib only.

Runs backend (pytest --cov) and frontend (vitest run --reporter=json),
then writes testpilot_dashboard/public/report.json and appends to
testpilot_dashboard/public/history.json (keeps last 20 entries).
"""

import json
import os
import re
import subprocess
import sys
import tempfile
from datetime import datetime, timezone

# ---------------------------------------------------------------------------
# Paths (resolve relative to repo root regardless of cwd)
# ---------------------------------------------------------------------------
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.dirname(SCRIPT_DIR)
BACKEND_DIR = os.path.join(REPO_ROOT, "booking_system_backend")
FRONTEND_DIR = os.path.join(REPO_ROOT, "booking_system_frontend")
DASHBOARD_PUBLIC = os.path.join(REPO_ROOT, "testpilot_dashboard", "public")
REPORT_PATH = os.path.join(DASHBOARD_PUBLIC, "report.json")
HISTORY_PATH = os.path.join(DASHBOARD_PUBLIC, "history.json")

os.makedirs(DASHBOARD_PUBLIC, exist_ok=True)

# ---------------------------------------------------------------------------
# Baseline (from docs/BASELINE.md)
# ---------------------------------------------------------------------------
BASELINE = {
    "backend": {
        "tests": 29,
        "passed": 29,
        "failed": 0,
        "warnings": 6,
        "coverage_total": 86,
        "files": [
            {"name": "db.py", "coverage": 69},
            {"name": "models.py", "coverage": 100},
            {"name": "schemas.py", "coverage": 100},
            {"name": "seed.py", "coverage": 18},
            {"name": "server.py", "coverage": 59},
            {"name": "services/__init__.py", "coverage": 100},
            {"name": "services/booking.py", "coverage": 100},
            {"name": "services/flight.py", "coverage": 100},
            {"name": "services/user.py", "coverage": 100},
        ],
    },
    "frontend": {
        "test_files": 0,
        "tests": 0,
        "passed": 0,
        "failed": 0,
    },
    "bugs_found": 2,
    "bugs_fixed": 2,
}

# ---------------------------------------------------------------------------
# Bugs (from docs/RESULTS.md Run 2 / Run 3)
# ---------------------------------------------------------------------------
BUGS = [
    {
        "id": 1,
        "file": "src/services/api.ts",
        "title": "isErrorResponse returns null/undefined (not false) for nullish inputs — violates boolean return type",
        "status": "fixed",
    },
    {
        "id": 2,
        "file": "src/utils/formatters.ts",
        "title": "calculateDuration produces 'NaNh NaNm' for invalid date strings — dead try/catch, parseISO never throws",
        "status": "fixed",
    },
]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def run(cmd: list[str], cwd: str) -> tuple[int, str, str]:
    """Run a subprocess, stream stdout/stderr to console, return (returncode, stdout, stderr)."""
    print(f"\n>>> {' '.join(cmd)}", flush=True)
    buf_out: list[str] = []
    buf_err: list[str] = []
    with subprocess.Popen(
        cmd,
        cwd=cwd,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    ) as proc:
        assert proc.stdout and proc.stderr
        import select, io  # noqa: E401
        remaining = {proc.stdout.fileno(): (proc.stdout, buf_out, sys.stdout),
                     proc.stderr.fileno(): (proc.stderr, buf_err, sys.stderr)}
        while remaining:
            readable, _, _ = select.select(list(remaining), [], [], 0.1)
            for fd in readable:
                stream, buf, mirror = remaining[fd]
                line = stream.readline()
                if line:
                    buf.append(line)
                    mirror.write(line)
                    mirror.flush()
                else:
                    del remaining[fd]
        proc.wait()
    return proc.returncode, "".join(buf_out), "".join(buf_err)


# ---------------------------------------------------------------------------
# Backend scan
# ---------------------------------------------------------------------------
def _backend_python() -> str:
    """Return the python interpreter that has pytest installed (prefer venv)."""
    venv_py = os.path.join(BACKEND_DIR, ".venv", "bin", "python3")
    if os.path.exists(venv_py):
        return venv_py
    return sys.executable


def scan_backend() -> dict:
    cov_json = os.path.join(BACKEND_DIR, "coverage.json")
    # Remove stale coverage file
    if os.path.exists(cov_json):
        os.remove(cov_json)

    py = _backend_python()
    rc, stdout, stderr = run(
        [py, "-m", "pytest", "--cov=.", "--cov-report=json", "-W", "all", "--tb=short"],
        cwd=BACKEND_DIR,
    )
    combined = stdout + stderr

    # --- counts ---
    tests = passed = failed = 0
    m = re.search(r"(\d+) passed", combined)
    if m:
        passed = int(m.group(1))
    m = re.search(r"(\d+) failed", combined)
    if m:
        failed = int(m.group(1))
    tests = passed + failed

    # --- warnings ---
    warning_count = len(re.findall(r"DeprecationWarning|PydanticDeprecated|MovedIn20", combined))
    # also count the standard pytest warning summary line
    wm = re.search(r"(\d+) warning", combined)
    if wm:
        warning_count = int(wm.group(1))

    # --- coverage from JSON ---
    coverage_total = 0
    files: list[dict] = []
    if os.path.exists(cov_json):
        with open(cov_json) as f:
            cov_data = json.load(f)
        totals = cov_data.get("totals", {})
        coverage_total = round(totals.get("percent_covered", 0))
        for fpath, fdata in cov_data.get("files", {}).items():
            # Strip leading "./" and backend dir prefix
            name = fpath.replace("./", "")
            pct = round(fdata.get("summary", {}).get("percent_covered", 0))
            files.append({"name": name, "coverage": pct})
        # sort by name
        files.sort(key=lambda x: x["name"])
    else:
        # Fallback: parse term output
        coverage_total = 0
        for line in combined.splitlines():
            m = re.match(r"TOTAL\s+\d+\s+\d+\s+(\d+)%", line)
            if m:
                coverage_total = int(m.group(1))
            fm = re.match(r"([\w./]+\.py)\s+\d+\s+\d+\s+(\d+)%", line)
            if fm:
                files.append({"name": fm.group(1), "coverage": int(fm.group(2))})

    # Only list application code in the per-file table, not the test files themselves
    files = [f for f in files if not f["name"].startswith("tests/")]

    return {
        "tests": tests,
        "passed": passed,
        "failed": failed,
        "warnings": warning_count,
        "coverage_total": coverage_total,
        "files": files,
    }


# ---------------------------------------------------------------------------
# Frontend scan
# ---------------------------------------------------------------------------
def scan_frontend() -> dict:
    with tempfile.NamedTemporaryFile(suffix=".json", delete=False) as tf:
        json_out = tf.name

    try:
        rc, stdout, stderr = run(
            ["npx", "vitest", "run", "--reporter=json", f"--outputFile={json_out}"],
            cwd=FRONTEND_DIR,
        )
        if os.path.exists(json_out):
            with open(json_out) as f:
                data = json.load(f)
            test_files = len(data.get("testResults", []))  # one entry per test file
            tests = data.get("numTotalTests", 0)
            passed = data.get("numPassedTests", 0)
            failed = data.get("numFailedTests", 0)
        else:
            # Fallback parse
            combined = stdout + stderr
            test_files = passed = failed = tests = 0
            m = re.search(r"Test Files\s+(\d+) passed", combined)
            if m:
                test_files = int(m.group(1))
            m = re.search(r"Tests\s+(\d+) passed", combined)
            if m:
                passed = int(m.group(1))
            m = re.search(r"(\d+) failed", combined)
            if m:
                failed = int(m.group(1))
            tests = passed + failed
    finally:
        if os.path.exists(json_out):
            os.remove(json_out)

    return {
        "test_files": test_files,
        "tests": tests,
        "passed": passed,
        "failed": failed,
    }


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main() -> None:
    timestamp = datetime.now(timezone.utc).isoformat()
    print("=== TestPilot Scan ===")
    print(f"Timestamp: {timestamp}")

    print("\n--- Backend ---")
    backend = scan_backend()
    print(f"  Tests: {backend['passed']}/{backend['tests']} passed  |  Coverage: {backend['coverage_total']}%  |  Warnings: {backend['warnings']}")

    print("\n--- Frontend ---")
    frontend = scan_frontend()
    print(f"  Tests: {frontend['passed']}/{frontend['tests']} passed  |  Files: {frontend['test_files']}")

    report = {
        "timestamp": timestamp,
        "backend": backend,
        "frontend": frontend,
        "bugs": BUGS,
        "baseline": BASELINE,
    }

    with open(REPORT_PATH, "w") as f:
        json.dump(report, f, indent=2)
    print(f"\n✓ Wrote {REPORT_PATH}")

    # --- history ---
    history: list[dict] = []
    if os.path.exists(HISTORY_PATH):
        with open(HISTORY_PATH) as f:
            try:
                history = json.load(f)
            except json.JSONDecodeError:
                history = []

    history_entry = {
        "timestamp": timestamp,
        "backend_coverage": backend["coverage_total"],
        "backend_tests": backend["tests"],
        "backend_passed": backend["passed"],
        "backend_warnings": backend["warnings"],
        "frontend_tests": frontend["tests"],
        "frontend_passed": frontend["passed"],
    }
    history.append(history_entry)
    history = history[-20:]  # keep last 20

    with open(HISTORY_PATH, "w") as f:
        json.dump(history, f, indent=2)
    print(f"✓ Wrote {HISTORY_PATH} ({len(history)} entries)")


if __name__ == "__main__":
    main()
