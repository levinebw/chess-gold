# TASK-059: Phase 8 Backend Deployment — Firestore + Updated Cloud Run

**Role:** Backend Developer
**Phase:** 8D — Backend Deployment
**Status:** COMPLETE
**Priority:** High (blocks QA)
**Dependencies:** TASK-039, TASK-040, TASK-041, TASK-042, TASK-044

## Context

The Phase 8 server features (Firestore persistence, player identity, Elo ratings, match recording, profiles, leaderboard) are built and tested against mocks. The Cloud Run deployment from Phase 4 (Task 020) runs the Socket.IO multiplayer server but has no Firestore access. This task provisions Firestore, grants the Cloud Run service account access, and redeploys the server with all Phase 8 backend features live.

### Prerequisites

- Read `tasks/TASK-020-LEAD-DEV.md` (original Cloud Run deployment)
- Read `src/server/db.ts` (Firestore initialization — uses `FIRESTORE_PROJECT_ID` / `GOOGLE_CLOUD_PROJECT`)
- Read `.github/workflows/deploy.yml` or any existing Cloud Run deployment config
- Confirm user has GCP project and billing enabled (set up during Task 020)

## Deliverables

### 1. Local development: Firestore emulator

- [ ] Add `firebase-tools` as a dev dependency (`npm install -D firebase-tools`)
- [ ] Create `firebase.json` at project root with Firestore emulator config:
  ```json
  {
    "emulators": {
      "firestore": { "port": 8080 }
    }
  }
  ```
- [ ] Add npm script: `"emulators": "firebase emulators:start --only firestore"`
- [ ] Update `src/server/db.ts` to detect the emulator: when `FIRESTORE_EMULATOR_HOST` env var is set, Firestore client auto-connects to the emulator (built-in behavior, no code change needed — just verify)
- [ ] Add npm script for local dev with emulator: `"dev:server": "FIRESTORE_EMULATOR_HOST=localhost:8080 npx tsx src/server/index.ts"` (or equivalent)
- [ ] Document in README or a short `DEVELOPMENT.md` section: how to run emulator + server locally
- [ ] Verify: `npm run emulators` starts Firestore emulator, `npm run dev:server` connects to it, player registration/login/matches work against emulator

### 2. Provision Firestore in GCP

- [ ] Enable Firestore API in the existing GCP project
- [ ] Create Firestore database in Native mode (not Datastore mode)
- [ ] Choose region (same as Cloud Run service for lowest latency — check existing Cloud Run region)

### 2. Firestore indexes

- [ ] Create composite index for `getPlayerByToken`: collection `players`, field `playerToken` (ascending)
- [ ] Create composite index for `getLeaderboard`: collection `players`, field `rating` (descending)
- [ ] Create composite indexes for `getPlayerMatches`: collection `matches`, field `white.playerId` + `endedAt` (descending), and `black.playerId` + `endedAt` (descending)
- [ ] Export index definitions to `firestore.indexes.json` for reproducibility

### 3. IAM permissions

- [ ] Grant the Cloud Run service account `roles/datastore.user` (Firestore read/write) on the GCP project
- [ ] Verify Cloud Run provides default credentials automatically (no explicit key file needed)

### 4. Environment variables

- [ ] Set `FIRESTORE_PROJECT_ID` on the Cloud Run service (if different from `GOOGLE_CLOUD_PROJECT` which Cloud Run injects automatically)
- [ ] Verify `db.ts` initialization works with Cloud Run's default credentials

### 5. Redeploy server to Cloud Run

- [ ] Build updated server image with `@google-cloud/firestore` dependency
- [ ] Deploy to Cloud Run (same service as Phase 4, updated image)
- [ ] Verify the service starts and connects to Firestore

### 6. Smoke test against live Firestore

- [ ] Register a new player → verify document appears in Firestore console
- [ ] Login with token → verify lookup works
- [ ] Play a rated game → verify match document recorded, ratings updated
- [ ] Check leaderboard → verify query returns results
- [ ] View profile → verify stats and recent matches
- [ ] Play a casual game → verify NO match recorded, ratings unchanged

### 7. Fix known bug: matchRecorded not reset on rematch

- [ ] In `src/server/index.ts`, add `room.matchRecorded = false;` in the rematch handler (discovered during Task 042 review)
- [ ] Include in this deployment

## Files

**Modify:**
- `src/server/index.ts` (matchRecorded fix)
- `package.json` (add `firebase-tools` dev dep, new npm scripts)

**Create:**
- `firebase.json` (emulator config)
- `firestore.indexes.json` (index definitions for reproducibility)

**GCP configuration (not in repo):**
- Firestore database provisioning
- IAM role binding
- Cloud Run service update

## Acceptance Criteria

- [ ] Firestore database provisioned and accessible from Cloud Run
- [ ] Cloud Run service account has Firestore read/write permissions
- [ ] Server deployed and running with Firestore connectivity
- [ ] Player registration creates real Firestore documents
- [ ] Token-based login works against real Firestore
- [ ] Rated games record matches and update Elo in Firestore
- [ ] Casual games do not record matches or update ratings
- [ ] Leaderboard queries return correct results from Firestore
- [ ] Player profile queries return stats and recent matches
- [ ] Rematch in rated room correctly records second game (matchRecorded bug fixed)
- [ ] Firestore emulator runs locally via `npm run emulators`
- [ ] Local server connects to emulator when `FIRESTORE_EMULATOR_HOST` is set
- [ ] All Firestore features work against emulator (register, login, matches, leaderboard)
- [ ] `npx vitest run` — all existing tests pass
- [ ] `npm run server:check` passes
