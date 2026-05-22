import { getFrontendConfig, buildFrontendHealth } from "../src/config/env.mjs";

const health = buildFrontendHealth(getFrontendConfig(), new Date("2026-05-22T00:00:00.000Z"));

if (!health.portals.agentWorkbench.startsWith(health.portals.admin)) {
  throw new Error("Agent Workbench must remain scoped to admin portal.");
}

if (health.portals.client === health.portals.admin) {
  throw new Error("Client and admin portals must remain separated.");
}

console.log("Frontend bootstrap tests ok.");
