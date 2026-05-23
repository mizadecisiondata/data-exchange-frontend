"use client";

import { useQuery } from "@tanstack/react-query";
import { Server } from "lucide-react";
import { Badge, Card, CardContent, Progress } from "@/components/ui";

type BackendHealthPayload = {
  status: string;
  backend?: {
    status: string;
    service: string;
    phase: string;
    rules?: {
      billingMode: string;
      ingestionQualityThreshold: number;
      duplicatePolicy: string;
    };
  };
};

async function fetchBackendHealth(): Promise<BackendHealthPayload> {
  const response = await fetch("/api/backend/health");
  if (!response.ok) {
    throw new Error("Backend no disponible");
  }
  return response.json();
}

export function BackendStatusCard() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["backend-health"],
    queryFn: fetchBackendHealth
  });

  const healthy = data?.status === "ok" && data.backend?.status === "ok";

  return (
    <Card>
      <CardContent className="flex items-center gap-4">
        <span className="grid size-11 place-items-center rounded-lg border border-info/25 bg-info/10 text-info">
          <Server className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <b>Backend operativo</b>
            <Badge tone={healthy ? "ok" : isError ? "danger" : "warn"}>{healthy ? "online" : isLoading ? "validando" : "offline"}</Badge>
          </div>
          <p className="mt-1 text-sm text-muted">
            {healthy
              ? `${data.backend?.service} - ${data.backend?.phase} - postpago ${data.backend?.rules?.billingMode}`
              : "Se conserva la UI, pero los endpoints reales deben estar disponibles para produccion."}
          </p>
          <Progress value={healthy ? 100 : isLoading ? 45 : 10} className="mt-3" />
        </div>
      </CardContent>
    </Card>
  );
}
