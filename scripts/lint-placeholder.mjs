import { existsSync } from "node:fs";

const requiredFiles = [
  "src/app/client/README.md",
  "src/app/admin/README.md",
  "src/app/admin/agent-workbench/README.md",
  "src/config/env.mjs",
  "public/agent-workbench-live.html",
  "public/decision-data-logo.png",
  ".env.example",
  "README.md"
];

const missing = requiredFiles.filter((file) => !existsSync(new URL(`../${file}`, import.meta.url)));

if (missing.length > 0) {
  throw new Error(`Frontend bootstrap missing files: ${missing.join(", ")}`);
}

console.log("Frontend bootstrap lint placeholder ok.");
