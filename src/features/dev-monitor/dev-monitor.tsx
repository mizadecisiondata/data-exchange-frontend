"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Bot, Code2, Database, FileQuestion, ShieldCheck } from "lucide-react";
import { BrandMark } from "@/components/brand";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, MetricCard } from "@/components/ui";

const agents = [
  { name: "Frontend Agent", icon: Code2, progress: 62, task: "Migrando a Next + Tailwind + shadcn-style." },
  { name: "Backend Architect", icon: Database, progress: 35, task: "Contratos y health alineados con visor externo." },
  { name: "BAC Audit Agent", icon: ShieldCheck, progress: 18, task: "Preparando trazabilidad obligatoria." },
  { name: "PM Tracking Agent", icon: FileQuestion, progress: 24, task: "Preguntas sensibles se registran para Mateo." }
];

export function DevMonitor() {
  return (
    <main className="min-h-screen p-5 lg:p-8">
      <header className="mb-5 flex flex-col gap-4 rounded-lg border border-white/10 bg-white/[0.035] p-5 lg:flex-row lg:items-center lg:justify-between">
        <BrandMark label="Visor externo de desarrollo" />
        <div className="flex flex-wrap gap-2">
          <Button asChild><Link href="/client">Cliente</Link></Button>
          <Button asChild><Link href="/admin">Admin</Link></Button>
          <Button asChild><Link href="/journey">Journey</Link></Button>
        </div>
      </header>
      <section className="mb-4 grid gap-4 lg:grid-cols-4">
        <MetricCard label="Fase" value="2" tone="info" />
        <MetricCard label="Avance real" value="62%" tone="warn" />
        <MetricCard label="Agentes" value="4" tone="ok" />
        <MetricCard label="Preguntas bloqueantes" value="0" tone="ok" />
      </section>
      <div className="grid gap-4 xl:grid-cols-[1fr_.8fr]">
        <Card className="overflow-hidden">
          <CardHeader><CardTitle>Oficina viva de agentes</CardTitle><Badge tone="warn">Externo</Badge></CardHeader>
          <CardContent>
            <div className="relative min-h-[430px] overflow-hidden rounded-lg border border-white/10 bg-[#05091f] p-5 dd-grid-bg">
              <motion.div
                className="absolute left-8 top-8 rounded-full border border-primary/40 bg-primary/10 p-3 text-primary"
                animate={{ x: [0, 420, 120, 650, 0], y: [0, 90, 260, 310, 0] }}
                transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
              >
                <Bot className="size-7" />
              </motion.div>
              <div className="grid gap-4 md:grid-cols-2">
                {agents.map((agent) => {
                  const Icon = agent.icon;
                  return (
                    <div key={agent.name} className="rounded-lg border border-white/10 bg-card/80 p-4">
                      <div className="flex items-center gap-3">
                        <span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary"><Icon className="size-5" /></span>
                        <div><b>{agent.name}</b><p className="text-xs text-muted">{agent.task}</p></div>
                      </div>
                      <div className="mt-4 h-2 rounded-full bg-white/10">
                        <motion.div className="h-2 rounded-full bg-gradient-to-r from-[#ff6b1a] to-[#ffc400]" initial={{ width: 0 }} animate={{ width: `${agent.progress}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Bitacora viva</CardTitle><Badge tone="ok">Coherente</Badge></CardHeader>
          <CardContent className="grid gap-3">
            <Log text="Checkpoint de rollback creado en GitHub antes del rediseño." />
            <Log text="Rama nueva: codex/fase-2-next-design-system." />
            <Log text="Stack instalado: Next, Tailwind, Radix/shadcn-style, TanStack, XState, Motion." />
            <Log text="Workbench sigue separado del producto." />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function Log({ text }: { text: string }) {
  return <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-sm text-muted">{text}</div>;
}
