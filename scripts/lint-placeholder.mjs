import { existsSync } from "node:fs";

const requiredFiles = [
  "src/app/client/README.md",
  "src/app/admin/README.md",
  "src/app/internal/dev-monitor/README.md",
  "src/config/env.mjs",
  "public/admin-portal.html",
  "public/approval-journey.html",
  "public/agent-workbench-live.html",
  "public/client-portal.html",
  "public/contracts/decision-data-nda-template.txt",
  "public/contracts/decision-data-master-agreement-template.txt",
  "public/contracts/decision-data-technical-annex-template.txt",
  "public/decision-data-logo.png",
  "public/portal-base.css",
  "public/portal-nav.js",
  ".env.example",
  "README.md"
];

const missing = requiredFiles.filter((file) => !existsSync(new URL(`../${file}`, import.meta.url)));

if (missing.length > 0) {
  throw new Error(`Frontend bootstrap missing files: ${missing.join(", ")}`);
}

console.log("Frontend bootstrap lint placeholder ok.");
