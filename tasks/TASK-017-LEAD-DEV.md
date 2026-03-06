# Task 017 — Lead Developer

## Extract Shared Engine Package

### Objective

Restructure the project so the game engine (`src/engine/`) can be imported by both the frontend (React) and the backend (Node.js server). Currently, the engine lives inside the frontend source tree. It needs to be importable from a separate server entry point without duplicating code.

### Approach

Use a TypeScript path alias or a simple shared directory structure. No need for a separate npm package — a monorepo-style layout with shared imports is sufficient.

```
chess-gold/
├── src/
│   ├── engine/          ← Shared (imported by both client and server)
│   ├── ui/              ← Frontend only
│   └── server/          ← Backend only (new)
```

### Deliverables

1. **Create `src/server/` directory** — placeholder for the multiplayer server (Task 018)
2. **Verify engine imports work** from both `src/ui/` and `src/server/` contexts
3. **Update `tsconfig.json`** if needed to support the server entry point
4. **Add a server-side smoke test** — import `createInitialState` and `applyAction` from the engine in a Node.js context (no DOM) and verify they work

### Constraints

- Do NOT move files or change import paths in existing UI code
- Engine must remain DOM-free (it already is)
- No build system changes needed for the frontend — Vite handles `src/ui/` as before

### Done When

- [ ] `src/server/` directory exists
- [ ] Engine can be imported from server context
- [ ] Existing frontend builds and tests still pass
- [ ] Commit and push
