// Iris CI/CD Evidence Dashboard — a standalone, zero-dependency Node server.
// Reads the shared evidence volume (one folder per build, written by the
// Jenkins pipeline) and renders a build-history page + per-build detail with
// stage statuses and logs. No framework, no npm install.
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 4000;
const EVIDENCE_DIR = process.env.EVIDENCE_DIR || "/evidence";

const STATUS_COLORS = {
  PASSED: "#2ea043",
  FAILED: "#f85149",
  SKIPPED: "#6e7681",
  UNKNOWN: "#9e6a03",
};
const RESULT_COLORS = {
  SUCCESS: "#2ea043",
  FAILURE: "#f85149",
  ABORTED: "#6e7681",
  UNSTABLE: "#9e6a03",
};

const esc = (s) =>
  String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

function listBuilds() {
  let entries = [];
  try {
    entries = fs.readdirSync(EVIDENCE_DIR);
  } catch {
    return [];
  }
  const builds = [];
  for (const name of entries) {
    const m = /^build-(\d+)$/.exec(name);
    if (!m) continue;
    const dir = path.join(EVIDENCE_DIR, name);
    let manifest = null;
    try {
      manifest = JSON.parse(fs.readFileSync(path.join(dir, "manifest.json"), "utf8"));
    } catch {
      manifest = { build: Number(m[1]), result: "RUNNING", stages: [], inProgress: true };
    }
    builds.push(manifest);
  }
  builds.sort((a, b) => (b.build || 0) - (a.build || 0));
  return builds;
}

function badge(text, color) {
  return `<span class="badge" style="background:${color}">${esc(text)}</span>`;
}

const PAGE = (title, body) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body { margin:0; font:14px/1.5 ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,sans-serif;
         background:#0d1117; color:#e6edf3; }
  header { padding:20px 28px; border-bottom:1px solid #21262d; display:flex; align-items:center; gap:12px; }
  header h1 { font-size:18px; margin:0; font-weight:650; }
  header .sub { color:#8b949e; font-size:13px; }
  main { padding:24px 28px; max-width:1100px; margin:0 auto; }
  a { color:#58a6ff; text-decoration:none; } a:hover { text-decoration:underline; }
  .badge { display:inline-block; padding:2px 9px; border-radius:999px; color:#fff;
           font-size:12px; font-weight:600; letter-spacing:.2px; }
  table { width:100%; border-collapse:collapse; }
  th,td { text-align:left; padding:11px 12px; border-bottom:1px solid #21262d; vertical-align:middle; }
  th { color:#8b949e; font-weight:600; font-size:12px; text-transform:uppercase; letter-spacing:.4px; }
  tr:hover td { background:#161b22; }
  .stages { display:flex; flex-wrap:wrap; gap:5px; }
  .dot { width:11px; height:11px; border-radius:3px; display:inline-block; }
  .meta { color:#8b949e; font-size:13px; }
  .card { border:1px solid #21262d; border-radius:10px; padding:16px 18px; margin-bottom:14px; background:#0f141b; }
  .card h3 { margin:0 0 4px; font-size:15px; }
  details { margin-top:8px; }
  summary { cursor:pointer; color:#8b949e; }
  pre { background:#010409; border:1px solid #21262d; border-radius:8px; padding:14px;
        overflow:auto; max-height:460px; font:12px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace; }
  .empty { color:#8b949e; padding:40px 0; text-align:center; }
  .back { display:inline-block; margin-bottom:16px; }
  .health { font:12px ui-monospace,monospace; color:#7ee787; }
</style></head><body>
<header><h1>🔬 Iris CI/CD Evidence</h1><span class="sub">Jenkins pipeline · live build history</span></header>
<main>${body}</main></body></html>`;

function renderIndex() {
  const builds = listBuilds();
  if (!builds.length) {
    return PAGE(
      "Iris CI/CD Evidence",
      `<div class="empty">No builds recorded yet.<br>Run the Jenkins pipeline, then refresh.</div>`
    );
  }
  const rows = builds
    .map((b) => {
      const dots = (b.stages || [])
        .map(
          (s) =>
            `<span class="dot" title="${esc(s.label)}: ${esc(s.status)}" style="background:${
              STATUS_COLORS[s.status] || STATUS_COLORS.UNKNOWN
            }"></span>`
        )
        .join("");
      const result = b.inProgress ? "RUNNING" : b.result;
      const color = b.inProgress ? "#388bfd" : RESULT_COLORS[result] || RESULT_COLORS.ABORTED;
      const when = b.startedAt ? new Date(b.startedAt).toLocaleString() : "—";
      return `<tr>
        <td><a href="/build/${esc(b.build)}"><b>#${esc(b.build)}</b></a></td>
        <td>${badge(result, color)}</td>
        <td><div class="stages">${dots || '<span class="meta">—</span>'}</div></td>
        <td class="meta">${esc(b.commit || "—")}${b.branch ? " · " + esc(b.branch) : ""}</td>
        <td class="meta">${esc(when)}</td>
      </tr>`;
    })
    .join("");
  const body = `
    <table>
      <thead><tr><th>Build</th><th>Result</th><th>Stages</th><th>Commit</th><th>Started</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <p class="meta" style="margin-top:18px">Auto-refreshes every 8s. Each square is a stage (green=passed, red=failed, grey=skipped).</p>
    <meta http-equiv="refresh" content="8">`;
  return PAGE("Iris CI/CD Evidence", body);
}

function renderBuild(num) {
  const dir = path.join(EVIDENCE_DIR, `build-${num}`);
  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(path.join(dir, "manifest.json"), "utf8"));
  } catch {
    return null;
  }
  const result = manifest.result;
  const color = RESULT_COLORS[result] || RESULT_COLORS.ABORTED;
  const stageCards = (manifest.stages || [])
    .map((s) => {
      let log = "";
      if (s.log) {
        try {
          log = fs.readFileSync(path.join(dir, s.log), "utf8");
        } catch {
          log = "(log unavailable)";
        }
      }
      const logBlock = s.log
        ? `<details><summary>show log (${esc(s.log)})</summary><pre>${esc(log)}</pre></details>`
        : `<div class="meta">no log — stage not run</div>`;
      return `<div class="card">
        <h3>${esc(s.label)} &nbsp; ${badge(s.status, STATUS_COLORS[s.status] || STATUS_COLORS.UNKNOWN)}</h3>
        ${logBlock}
      </div>`;
    })
    .join("");
  const health = manifest.health
    ? `<div class="card"><h3>Health gate result</h3><div class="health">${esc(manifest.health)}</div></div>`
    : "";
  const when = manifest.startedAt ? new Date(manifest.startedAt).toLocaleString() : "—";
  const body = `
    <a class="back" href="/">← all builds</a>
    <h2 style="margin:0 0 6px">Build #${esc(manifest.build)} &nbsp; ${badge(result, color)}</h2>
    <p class="meta">${esc(manifest.commit || "")} ${manifest.branch ? "· " + esc(manifest.branch) : ""} · started ${esc(when)}</p>
    ${health}
    ${stageCards}`;
  return PAGE(`Build #${num} — Iris CI/CD`, body);
}

http
  .createServer((req, res) => {
    const url = (req.url || "/").split("?")[0];
    if (url === "/" || url === "") {
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      return res.end(renderIndex());
    }
    const m = /^\/build\/(\d+)$/.exec(url);
    if (m) {
      const html = renderBuild(m[1]);
      if (!html) {
        res.writeHead(404, { "content-type": "text/html; charset=utf-8" });
        return res.end(PAGE("Not found", `<a class="back" href="/">← all builds</a><div class="empty">Build #${esc(m[1])} not found.</div>`));
      }
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      return res.end(html);
    }
    res.writeHead(404, { "content-type": "text/plain" });
    res.end("Not found");
  })
  .listen(PORT, () => console.log(`Evidence dashboard on http://localhost:${PORT} (reading ${EVIDENCE_DIR})`));
