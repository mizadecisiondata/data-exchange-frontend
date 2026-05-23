import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    status: "ok",
    service: "data-exchange-frontend",
    phase: "2-design-system",
    environment: process.env.NEXT_PUBLIC_APP_ENV ?? "local",
    timestamp: new Date().toISOString(),
    portals: {
      client: "/client",
      admin: "/admin",
      devMonitor: "/internal/dev-monitor",
      approvalJourney: "/journey"
    },
    stack: ["next", "typescript", "tailwind", "radix-shadcn-style", "tanstack", "xstate"]
  });
}
