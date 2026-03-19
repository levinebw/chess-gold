#!/usr/bin/env bash
# Launch frontend (Vite) and game server locally, kill all on exit.
# Usage:
#   ./dev.sh              — start without Firestore (identity/ratings disabled)
#   ./dev.sh --firestore  — start with Firestore emulator (full features)

set -euo pipefail

USE_FIRESTORE=false
if [[ "${1:-}" == "--firestore" ]]; then
  USE_FIRESTORE=true
fi

cleanup() {
  echo ""
  echo "Shutting down..."
  [[ -n "${EMULATOR_PID:-}" ]] && kill "$EMULATOR_PID" 2>/dev/null && echo "  Emulator stopped (PID $EMULATOR_PID)"
  [[ -n "${SERVER_PID:-}" ]]   && kill "$SERVER_PID"   2>/dev/null && echo "  Server stopped (PID $SERVER_PID)"
  [[ -n "${VITE_PID:-}" ]]     && kill "$VITE_PID"     2>/dev/null && echo "  Vite stopped (PID $VITE_PID)"
  wait 2>/dev/null
  echo "Done."
}
trap cleanup EXIT INT TERM

cd "$(dirname "$0")"

if $USE_FIRESTORE; then
  echo "Starting Firestore emulator (port 8080)..."
  npm run emulators &
  EMULATOR_PID=$!
  sleep 3

  echo "Starting game server with Firestore (port 3001)..."
  npm run server:dev:firestore &
  SERVER_PID=$!
else
  echo "Starting game server (port 3001)..."
  npm run server:dev &
  SERVER_PID=$!
fi

echo "Starting Vite dev server (port 5173)..."
npm run dev &
VITE_PID=$!

echo ""
echo "  Frontend:  http://localhost:5173"
echo "  Server:    http://localhost:3001"
if $USE_FIRESTORE; then
  echo "  Firestore: http://localhost:8080 (emulator)"
fi
echo ""
echo "Press Ctrl+C to stop all."

wait
