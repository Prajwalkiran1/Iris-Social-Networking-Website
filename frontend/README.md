# Iris — frontend

React 19 + Vite single-page app for the Iris social network.

```bash
npm install
cp .env.example .env.local   # fill VITE_FIREBASE_* + (prod) VITE_API_BASE_URL
npm run dev                  # http://localhost:3000  (proxies /api → :5001)
npm test                     # Vitest + React Testing Library
npm run build                # production bundle → dist/
```

See the [root README](../README.md) for architecture, the graph model, and
full setup/deploy instructions.
