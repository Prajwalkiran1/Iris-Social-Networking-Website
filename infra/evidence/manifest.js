// Builds a manifest.json summarising one pipeline run, from the per-stage
// log/status files the Jenkinsfile drops into the evidence directory.
//
// Usage:
//   node infra/evidence/manifest.js <evidenceDir> <build> <result> <branch> <commit> <startMillis>
//
// Status of each stage is inferred from the files the pipeline wrote:
//   <key>.status containing "PASS"  -> PASSED
//   <key>.log present, no PASS      -> FAILED
//   neither file present            -> SKIPPED  (e.g. Deploy when RUN_DEPLOY=false)
const fs = require("fs");
const path = require("path");

const [, , evidenceDir, build, result, branch, commit, startMillis] = process.argv;

const STAGES = [
  { key: "install-backend", label: "Install · Backend deps" },
  { key: "install-frontend", label: "Install · Frontend deps" },
  { key: "test-backend", label: "Test · Backend" },
  { key: "test-frontend", label: "Test · Frontend" },
  { key: "build", label: "Build frontend" },
  { key: "deploy", label: "Deploy · app stack" },
  { key: "seed", label: "Seed · demo graph" },
  { key: "monitor", label: "Monitor · health gate" },
];

const exists = (f) => {
  try {
    return fs.existsSync(path.join(evidenceDir, f));
  } catch {
    return false;
  }
};
const read = (f) => {
  try {
    return fs.readFileSync(path.join(evidenceDir, f), "utf8");
  } catch {
    return "";
  }
};

const stages = STAGES.map(({ key, label }) => {
  const hasLog = exists(`${key}.log`);
  const statusRaw = read(`${key}.status`).trim();
  let status = "SKIPPED";
  if (statusRaw === "PASS") status = "PASSED";
  else if (hasLog) status = "FAILED";
  return { key, label, status, log: hasLog ? `${key}.log` : null };
});

const toIso = (ms) => {
  const n = Number(ms);
  return Number.isFinite(n) && n > 0 ? new Date(n).toISOString() : null;
};

const manifest = {
  build: Number(build) || build || null,
  result: result || "UNKNOWN",
  branch: branch || null,
  commit: commit ? String(commit).slice(0, 10) : null,
  startedAt: toIso(startMillis),
  generatedAt: new Date().toISOString(),
  health: read("health.txt").trim() || null,
  stages,
};

fs.writeFileSync(
  path.join(evidenceDir, "manifest.json"),
  JSON.stringify(manifest, null, 2)
);
console.log(`Wrote manifest for build ${manifest.build} (${manifest.result}).`);
