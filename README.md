# Iris — a graph-native social network

![CI](https://github.com/Prajwalkiran1/Iris-Social-Networking-Website/actions/workflows/ci.yml/badge.svg)

Iris is a full-stack social platform built on a **graph database** so that the
features people actually care about — *who to follow*, *who shares your
interests*, *what's trending in your network* — are first-class graph queries,
not bolted-on afterthoughts.

> **Live demo:** _add your Vercel URL here_ • first request may take ~50s while
> the free backend wakes up.

<!-- Add a screenshot or GIF here: docs/demo.gif -->

## Why it's interesting

Most CRUD social apps store relationships in join tables and fake
recommendations. Iris models `User`, `Post`, `FOLLOWS`, `LIKED`, `POSTED`,
and messages as a real graph in **Neo4j**, which makes the differentiating
features short, fast Cypher traversals:

**People you may know** — friends-of-people-you-follow, ranked by mutual count:
```cypher
MATCH (me:User {uid:$uid})-[:FOLLOWS]->(mutual:User)-[:FOLLOWS]->(cand:User)
WHERE cand <> me AND NOT (me)-[:FOLLOWS]->(cand)
RETURN cand, count(DISTINCT mutual) AS mutuals
ORDER BY mutuals DESC LIMIT 10
```

**Interest overlap** — discover like-minded people by array intersection:
```cypher
MATCH (me:User {uid:$uid}), (cand:User)
WHERE cand <> me AND NOT (me)-[:FOLLOWS]->(cand)
WITH cand, [i IN me.interests WHERE i IN cand.interests] AS common
WHERE size(common) > 0
RETURN cand, common ORDER BY size(common) DESC LIMIT 10
```

**Trending** — most-liked posts in the last 24h (`LIKED` edges + time window).

## Architecture

```
React 19 + Vite           Express 5 API            Neo4j (graph)
  (Vercel)                  (Render)                 (Aura Free)
  Firebase Auth  ──ID token──►  verifyToken  ──Cypher──►  Users / Posts
  apiClient (Bearer)            req.user.uid              FOLLOWS / LIKED
                                                          Messages
        Firebase Storage  ◄── image uploads (URL only)
```

- **Auth**: Firebase email/password on the client; the backend verifies the
  Firebase **ID token** on every data route and derives the actor's identity
  from the token — never from the request body. Cross-user actions are
  impossible to forge.
- **Resilience**: every controller degrades to a clean `503` envelope instead
  of leaking errors; the server never crashes on a missing/unreachable DB.
- **Security**: `helmet`, per-route rate limiting, input validation, no
  secrets in the repo (env-driven, `.env.example` templates).

## Tech stack

| Layer    | Tech |
|----------|------|
| Frontend | React 19, Vite 6, React Router 7, Firebase Web SDK |
| Backend  | Node, Express 5, neo4j-driver, firebase-admin |
| Database | Neo4j (Docker locally / Aura in prod) |
| Auth     | Firebase Authentication (email/password) |
| Storage  | Firebase Storage (post images) |
| Tests    | Jest + Supertest (API), Vitest + RTL (UI) |
| CI/CD    | GitHub Actions; Jenkins pipeline included |

## Run it locally

Prerequisites: Node 20+, Docker.

```bash
# 1. Neo4j
docker run -d --name iris-neo4j -p 7474:7474 -p 7687:7687 \
  -e NEO4J_AUTH=neo4j/password123 neo4j:5

# 2. Backend
cd backend
cp .env.example .env          # fill FIREBASE_SERVICE_ACCOUNT (see below)
npm install
node scripts/seed.js          # optional: demo users/posts/follows
npm start                     # http://localhost:5001

# 3. Frontend
cd ../frontend
cp .env.example .env.local    # fill VITE_FIREBASE_* from your Firebase project
npm install
npm run dev                   # http://localhost:3000
```

**Firebase setup:** create a Firebase project, enable Email/Password auth and
Storage. Put the web config in `frontend/.env.local` and the project id in
`backend/.env` as `FIREBASE_PROJECT_ID`. The backend only *verifies* ID
tokens, so it needs **no private key / no secret** — without a configured
project the API correctly rejects every request with `401`.

## Environment

| File | Key | Purpose |
|------|-----|---------|
| `backend/.env` | `NEO4J_URI/USER/PASSWORD` | DB connection (`bolt://` local, `neo4j+s://` Aura) |
| | `FIREBASE_PROJECT_ID` | Firebase project id for token verification (no secret) |
| | `FRONTEND_ORIGIN` | Allowed CORS origin in prod |
| `frontend/.env.local` | `VITE_FIREBASE_*` | Firebase web config |
| | `VITE_API_BASE_URL` | Backend URL in prod (dev uses the Vite proxy) |

## Tests & CI

```bash
cd backend && npm test     # Jest + Supertest
cd frontend && npm test    # Vitest + RTL
```

GitHub Actions runs both suites plus the frontend build on every push/PR.
A Jenkins pipeline (`Jenkinsfile`) is also included.

## Deployment

Neo4j Aura (free) + backend on Render + frontend on Vercel. See the env table
above; set the deployed frontend origin as `FRONTEND_ORIGIN` on the backend
and the backend URL as `VITE_API_BASE_URL` on the frontend, and add the Vercel
domain to Firebase Authorized Domains.
