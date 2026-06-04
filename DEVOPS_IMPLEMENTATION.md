# Iris — Local Jenkins CI/CD Demo

A fully self-contained **Jenkins** CI/CD pipeline that builds, tests, deploys,
and monitors the Iris app **entirely on your laptop** — no cloud accounts
needed. This is the artifact for the course demonstration / viva.

> **Scope:** this lives on the **`jenkins-demo`** branch only. The `main` branch
> and the live cloud deployment (Render + Vercel) are intentionally **Jenkins-free**
> and unchanged — the production app keeps auto-deploying from `main` as before.

---

## 1. System architecture

```
   git push (jenkins-demo)        ┌────────────────────────────────────┐
  ─────────────────────────────▶  │  Jenkins controller (Docker)        │
   Poll SCM / Build Now            │  infra/jenkins/ — Node 20, npm,     │
                                   │  curl, jq, Docker CLI baked in      │
                                   │  mounts /var/run/docker.sock        │
                                   └──────────────────┬──────────────────┘
                                                      │ Jenkinsfile pipeline
        ┌──────────────┬──────────────┬───────────────┼───────────────┬───────────────┐
        ▼              ▼              ▼                ▼               ▼               ▼
    Checkout    Install (∥)     Test (∥)      Build frontend      Deploy          Monitor
                                                                     │               │
                                            docker compose up -d --build             │ poll
                                                                     ▼               │ host.docker.internal
                                            ┌──────── infra/app/docker-compose.yml ──┐│ :5001/api/health
                                            │  Neo4j  ◀──  backend(:5001) ◀── frontend││ until "db":true
                                            │  :7687       node/express      nginx :8081
                                            └─────────────────────────────────────────┘
                                                            │
                                                  app live at http://localhost:8081
```

Everything runs as Docker containers on one machine:
- **Jenkins** orchestrates the pipeline and, via the **mounted host Docker
  socket** ("Docker-outside-of-Docker"), brings the app stack up as sibling
  containers on the host.
- The **app stack** (`infra/app/`) is Neo4j + the Express backend + an
  nginx-served React build — the same code that runs in production.
- A standalone **evidence dashboard** (`infra/dashboard/`, on port 4000) reads a
  shared `evidence` volume that each pipeline run writes to, giving a polished
  build-history view of every stage's status + logs (criterion 4 evidence).

---

## 2. The pipeline (`Jenkinsfile`)

| Stage | What it does | How it connects |
|-------|--------------|-----------------|
| **Checkout** | `checkout scm` | pulls the triggering commit |
| **Install** | `npm ci` for backend + frontend, **parallel** | clean installs |
| **Test** | `npm test` backend (Jest+Supertest) + frontend (Vitest), **parallel** | a failure stops the pipeline before deploy |
| **Build frontend** | `npm run build` (Vite); archives `dist` | proves the bundle builds |
| **Deploy** | `docker compose -f infra/app/docker-compose.yml up -d --build` | rebuilds images from the checkout and starts the stack |
| **Seed** *(optional)* | `docker compose exec -T backend node scripts/seed.js` | idempotent demo graph in the stack's Neo4j |
| **Monitor** | polls `host.docker.internal:5001/api/health` until `{"ok":true,"db":true}` | **verifies the deploy actually came up healthy**; fails the build otherwise |

**Parameters:** `RUN_DEPLOY` (default `true`) and `RUN_SEED` (default `false`).
Setting `RUN_DEPLOY=false` makes it a pure CI run (Checkout → Build) with
Deploy/Monitor skipped.

The Deploy → Monitor pair is the heart of the CD story: deploying isn't
"done" until the live `/api/health` check passes.

**Evidence capture (built into every stage):** each stage tees its output to
`/evidence/build-<N>/<stage>.log` and writes a `PASS` marker on success; the
Monitor stage saves the final health JSON. In `post { always }` the pipeline
runs `infra/evidence/manifest.js` to write a `manifest.json` summarising the run
(per-stage status, result, commit, health) and also archives the raw evidence as
downloadable Jenkins artifacts. See §3a for how it's displayed.

---

## 3. Infrastructure as code (reproducible)

| Artifact | Purpose |
|----------|---------|
| `infra/jenkins/Dockerfile` + `docker-compose.yml` | the **CI server** — Jenkins LTS + Node 20 + jq + Docker CLI; `docker compose up -d --build` provisions it in one command |
| `infra/app/docker-compose.yml` | the **app stack** — Neo4j + backend + frontend, deployed by the pipeline |
| `backend/Dockerfile`, `frontend/Dockerfile` + `nginx.conf` | reproducible images for the two app services |
| `backend/scripts/seed.js` | idempotent demo-graph seed (wired as the optional Seed stage) |

`docker compose down -v && docker compose up -d --build` rebuilds either stack
from scratch — nothing is configured by hand.

### 3a. Evidence dashboard (standalone)

`infra/dashboard/` is a zero-dependency Node server that runs **alongside
Jenkins** (same compose, port **4000**) and mounts the shared `evidence` volume
**read-only**. It renders:
- **`/`** — a build-history table: build #, result, a row of per-stage status
  squares (green=passed, red=failed, grey=skipped), commit, start time
  (auto-refreshes every 8s so new builds appear during the demo).
- **`/build/<N>`** — per-build detail: each stage with its status and a
  collapsible log, plus the health-gate result.

Data flow: the pipeline writes `/evidence/build-<N>/` → the dashboard reads the
same volume → no coupling to Jenkins internals, no app involvement. It's the
single screen to show an examiner that every stage ran and passed.

---

## 4. One-time setup

> Prereq: Docker Desktop running. Everything else is in this repo.
>
> **Cross-platform (macOS / Windows / Linux):** all build/test/deploy steps run
> *inside Linux containers*, so the host OS doesn't matter. On **Windows**, use
> Docker Desktop with the **WSL2 backend in Linux-container mode** (the default);
> `host.docker.internal` and the `/var/run/docker.sock` mount both work there.
> A `.gitattributes` forces LF line endings so the pipeline's shell scripts work
> regardless of where the repo was cloned. Run host commands in **PowerShell**
> (replace `&&` with `;` if you're on the older Windows PowerShell 5).

**1. Provision Jenkins + the evidence dashboard**
```sh
cd infra/jenkins
docker compose up -d --build
docker compose exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword
```
This starts **two** containers: Jenkins (<http://localhost:8080>) and the
evidence dashboard (<http://localhost:4000>). Unlock Jenkins with that password,
create the admin user. On the plugins screen choose **Select plugins to install
→ None** (required plugins are pre-baked).

**2. (Optional) Firebase for working login** — copy `infra/app/.env.example` to
`infra/app/.env` and fill in the public Firebase web values. The pipeline and
the health gate work **without** this; only login needs it.

**3. Create the pipeline job**
- *New Item → Pipeline* (e.g. `iris-local`).
- *Pipeline → Definition*: **Pipeline script from SCM**, SCM **Git**,
  Repo URL `https://github.com/Prajwalkiran1/Iris-Social-Networking-Website.git`,
  **Branch** `*/jenkins-demo`, **Script Path** `Jenkinsfile`.
- *Build Triggers*: **Poll SCM** `H/5 * * * *` (or just use **Build Now**).

---

## 5. Running it / demonstration walkthrough

1. **CI-only proof** — *Build with Parameters*, `RUN_DEPLOY = false` → Checkout,
   Install, Test, Build green; Deploy/Monitor skipped.
2. **Full CI/CD** — *Build with Parameters* with defaults → Deploy logs the
   stack coming up; Monitor polls `/api/health` and goes green on `"db":true`.
   Open <http://localhost:8081> — the app is live.
3. *(Optional)* re-run with `RUN_SEED = true` to populate the demo graph, then
   show the feed / recommendations.
4. **Trigger-on-push** — push to `jenkins-demo`; the poll starts a build
   automatically (minimal manual intervention).
5. **Evidence** — open the **dashboard at <http://localhost:4000>** to show the
   build history and per-stage logs; also save screenshots/console output into
   `docs/devops/`.

**Local URLs:** app <http://localhost:8081> · **evidence dashboard
<http://localhost:4000>** · backend health <http://localhost:5001/api/health> ·
Neo4j browser <http://localhost:7474> (`neo4j` / `password123`).

---

## 6. Challenges encountered (for the viva)

- **Windows → Linux Jenkins.** The original pipeline used `bat` steps + a Windows
  `NodeJS` tool. Moving Jenkins into a Linux container meant rewriting to `sh`
  and baking Node into the controller image.
- **Persistent local deploy.** Processes started inside a Jenkins stage are
  reaped when the stage ends, so "deploy" had to mean **containers** (which
  outlive the build), not background `npm start`. Hence the Docker app stack.
- **Jenkins driving Docker.** Solved with Docker-outside-of-Docker: the Docker
  CLI in the controller image talks to the host daemon via the mounted socket,
  so app containers run as host siblings with published ports.
- **Container-to-host networking.** The Monitor stage (inside Jenkins) reaches
  the app's published port via `host.docker.internal`, not `localhost`.
- **Deploy ≠ healthy.** `compose up` returns before Neo4j accepts connections,
  so the Monitor stage gates on the real `/api/health` DB check with retries.
- **Same-origin API.** nginx serves the SPA and proxies `/api` to the backend,
  so the bundle needs no `VITE_API_BASE_URL` and there's no CORS to manage.

---

## 7. Outcomes

- One Jenkins pipeline runs **Build → Test → Deploy → Monitor**, logically gated
  and verified by a live health check, triggered automatically on push.
- The CI server, the app stack, and the demo data are all reproducible from code.
- The whole thing runs offline on one laptop — ideal for a controlled demo.

## File map (jenkins-demo branch)

| Path | Purpose |
|------|---------|
| `Jenkinsfile` | 4-stage (+seed) local pipeline, with per-stage evidence capture |
| `infra/jenkins/` | reproducible Jenkins controller (Node + Docker CLI) + dashboard service |
| `infra/app/docker-compose.yml` | the deployed app stack |
| `infra/dashboard/` | standalone evidence dashboard (zero-dep Node server, port 4000) |
| `infra/evidence/manifest.js` | builds each run's `manifest.json` from stage logs/statuses |
| `backend/Dockerfile`, `frontend/Dockerfile`, `frontend/nginx.conf` | app images |
| `backend/scripts/seed.js` | demo-graph seed (Seed stage) |
| `docs/devops/` | screenshots + logs (evidence) |
