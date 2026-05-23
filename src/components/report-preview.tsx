"use client";

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
          <div className="min-h-48 min-w-0 rounded-lg border border-white/10 bg-black/15 p-3">
            <svg viewBox="0 0 620 210" role="img" aria-label="Tendencia de score crediticio" className="h-full min-h-44 w-full">
              <defs>
                <linearGradient id="scoreFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="5%" stopColor="#ffc400" stopOpacity="0.55" />
                  <stop offset="95%" stopColor="#ff6b1a" stopOpacity="0.04" />
                </linearGradient>
              </defs>
              {[40, 80, 120, 160].map((y) => (
                <line key={y} x1="44" x2="590" y1={y} y2={y} stroke="rgba(255,255,255,.08)" />
              ))}
              <path d="M64 72 C185 70 245 71 330 86 C430 106 490 64 570 58 L570 178 L64 178 Z" fill="url(#scoreFill)" />
              <path d="M64 72 C185 70 245 71 330 86 C430 106 490 64 570 58" fill="none" stroke="#ffc400" strokeWidth="5" strokeLinecap="round" />
              {scoreTrend.map((item, index) => {
                const x = [64, 330, 570][index];
                const y = [72, 86, 58][index];
                return (
                  <g key={item.month}>
                    <circle cx={x} cy={y} r="7" fill="#ffc400" stroke="#07122c" strokeWidth="4" />
                    <text x={x} y="199" textAnchor="middle" fill="#9fb0cc" fontSize="18" fontWeight="700">{item.month}</text>
                    <text x={x} y={y - 16} textAnchor="middle" fill="#f8fafc" fontSize="17" fontWeight="800">{item.score}</text>
                  </g>
                );
              })}
              <text x="50" y="28" fill="#9fb0cc" fontSize="16">940</text>
              <text x="50" y="64" fill="#9fb0cc" fontSize="16">1000</text>
            </svg>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
