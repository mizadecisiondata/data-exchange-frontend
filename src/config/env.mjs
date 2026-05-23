const DEFAULTS = {
  FRONTEND_HOST: "127.0.0.1",
  FRONTEND_PORT: "3100",
  NEXT_PUBLIC_APP_ENV: "local",
  NEXT_PUBLIC_API_BASE_URL: "http://localhost:4100",
  NEXT_PUBLIC_CLIENT_PORTAL_PATH: "/client",
  NEXT_PUBLIC_ADMIN_PORTAL_PATH: "/admin",
  NEXT_PUBLIC_DEV_MONITOR_PATH: "/internal/dev-monitor",
  NEXT_PUBLIC_APPROVAL_JOURNEY_PATH: "/journey"
};

export function getFrontendConfig(env = process.env) {
  const source = { ...DEFAULTS, ...env };

  if (source.NEXT_PUBLIC_DEV_MONITOR_PATH.startsWith(source.NEXT_PUBLIC_ADMIN_PORTAL_PATH)) {
    throw new Error("Development monitor must remain outside admin product routes.");
  }

  return {
    host: source.FRONTEND_HOST,
    port: Number(source.FRONTEND_PORT),
    appEnv: source.NEXT_PUBLIC_APP_ENV,
    apiBaseUrl: source.NEXT_PUBLIC_API_BASE_URL,
    clientPortalPath: source.NEXT_PUBLIC_CLIENT_PORTAL_PATH,
    adminPortalPath: source.NEXT_PUBLIC_ADMIN_PORTAL_PATH,
    devMonitorPath: source.NEXT_PUBLIC_DEV_MONITOR_PATH,
    approvalJourneyPath: source.NEXT_PUBLIC_APPROVAL_JOURNEY_PATH
  };
}

export function buildFrontendHealth(config, now = new Date()) {
  return {
    status: "ok",
    service: "data-exchange-frontend",
    phase: "2-design-system",
    environment: config.appEnv,
    timestamp: now.toISOString(),
    apiBaseUrl: config.apiBaseUrl,
    portals: {
      client: config.clientPortalPath,
      admin: config.adminPortalPath,
      devMonitor: config.devMonitorPath,
      approvalJourney: config.approvalJourneyPath
    }
  };
}
