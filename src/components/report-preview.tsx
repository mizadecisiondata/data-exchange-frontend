"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@/components/ui";

const scoreTrend = [
  { month: "3m", score: 991 },
  { month: "6m", score: 991 },
  { month: "12m", score: 987 }
];

export function ReportPreview() {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Reporte completo Decision Data</CardTitle>
          <p className="mt-1 text-sm text-muted">Base visual tomada del reporte ejemplo confirmado por Mateo.</p>
        </div>
        <Badge tone="ok">A+</Badge>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 lg:grid-cols-[150px_1fr]">
          <div className="grid place-items-center rounded-lg border border-primary/25 bg-primary/10 p-4">
            <div className="grid size-28 place-items-center rounded-full bg-[conic-gradient(var(--success)_0_84%,rgba(255,255,255,.12)_84%_100%)]">
              <div className="grid size-20 place-items-center rounded-full bg-card text-3xl font-black">991</div>
            </div>
            <span className="mt-3 text-xs font-semibold text-muted">Score Crediticio Pro</span>
          </div>
          <div className="h-48 min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={scoreTrend} margin={{ left: -18, right: 10, top: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="scoreFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#ffc400" stopOpacity={0.55} />
                    <stop offset="95%" stopColor="#ff6b1a" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,.08)" vertical={false} />
                <XAxis dataKey="month" stroke="#9fb0cc" />
                <YAxis stroke="#9fb0cc" domain={[940, 1000]} />
                <Tooltip contentStyle={{ background: "#07122c", border: "1px solid rgba(255,255,255,.12)", borderRadius: 8 }} />
                <Area type="monotone" dataKey="score" stroke="#ffc400" fill="url(#scoreFill)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
