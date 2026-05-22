const DEFAULTS = {
  FRONTEND_HOST: "127.0.0.1",
  FRONTEND_PORT: "3100",
  NEXT_PUBLIC_APP_ENV: "local",
  NEXT_PUBLIC_API_BASE_URL: "http://localhost:4100",
  NEXT_PUBLIC_CLIENT_PORTAL_PATH: "/client",
  NEXT_PUBLIC_ADMIN_PORTAL_PATH: "/admin",
  NEXT_PUBLIC_AGENT_WORKBENCH_PATH: "/admin/agent-workbench"
};

export function getFrontendConfig(env = process.env) {
  const source = { ...DEFAULTS, ...env };

  if (!source.NEXT_PUBLIC_AGENT_WORKBENCH_PATH.startsWith(source.NEXT_PUBLIC_ADMIN_PORTAL_PATH)) {
    throw new Error("Agent Workbench must remain inside admin portal.");
  }

  return {
    host: source.FRONTEND_HOST,
    port: Number(source.FRONTEND_PORT),
    appEnv: source.NEXT_PUBLIC_APP_ENV,
    apiBaseUrl: source.NEXT_PUBLIC_API_BASE_URL,
    clientPortalPath: source.NEXT_PUBLIC_CLIENT_PORTAL_PATH,
    adminPortalPath: source.NEXT_PUBLIC_ADMIN_PORTAL_PATH,
    agentWorkbenchPath: source.NEXT_PUBLIC_AGENT_WORKBENCH_PATH
  };
}

export function buildFrontendHealth(config, now = new Date()) {
  return {
    status: "ok",
    service: "data-exchange-frontend",
    phase: "0",
    environment: config.appEnv,
    timestamp: now.toISOString(),
    apiBaseUrl: config.apiBaseUrl,
    portals: {
      client: config.clientPortalPath,
      admin: config.adminPortalPath,
      agentWorkbench: config.agentWorkbenchPath
    }
  };
}
