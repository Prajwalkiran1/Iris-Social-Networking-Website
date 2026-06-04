# How the Iris DevOps Setup Works — Explained Simply

This is the plain-English companion to `DEVOPS_IMPLEMENTATION.md`. No prior
DevOps knowledge needed. By the end you'll understand what every piece does,
how a code change travels all the way to the running app, how the database
works, and how to peek inside it.

> Everything here runs **on your own laptop**, inside Docker. Nothing is in the
> cloud. (The separate live website on Render/Vercel is a different thing and is
> untouched by any of this.)

---

## 1. The 30-second picture (an analogy)

Think of a **restaurant**:

- You write a new recipe (you change some code).
- A **head chef** (Jenkins) notices the new recipe, and runs it through a strict
  routine: gather ingredients, taste-test, plate it, and *then* serve it — but
  only if every check passed.
- The **kitchen** where the food is actually served (your app) is a set of
  stations: a pantry (database), a cook (backend), and a waiter (frontend).
- A **clipboard on the wall** (the evidence dashboard) records exactly what
  happened on every run, so anyone can see it went well.

The whole point of this routine is: **a change only goes live if it passes every
check, and we automatically prove it's healthy afterwards.** That's "CI/CD."

- **CI = Continuous Integration**: every change is automatically built and tested.
- **CD = Continuous Deployment**: if tests pass, it's automatically deployed.

---

## 2. Meet the "containers" (the cast)

Everything runs as a **container** — a lightweight, isolated mini-computer. We
have five of them, in two groups:

**The CI side (the kitchen manager + clipboard):**
| Container | Nickname | What it does | Where you see it |
|-----------|----------|--------------|------------------|
| `iris-jenkins` | The head chef | Runs the pipeline (build → test → deploy → monitor) | http://localhost:8080 |
| `iris-evidence-dashboard` | The clipboard | Shows a history of every pipeline run + its logs | http://localhost:4000 |

**The app side (the actual restaurant):**
| Container | Nickname | What it does | Where you see it |
|-----------|----------|--------------|------------------|
| `iris-app-frontend` | The waiter | Serves the website (and forwards data requests to the cook) | http://localhost:8081 |
| `iris-app-backend` | The cook | The API — handles logic, talks to the database | http://localhost:5001 |
| `iris-app-neo4j` | The pantry | The database — stores all users, posts, follows, etc. | http://localhost:7474 |

---

## 3. Docker in plain terms (3 words you'll hear)

- **Image** = a *recipe / blueprint* for a container. Frozen, doesn't run.
  (e.g. "a Linux box with Node 20 and our backend code inside.")
- **Container** = a *running instance* of an image — the actual live mini-computer.
  You can throw it away and start a fresh one from the same image any time.
- **Volume** = a *storage box* that survives even when a container is destroyed.
  This is how the database keeps your data, and how Jenkins keeps its settings,
  across restarts.

Why this matters: because everything is built from blueprints (images) defined in
text files, **anyone can recreate the entire setup from scratch with one command**.
That's the "reproducible" requirement.

A special trick we use: Jenkins (a container) is allowed to *command Docker on
your laptop* to start the app containers. It's like the head chef being given keys
to the kitchen next door. (Technically: we mount the "Docker socket" into the
Jenkins container. You don't need to understand the plumbing — just that it lets
Jenkins deploy the app.)

---

## 4. The pipeline, stage by stage

The recipe the head chef follows lives in one file: **`Jenkinsfile`**. It has
these stages, and they run **in order** — if any one fails, the rest are skipped
(so broken code never gets served):

1. **Checkout** — Download the latest code from GitHub (the `jenkins-demo` branch).
   *Like fetching the new recipe card.*
2. **Install** — Download the code's dependencies (`npm ci`) for the backend and
   frontend, at the same time (in parallel, to be fast). *Gathering ingredients.*
3. **Test** — Run the automated tests (backend + frontend). If a test fails, stop
   everything. *Taste-testing before serving.*
4. **Build** — Compile the frontend website into optimized files. *Plating the dish.*
5. **Deploy** — Start/replace the app containers with `docker compose up --build`,
   so the latest code is now running. *Serving the food.*
6. **Monitor** — Repeatedly ask the backend "are you healthy?" (checks
   `/api/health`) until it says yes (database connected). If it never does, the
   build fails. *Making sure the customer actually got a good meal.*

(There's also an optional **Seed** stage that fills the database with demo data —
off by default.)

**Why "logically connected" matters:** Test gates Deploy, and Deploy is proven by
Monitor. It's a chain, not 6 unrelated steps.

---

## 5. The journey of one code change (what you just did)

This is the exact thing you demonstrated. Follow the arrows:

```
1. You edit code on your laptop         (e.g. change the Login title)
              │  git add + git commit + git push
              ▼
2. The change lands on GitHub           (branch: jenkins-demo)
              │  Jenkins "polls" GitHub every minute and notices a new commit
              ▼
3. Jenkins starts a pipeline run automatically
              │  Checkout → Install → Test → Build  (all must pass)
              ▼
4. Deploy stage rebuilds the app         (docker compose up --build)
              │  the frontend image is rebuilt WITH your new code
              ▼
5. Monitor stage confirms it's healthy   (polls /api/health until db:true)
              ▼
6. You hard-refresh http://localhost:8081 and see your change live
              │  (in parallel) the evidence dashboard logs the whole run
              ▼
   http://localhost:4000 shows the run, green, with per-stage logs
```

**Key insight you discovered:** Jenkins only reacts to changes that are
**committed AND pushed** to GitHub. A change sitting unsaved/uncommitted on your
laptop is invisible to it. (That's why your first attempt didn't trigger a build —
the commit hadn't actually happened.)

---

## 6. How the database works

### What kind of database is it?
Neo4j is a **graph database**. Instead of tables and rows (like Excel or MySQL),
it stores **nodes** (things) connected by **relationships** (lines between things).
This is perfect for a social network, where everything *is* a web of connections.

### The Iris data model
**Nodes (the "things"):**
- **`User`** — a person. Properties: `uid`, `name`, `email`, `bio`, `interests`, `createdAt`.
- **`Post`** — something someone posted. Properties: `id`, `content`, `imageUrl`, `likeCount`, `timestamp`.
- **`Message`** — a chat message.

**Relationships (the "lines"):**
- `(User)-[:FOLLOWS]->(User)` — who follows whom.
- `(User)-[:POSTED]->(Post)` — who wrote a post.
- `(User)-[:LIKED]->(Post)` — who liked a post.
- `(User)-[:SENT]->(Message)-[:TO]->(User)` — chat messages.

Picture it:

```
   (Ava:User) ──FOLLOWS──▶ (Ben:User) ──POSTED──▶ (Post "Just shipped…")
       │                                                ▲
       └────────────────────LIKED──────────────────────┘
```

So "show me posts from people Ava follows" is just *follow the FOLLOWS lines, then
the POSTED lines* — which is why a graph DB makes social features easy.

### Where does the data physically live?
Inside a Docker **volume** named `app_neo4j_data` (storage box). Even if you stop
or rebuild the database container, your nodes survive. Only `docker compose down
-v` (the `-v`) would erase it.

### How the app talks to it (the full request path)
When you click something in the website, the request travels like this:

```
Your browser
   │  http://localhost:8081  (asks the waiter)
   ▼
iris-app-frontend (nginx)   — serves the page; for data, forwards "/api/..." on to:
   │  http://backend:5001
   ▼
iris-app-backend (Express)  — the cook; runs the logic, then queries:
   │  bolt://neo4j:7687      (a database connection)
   ▼
iris-app-neo4j              — the pantry; returns the matching nodes/relationships
```

The `/api/health` check you keep seeing is the backend reporting "I'm up, and I
can reach the pantry" → `{"ok":true,"db":true}`.

---

## 7. How to open the database and see the nodes

### Option A — Neo4j Browser (visual, recommended)
1. Open **http://localhost:7474** in your browser.
2. It asks how to connect. Use:
   - **Connect URL**: `bolt://localhost:7687` (the default it offers is fine)
   - **Username**: `neo4j`
   - **Password**: `password123`
3. Click **Connect**. You now have a query box at the top.

Type these **Cypher** queries (Cypher = the database's query language) and press
the ▶ button:

```cypher
// See everything (capped at 100 items) — great visual graph
MATCH (n) RETURN n LIMIT 100;
```
```cypher
// How many of each node type exist?
MATCH (n) RETURN labels(n) AS type, count(*) AS count;
```
```cypher
// List all users
MATCH (u:User) RETURN u.uid, u.name, u.interests;
```
```cypher
// All posts and who wrote them
MATCH (u:User)-[:POSTED]->(p:Post) RETURN u.name, p.content, p.likeCount;
```
```cypher
// Who follows whom
MATCH (a:User)-[:FOLLOWS]->(b:User) RETURN a.name AS follower, b.name AS following;
```

The first query draws an actual picture of the graph — drag the circles around.

### Option B — command line (no browser)
```bash
docker exec -it iris-app-neo4j cypher-shell -u neo4j -p password123 \
  "MATCH (n) RETURN labels(n) AS type, count(*) AS count;"
```

### "I see no data / empty graph" — that's normal at first
A fresh database is empty. You get data two ways:
1. **Use the app**: sign up at http://localhost:8081, create posts, follow people —
   each action writes nodes/relationships you can then see.
2. **Load demo data**: run the pipeline with the **`RUN_SEED`** checkbox ticked
   (*Build with Parameters → check `RUN_SEED` → Build*). This inserts 8 demo users
   (Ava, Ben, …), their posts, follows, and likes. Or do it manually:
   ```bash
   docker exec iris-app-backend node scripts/seed.js
   ```
   Then re-run the queries above and you'll see the demo graph.

---

## 8. The evidence dashboard (your "proof it works")

http://localhost:4000 is a simple website that reads what each pipeline run
recorded and shows:
- **Home page**: a list of every build — number, pass/fail, a row of colored
  squares (one per stage: green = passed, red = failed, grey = skipped), and when
  it ran. It refreshes itself every few seconds.
- **Click a build**: see each stage with its full log, plus the final health
  result. This is the single screen to show an examiner that every stage ran.

How it gets the data: the pipeline writes each stage's log into a shared storage
box (the `evidence` volume); the dashboard reads from that same box. They share
data without being tangled together.

---

## 9. Cheat sheets

### Ports (what lives where)
| URL | What |
|-----|------|
| http://localhost:8080 | Jenkins (the pipeline runner) |
| http://localhost:4000 | Evidence dashboard (run history) |
| http://localhost:8081 | The Iris app (the website) |
| http://localhost:5001/api/health | Backend health check |
| http://localhost:7474 | Neo4j Browser (database UI) |
| `bolt://localhost:7687` | Database connection (used by the Browser/app) |

### Database login
`neo4j` / `password123`

### Handy commands
```bash
# See what's running
docker ps

# Logs of a specific container (e.g. the backend)
docker logs iris-app-backend
docker logs -f iris-app-backend          # live-follow

# Restart the whole app stack manually (without Jenkins)
cd infra/app && docker compose up -d --build

# Start the CI side (Jenkins + dashboard)
cd infra/jenkins && docker compose up -d --build

# Stop everything but KEEP data
cd infra/app && docker compose stop
cd infra/jenkins && docker compose stop

# Wipe an app's containers AND its data (fresh start)
cd infra/app && docker compose down -v
```

---

## 10. Mini-glossary

- **Pipeline** — the automated sequence of steps (build/test/deploy/monitor).
- **Jenkins** — the tool that runs the pipeline.
- **Stage** — one step in the pipeline.
- **Commit / push** — saving a change to git / uploading it to GitHub.
- **Poll** — Jenkins periodically checking GitHub for new pushed commits.
- **Container / Image / Volume** — running box / its blueprint / its persistent storage.
- **Docker Compose** — a tool that starts several containers together from one file.
- **Neo4j / Cypher** — the graph database / its query language.
- **Node / Relationship** — a thing in the graph / a connection between two things.
- **`/api/health`** — a URL the backend exposes to say "I'm alive and connected".
- **CI/CD** — Continuous Integration / Continuous Deployment.
