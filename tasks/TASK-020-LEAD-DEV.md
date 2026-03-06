# Task 020 — Lead Developer

## Deploy Server to GCP Cloud Run

### Objective

Deploy the multiplayer server to GCP Cloud Run and connect the production frontend to it.

### Prerequisites

- Task 018 complete (server works locally)
- Task 019 complete (client connects to server)
- User has completed GCP setup tasks (see below)

## USER TASK (before dev starts)

Set up GCP for Cloud Run deployment (~15 minutes):

1. **Enable APIs** in GCP Console:
   - Go to https://console.cloud.google.com/apis/library
   - Enable: Cloud Run API, Artifact Registry API, Cloud Build API

2. **Create Artifact Registry repository:**
   - Go to https://console.cloud.google.com/artifacts
   - Create repository: name=`chess-gold`, format=Docker, region=`us-central1`

3. **Create a service account for GitHub Actions:**
   - Go to https://console.cloud.google.com/iam-admin/serviceaccounts
   - Create service account: `chess-gold-deploy`
   - Grant roles: Cloud Run Admin, Artifact Registry Writer, Service Account User
   - Create a JSON key and download it

4. **Add GitHub secrets:**
   - Go to https://github.com/levinebw/chess-gold/settings/secrets/actions
   - Add `GCP_PROJECT_ID` — your GCP project ID
   - Add `GCP_SA_KEY` — paste the entire JSON key file contents

5. **Report back:**
   - GCP project ID
   - Artifact Registry repository URL
   - Confirmation that secrets are added

Estimated time: 15 minutes.

### Deliverables

#### 1. GitHub Actions Workflow: `.github/workflows/deploy-server.yml`

Builds Docker image, pushes to Artifact Registry, deploys to Cloud Run:

```yaml
name: Deploy Server to Cloud Run

on:
  push:
    branches: [main]
    paths:
      - 'src/server/**'
      - 'src/engine/**'
      - 'Dockerfile'
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: google-github-actions/auth@v2
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}
      - uses: google-github-actions/setup-gcloud@v2
      - run: gcloud auth configure-docker us-central1-docker.pkg.dev
      - run: docker build -t us-central1-docker.pkg.dev/${{ secrets.GCP_PROJECT_ID }}/chess-gold/server:${{ github.sha }} .
      - run: docker push us-central1-docker.pkg.dev/${{ secrets.GCP_PROJECT_ID }}/chess-gold/server:${{ github.sha }}
      - run: |
          gcloud run deploy chess-gold-server \
            --image us-central1-docker.pkg.dev/${{ secrets.GCP_PROJECT_ID }}/chess-gold/server:${{ github.sha }} \
            --region us-central1 \
            --platform managed \
            --allow-unauthenticated \
            --port 8080 \
            --min-instances 0 \
            --max-instances 10 \
            --timeout 3600 \
            --session-affinity
```

Key flags:
- `--min-instances 0` — scale to zero
- `--max-instances 10` — cap scaling
- `--timeout 3600` — 1-hour request timeout for WebSocket connections
- `--session-affinity` — sticky sessions so WebSocket reconnects hit the same instance

#### 2. Update Frontend Environment

Add the Cloud Run service URL to the GitHub Pages deploy workflow as `VITE_SERVER_URL`:

```yaml
- run: VITE_SERVER_URL=https://chess-gold-server-XXXXX-uc.a.run.app npm run build
```

#### 3. CORS Configuration

Update the server to allow the GitHub Pages origin:

```typescript
const io = new Server(server, {
  cors: {
    origin: ['https://levinebw.github.io', 'http://localhost:5173'],
    methods: ['GET', 'POST'],
  },
});
```

#### 4. Verify Deployment

- Server health check responds at Cloud Run URL
- Frontend at GitHub Pages can connect to the server
- Two players can play a game across the internet

### Done When

- [ ] Dockerfile builds successfully
- [ ] GitHub Actions workflow deploys to Cloud Run
- [ ] Server scales to zero when idle
- [ ] Frontend connects to production server
- [ ] Two players can play online via the deployed URLs
- [ ] CORS is correctly configured
- [ ] All tests pass
- [ ] Commit and push
