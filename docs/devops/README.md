# DevOps Evidence

Drop pipeline evidence here for the demonstration / viva:

- `01-jenkins-build.png` — Stage View showing all stages green
- `02-deploy-stage-log.txt` — console log of the Deploy stage firing both hooks
- `03-monitor-stage-log.txt` — Monitor stage polling `/api/health` to `db:true`
- `04-render-dashboard.png` — Render deploy triggered by the hook
- `05-vercel-dashboard.png` — Vercel deploy triggered by the hook
- `06-live-site.png` — the running app

Capture console output from a build via **Build > Console Output** in Jenkins,
or copy the Blue Ocean / Stage View per-stage logs.
