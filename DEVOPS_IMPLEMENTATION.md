# Iris — DevOps / CI-CD Implementation

How the Iris social app is built, tested, deployed, and monitored through a
**Jenkins** pipeline, with the supporting infrastructure captured as code so the
whole setup is reproducible. This document is the end-to-end reference for the
demonstration and viva.

---

## 1. System architecture

```
                            ┌──────────────────────────────┐
   git push (main)          │   Jenkins controller (Docker) │
  ───────────────────────▶  │   infra/jenkins/ — Node 20,   │
   GitHub webhook / poll     │   npm, curl, jq baked in      │
                            └───────────────┬───────────────┘
                                            │  Jenkinsfile pipeline
        ┌───────────────────────────────────┼─────────────────────────────────┐
        ▼               ▼                    ▼                  ▼               ▼
    Checkout   Install (∥)   Test (∥)   Build frontend     Deploy          Monitor
                                                          │   │              │
                            POST Render deploy hook  ◀────┘   └──▶ POST Vercel│deploy hook
                                     │                                   │     │
                                     ▼                                   ▼     │ poll /api/health
                        ┌────────────────────────┐        ┌──────────────────┐│ until "db":true
                        │  Render (backend API)  │        │  Vercel (frontend)││
                        │  iris-backend web svc  │        │  React SPA build  ││
                        │  render.yaml Blueprint │        └──────────────────┘│
                        └───────────┬────────────┘ ◀───────────────────────────┘
                                    │ neo4j+s://
                                    ▼
                        ┌────────────────────────┐
                        │   Neo4j Aura (graph DB) │
                        └────────────────────────┘
```

- **Jenkins** is the single orchestrator (course requirement: Jenkins-exclusive).
  It runs in Docker on the developer laptop and drives all four pipeline stages.
- **Render** hosts the Express backend; **Vercel** hosts the React/Vite SPA;
  **Neo4j Aura** is the managed graph database.
- Jenkins never holds platform passwords — it triggers deploys via **Deploy Hook
  URLs** (opaque, revocable) stored as Jenkins secret-text credentials.

> A GitHub Actions workflow (`.github/workflows/`) also exists from earlier
> work; it is **not** the graded pipeline and is left in place only as a
> secondary keep-warm ping. All CI/CD criteria below are satisfied by Jenkins.

---

## 2. The pipeline (`Jenkinsfile`)

Declarative pipeline, runs on `agent any` (the custom controller image already
has every tool). Stages are logically gated so they only run when it makes sense.

| Stage | What it does | Notes |
|-------|--------------|-------|
| **Checkout** | `checkout scm` — pulls the commit that triggered the build | |
| **Install** | `npm ci` for backend **and** frontend, in **parallel** | clean, lockfile-exact installs |
| **Test** | `npm test` for backend (Jest+Supertest) **and** frontend (Vitest), in **parallel** | tests mock Firebase + Neo4j → **no secrets needed** |
| **Build frontend** | `npm run build` (Vite) → archives `frontend/dist/**` | bundle uses dummy `VITE_*` fallbacks in CI |
| **Deploy** | `POST` the Render + Vercel deploy hooks via `curl` | gated by `RUN_DEPLOY`; hooks pulled from credentials |
| **Seed** *(optional)* | `node scripts/seed.js` to rebuild the demo graph | gated by `RUN_SEED`; idempotent (MERGE-based) |
| **Monitor** | polls `/api/health` until `{"ok":true,"db":true}` | gated by `RUN_DEPLOY`; **fails the build** if the backend never goes healthy |

**How the stages connect (criterion 1):** a failing Test stops the pipeline
before anything ships; Build must succeed before Deploy; Deploy triggers the
platform rebuilds; Monitor then *verifies the deploy actually came up healthy*,
turning "deploy" into "deploy **and** prove it works". The health gate is what
makes Deploy → Monitor a real feedback loop rather than fire-and-forget.

**Parameters** (set per build, default to a normal CI+CD run):
- `RUN_DEPLOY` (default `true`) — when off, the pipeline is a pure CI run
  (Checkout → Build) and Deploy/Monitor are skipped. Useful for PR validation.
- `RUN_SEED` (default `false`) — re-seed the demo graph before monitoring.

**Monitor stage detail** — bounded retry loop (≈6 min, 36 × 10 s) because
Render's free tier rebuilds and cold-starts:

```sh
for i in $(seq 1 36); do
  body=$(curl -fsS --max-time 20 "$HEALTH_URL" || echo "")
  if echo "$body" | jq -e '.ok == true and .db == true' >/dev/null 2>&1; then
    exit 0           # healthy → stage (and pipeline) green
  fi
  sleep 10
done
exit 1               # never recovered → build fails
```

---

## 3. Infrastructure as code (criterion 3 — reproducible)

Three artifacts mean the **CI server, the backend infra, and the demo data** can
all be recreated from source:

### a) Jenkins controller — `infra/jenkins/`
- **`Dockerfile`** — `FROM jenkins/jenkins:lts`, adds Node 20 (NodeSource),
  `jq`, `curl`, and pre-installs the required plugins (`workflow-aggregator`,
  `git`, `credentials-binding`, `timestamper`). No manual plugin clicking.
- **`docker-compose.yml`** — one `jenkins` service, ports `8080`/`50000`,
  persistent `jenkins_home` volume. **One command provisions the whole CI server:**
  ```sh
  cd infra/jenkins && docker compose up -d --build
  ```
  `docker compose down -v && docker compose up -d --build` proves a
  from-scratch rebuild.

### b) Backend service — `render.yaml`
Render **Blueprint** at the repo root: declares the `iris-backend` web service
(runtime, build/start commands, health-check path, free plan, region) and the
required env-var **keys** (`sync: false` → values entered once in the dashboard,
never committed). Connecting the repo as a Blueprint recreates the service
declaratively. `autoDeploy: false` because deploys are owned by the Jenkins
Deploy stage.

### c) Demo data — `backend/scripts/seed.js`
Idempotent graph seed (users, follows, posts, likes, interests) wired into the
pipeline as the optional **Seed** stage so the demo graph is reproducible too.
(Neo4j Aura itself is a managed service — not free-tier IaC-able — so the
*data* is the reproducible part.)

---

## 4. One-time setup

> Prereqs: Docker Desktop running; the app already deployed once to Render +
> Vercel + Aura (see deploy targets below); repo pushed to GitHub.

**1. Bring up Jenkins**
```sh
cd infra/jenkins
docker compose up -d --build
docker compose exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword
```
Open <http://localhost:8080>, unlock with that password, create the admin user.
(Required plugins are pre-baked, so you can "Select plugins to install → none".)

**2. Create the Deploy Hooks (you do this in the dashboards)**
- **Render**: service → *Settings → Deploy Hook* → copy the URL.
- **Vercel**: project → *Settings → Git → Deploy Hooks* → create one for `main`,
  copy the URL.

**3. Add Jenkins credentials** — *Manage Jenkins → Credentials → (global) → Add*,
type **Secret text**:

| Credential ID | Value | Used by |
|---|---|---|
| `render-deploy-hook` | Render deploy hook URL | Deploy stage |
| `vercel-deploy-hook` | Vercel deploy hook URL | Deploy stage |
| `neo4j-uri` | `neo4j+s://…` | Seed stage (optional) |
| `neo4j-user` | Aura username (= instance id) | Seed stage (optional) |
| `neo4j-password` | Aura password | Seed stage (optional) |
| `neo4j-database` | Aura database (= instance id) | Seed stage (optional) |

**4. Create the pipeline job**
- *New Item → Pipeline* (e.g. `iris`).
- *Pipeline → Definition*: **Pipeline script from SCM**, SCM **Git**,
  repo URL, branch `main`, **Script Path** `Jenkinsfile`.
- *Build Triggers*: enable **GitHub hook trigger for GITScm polling**
  (or **Poll SCM** `H/5 * * * *` if no public webhook) → CI on every push.

---

## 5. Running it / demonstration walkthrough (criterion 4)

1. **CI-only proof** — *Build with Parameters*, set `RUN_DEPLOY = false`, Build.
   → Checkout, Install, Test, Build all green; Deploy/Monitor skipped. Shows the
   integration pipeline passing with no manual steps.
2. **Full CI/CD** — *Build with Parameters* with defaults (`RUN_DEPLOY = true`).
   → Deploy stage logs `Render deploy queued` / `Vercel deploy queued`; the
   Render and Vercel dashboards show a new deploy starting; Monitor polls
   `/api/health` and goes green on `"db":true`.
3. **Trigger-on-push** — push a commit to `main`; the webhook/poll starts a build
   automatically (minimal manual intervention — criterion 2).
4. **Evidence** — capture **Build → Console Output** and the Stage View, plus the
   Render/Vercel dashboards and the live site, into `docs/devops/`.

**Live targets**
- Backend: <https://iris-social-networking-website.onrender.com> (`/api/health`)
- Frontend: <https://iris-social.vercel.app>

---

## 6. Challenges encountered (real, for the viva)

- **Windows → Linux Jenkins.** The original `Jenkinsfile` used `bat` steps and a
  `NodeJS-20` tool from a Windows agent. Moving Jenkins into a Linux Docker
  container meant rewriting every step to `sh` and baking Node into the image
  instead of relying on a hand-configured tool.
- **Node in Jenkins without Docker-in-Docker.** Chose a custom controller image
  (Jenkins LTS + NodeSource Node 20) over a `docker { image 'node' }` agent to
  avoid mounting the Docker socket — simpler and still fully reproducible.
- **Deploy ≠ healthy.** A deploy hook returns `200` immediately, long before the
  service is actually up. The Monitor stage closes that gap by gating on the
  real `/api/health` DB check, which also absorbs Render free-tier cold starts.
- **Secret hygiene.** Deploy hooks and Aura creds are Jenkins secret-text, and
  `render.yaml` only declares env-var *keys* (`sync: false`) — nothing sensitive
  is committed.
- **Aura naming gotcha.** On Neo4j Aura Free the username **and** database name
  are the instance id (e.g. `fcda65b6`), not `neo4j` — reflected in the seed
  credentials.

---

## 7. Outcomes

- A single Jenkins pipeline covers **Build → Test → Deploy → Monitor**, logically
  gated and integrated, triggered automatically on push.
- Backend infra (`render.yaml`), the CI server (`infra/jenkins/`), and demo data
  (seed stage) are all reproducible from source.
- Deploys are verified live by an automated health gate, not assumed.

## File map

| Path | Purpose |
|---|---|
| `Jenkinsfile` | the 4-stage (+seed) declarative pipeline |
| `infra/jenkins/Dockerfile` | reproducible Jenkins controller (Node 20 + jq + plugins) |
| `infra/jenkins/docker-compose.yml` | one-command Jenkins provisioning |
| `render.yaml` | Render Blueprint for the backend (IaC) |
| `backend/scripts/seed.js` | idempotent demo-graph seed (Seed stage) |
| `docs/devops/` | screenshots + logs (demonstration evidence) |
