import { getFrontendConfig, buildFrontendHealth } from "../src/config/env.mjs";

const config = getFrontendConfig();
const health = buildFrontendHealth(config, new Date("2026-05-22T00:00:00.000Z"));

const expected = [
  health.status === "ok",
  health.service === "data-exchange-frontend",
  health.phase === "0",
  health.portals.client === "/client",
  health.portals.admin === "/admin",
  health.portals.agentWorkbench === "/admin/agent-workbench"
];

if (expected.some((value) => value !== true)) {
  console.error(JSON.stringify(health, null, 2));
  throw new Error("Frontend health contract failed.");
}

console.log("Frontend health contract ok.");
