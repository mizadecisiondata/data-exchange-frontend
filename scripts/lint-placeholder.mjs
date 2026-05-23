import { existsSync } from "node:fs";

const requiredFiles = [
  "src/app/client/README.md",
  "src/app/client/page.tsx",
  "src/app/admin/README.md",
  "src/app/admin/page.tsx",
  "src/app/admin/agent-workbench/page.tsx",
  "src/app/api/backend/health/route.ts",
  "src/app/journey/page.tsx",
  "src/app/health/route.ts",
  "src/app/internal/dev-monitor/README.md",
  "src/app/internal/dev-monitor/page.tsx",
  "src/app/layout.tsx",
  "src/app/globals.css",
  "src/components/app-shell.tsx",
  "src/components/backend-status.tsx",
  "src/components/query-provider.tsx",
  "src/components/ui.tsx",
  "src/features/client/client-portal.tsx",
  "src/features/admin/admin-portal.tsx",
  "src/features/journey/journey-page.tsx",
  "src/features/dev-monitor/dev-monitor.tsx",
  "src/lib/data-exchange.ts",
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
