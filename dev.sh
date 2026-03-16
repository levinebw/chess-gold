#!/usr/bin/env bash
# Launch frontend (Vite) and game server locally, kill both on exit.

set -euo pipefail

cleanup() {
  echo ""
  echo "Shutting down..."
  [[ -n "${SERVER_PID:-}" ]] && kill "$SERVER_PID" 2>/dev/null && echo "  Server stopped (PID $SERVER_PID)"
  [[ -n "${VITE_PID:-}" ]]   && kill "$VITE_PID"   2>/dev/null && echo "  Vite stopped (PID $VITE_PID)"
  wait 2>/dev/null
  echo "Done."
}
trap cleanup EXIT INT TERM

cd "$(dirname "$0")"

echo "Starting game server (port 3001)..."
npm run server:dev &
SERVER_PID=$!

echo "Starting Vite dev server (port 5173)..."
npm run dev &
VITE_PID=$!

echo ""
echo "  Frontend: http://localhost:5173"
echo "  Server:   http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop both."

wait
