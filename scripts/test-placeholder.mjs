import { getFrontendConfig, buildFrontendHealth } from "../src/config/env.mjs";

const health = buildFrontendHealth(getFrontendConfig(), new Date("2026-05-22T00:00:00.000Z"));

if (health.portals.devMonitor.startsWith(health.portals.admin)) {
  throw new Error("Development monitor must remain outside admin product routes.");
}

if (health.portals.client === health.portals.admin) {
  throw new Error("Client and admin portals must remain separated.");
}

if (health.portals.approvalJourney !== "/journey") {
  throw new Error("Approval journey route must remain available for Mateo validation.");
}

console.log("Frontend bootstrap tests ok.");
