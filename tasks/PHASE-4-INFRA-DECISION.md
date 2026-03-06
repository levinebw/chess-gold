# Phase 4 — Infrastructure Decision: Online Multiplayer

## Decision: GCP Cloud Run + Socket.IO

### Architecture

```
┌─────────────────────┐        ┌──────────────────────────────┐
│  GitHub Pages        │        │  GCP Cloud Run               │
│  (static frontend)  │◄──────►│  Node.js + Socket.IO server  │
│                     │  WSS   │  Game engine (shared code)    │
│  React + Chessground│        │  Room management              │
└─────────────────────┘        └──────────────────────────────┘
```

- **Frontend:** Stays on GitHub Pages (free, already deployed)
- **Backend:** Node.js + Express + Socket.IO in a Docker container on GCP Cloud Run
- **Game engine:** Same `src/engine/` code runs on both client and server. Server is authoritative.
- **Communication:** WebSocket via Socket.IO (with auto-reconnect)

### Why Cloud Run

| Criterion | Cloud Run | Fly.io | AWS Lambda |
|-----------|-----------|--------|------------|
| Scale to zero | Yes ($0 idle) | No (~$2/mo min) | Yes |
| Auto-scale up | Yes | Yes | Yes |
| WebSocket support | Yes (60-min max) | Yes | Yes (complex) |
| Socket.IO native | Yes | Yes | No |
| Existing account | Yes (GCP) | No | Yes (AWS) |
| Cold start | 1-2s | None (if running) | 1-2s |
| Complexity | Low | Low | High |

**Winner: Cloud Run** — true scale-to-zero, Socket.IO works natively, user already has GCP account, auto-scales to handle spikes.

### Connection Timeout Handling

Cloud Run WebSocket connections timeout after 60 minutes max. For Chess Gold (turn-based):
- Active game traffic (moves every 10-60s) keeps connections alive
- Socket.IO's built-in heartbeat prevents idle disconnects during play
- If a connection drops, Socket.IO auto-reconnects and the server re-syncs game state
- Games abandoned for >60 minutes are cleaned up server-side

### Cost Projections

| Traffic Level | Monthly Cost |
|--------------|-------------|
| Zero (no players) | $0 |
| Light (1-10 concurrent) | $1-3 |
| Moderate (10-100 concurrent) | $5-15 |
| High (100-1000 concurrent) | $15-50 |
| Viral (1000-10000 concurrent) | $50-200 (auto-scales) |

### What This Does NOT Include (Future)

- Database (PostgreSQL for Elo/profiles — Phase 8)
- Custom domain / SSL (nice-to-have)
- CDN for frontend (GitHub Pages is fine for now)
- Analytics / monitoring (can add later)

### User Tasks Required

1. **Enable Cloud Run API** in GCP console
2. **Create a service account** for GitHub Actions deployment
3. **Set up Artifact Registry** (for Docker images)
4. Estimated user time: ~15 minutes, one-time setup
