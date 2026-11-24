#!/usr/bin/env bash
# Run the Playwright E2E suite and write a local HTML report.
#
#   e2e/run.sh [--open] [playwright args…]
#     e2e/run.sh                                   all scenarios
#     e2e/run.sh e2e/screens/shell.spec.ts         one file
#     e2e/run.sh -g "A06010300" --open             one screen, open the report when done
#
# Credentials: E2E_USER / E2E_PASS from the environment, otherwise from E2E_ENV_FILE
# (default e2e/.env.e2e — git-ignored; copy e2e/.env.e2e.example).
# Report: e2e/.report/<yyyymmdd-hhmmss>/index.html, `e2e/.report/latest` points at the newest;
# only the last E2E_KEEP_REPORTS (default 10) runs are kept.
# Backend: E2E_API_TARGET (default http://127.0.0.1:17200) must answer before the run starts.
set -uo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

OPEN=false
ARGS=()
for arg in "$@"; do
  if [[ "$arg" == --open ]]; then OPEN=true; else ARGS+=("$arg"); fi
done

ENV_FILE="${E2E_ENV_FILE:-e2e/.env.e2e}"
if [[ -z "${E2E_USER:-}" || -z "${E2E_PASS:-}" ]] && [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  . "$ENV_FILE"
  set +a
fi
if [[ -z "${E2E_USER:-}" || -z "${E2E_PASS:-}" ]]; then
  echo "run.sh: set E2E_USER / E2E_PASS or create $ENV_FILE (see e2e/.env.e2e.example)" >&2
  exit 2
fi

API_TARGET="${E2E_API_TARGET:-http://127.0.0.1:17200}"
if ! curl -sf -o /dev/null --max-time 5 "$API_TARGET/api/auth/public-key"; then
  echo "run.sh: backend $API_TARGET is not answering (/api/auth/public-key) — start it first" >&2
  exit 3
fi

STAMP="$(date +%Y%m%d-%H%M%S)"
REPORT_ROOT="e2e/.report"
export E2E_REPORT_DIR="$REPORT_ROOT/$STAMP"
export E2E_USER E2E_PASS E2E_API_TARGET="$API_TARGET"

echo "▶ Playwright → $API_TARGET · report $E2E_REPORT_DIR"
pnpm exec playwright test ${ARGS[@]+"${ARGS[@]}"}
STATUS=$?

if [[ -f "$E2E_REPORT_DIR/index.html" ]]; then
  ln -sfn "$STAMP" "$REPORT_ROOT/latest"
  # Keep only the newest runs.
  ls -1d "$REPORT_ROOT"/2*/ 2>/dev/null | sort -r | tail -n +"$(( ${E2E_KEEP_REPORTS:-10} + 1 ))" | while read -r old; do rm -rf "$old"; done
  echo "📄 Report: $ROOT/$E2E_REPORT_DIR/index.html"
  echo "   View:   pnpm exec playwright show-report $E2E_REPORT_DIR"
fi

[[ $STATUS -eq 0 ]] && echo "✅ All scenarios passed" || echo "❌ Some scenarios failed (exit $STATUS)"
# Serves the report (traces need http) until Ctrl+C.
if $OPEN && [[ -f "$E2E_REPORT_DIR/index.html" ]]; then pnpm exec playwright show-report "$E2E_REPORT_DIR"; fi
exit $STATUS
