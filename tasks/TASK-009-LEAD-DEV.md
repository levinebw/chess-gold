# Task 009 — Lead Developer

## Deploy to GitHub Pages (Alpha)

### Objective

Deploy Chess Gold to GitHub Pages so end-users can play-test the alpha. The game is a static Vite build with no backend — GitHub Pages is ideal.

### Prerequisites

- Task 007 complete (full MVP playable in browser)
- Task 008 complete (playtest bugs fixed, if any)
- All tests pass (`npx vitest run`)
- `npm run dev` runs the game correctly locally

### Deliverables

#### 1. Configure Vite for GitHub Pages

Update `vite.config.ts` to set the correct base path for GitHub Pages:

```typescript
export default defineConfig({
  base: '/chess-gold/',  // Must match the repo name
  // ... existing config
});
```

**Important:** GitHub Pages serves from `https://<username>.github.io/<repo>/`, so all asset paths need the `/chess-gold/` prefix. Vite's `base` config handles this automatically.

#### 2. Add Build Script

Verify `package.json` has:
```json
{
  "scripts": {
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

Run `npm run build` locally and verify the output in `dist/` works:
```bash
npm run build
npm run preview
```

Open the preview URL and confirm the game works (board renders, pieces move, shop works, game over dialog appears).

#### 3. GitHub Actions Workflow (`.github/workflows/deploy.yml`)

Create a workflow that builds and deploys on push to `main`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:  # Allow manual deploys

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

#### 4. Enable GitHub Pages in Repo Settings

This is a **user task** — the Lead Dev cannot change repo settings via CLI.

## USER TASK

Enable GitHub Pages for the repo:

1. Go to https://github.com/levinebw/chess-gold/settings/pages
2. Under **Source**, select **GitHub Actions**
3. Save

That's it. Once the workflow runs, the site will be live at:
**https://levinebw.github.io/chess-gold/**

Estimated time: 1 minute.

#### 5. Verify Deployment

After the workflow runs:
- Visit https://levinebw.github.io/chess-gold/
- Verify the board renders
- Verify pieces can be moved
- Verify the shop works (if Task 007 is complete)
- Check browser console for asset loading errors (broken paths = wrong `base` config)

#### 6. Add Deploy URL to README

Update `README.md` with a "Play Now" link:
```markdown
## Play

[Play Chess Gold](https://levinebw.github.io/chess-gold/) (alpha)
```

### Troubleshooting

- **Blank page:** Check `base` in `vite.config.ts` matches the repo name
- **404 on refresh:** GitHub Pages doesn't support SPA routing. Not an issue for us (single-page app with no router), but if we add routing later, we'll need a 404.html redirect
- **Assets not loading:** Verify `npm run build` output in `dist/` has correct relative paths
- **Workflow fails:** Check Node version matches what we use locally

### What This Does NOT Include

- Custom domain (future — when we want `chessgold.io` or similar)
- Preview deploys for PRs (future — Vercel does this well)
- CI test runs before deploy (could add `npm test` step — nice-to-have)
- Analytics (Phase 2-3)

### Done When

- [ ] `npm run build` produces a working build in `dist/`
- [ ] `npm run preview` serves the game correctly
- [ ] GitHub Actions workflow exists and runs successfully
- [ ] GitHub Pages is enabled (user task)
- [ ] Game is accessible at https://levinebw.github.io/chess-gold/
- [ ] Board renders, pieces move, shop works at the deployed URL
- [ ] README updated with play link
- [ ] Commit and push
