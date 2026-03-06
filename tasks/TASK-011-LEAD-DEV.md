# Task 011 — Lead Developer

## Add CI Test Step to Deploy Workflow

### Objective

Add `npx vitest run` to the GitHub Actions deploy workflow so broken code can't ship to production. Currently, the workflow builds and deploys without running tests.

### Deliverables

1. Update `.github/workflows/deploy.yml` to run tests before building:
   ```yaml
   - run: npm ci
   - run: npx vitest run    # NEW — fail fast if tests break
   - run: npm run build
   ```

2. Verify the workflow succeeds by pushing the change.

### Done When

**Status: COMPLETE**

- [x] Deploy workflow includes test step before build
- [x] Workflow passes on push to main
- [x] Commit and push
