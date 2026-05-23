"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Bot, Code2, Database, FileQuestion, ShieldCheck } from "lucide-react";
import { BrandMark } from "@/components/brand";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, MetricCard, Progress } from "@/components/ui";

const agents = [
  { name: "Frontend Agent", icon: Code2, progress: 78, task: "Cliente cero con carga, bloque, API, factura y auditoria visibles." },
  { name: "Backend Architect", icon: Database, progress: 66, task: "Store sandbox funcional: aprobacion, ingesta, consultas y uso." },
  { name: "BAC Audit Agent", icon: ShieldCheck, progress: 42, task: "Cada consulta sandbox registra BAC, consentimiento, canal, IP y tarifa." },
  { name: "PM Tracking Agent", icon: FileQuestion, progress: 40, task: "Pricing queda como simulacion tecnica hasta aprobacion final." }
];

const officePositions = [
  { left: "7%", top: "13%" },
  { left: "56%", top: "12%" },
  { left: "11%", top: "58%" },
  { left: "61%", top: "58%" }
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
        <MetricCard label="Avance real" value="74%" tone="warn" />
        <MetricCard label="Agentes" value="4" tone="ok" />
        <MetricCard label="Preguntas bloqueantes" value="0" tone="ok" />
      </section>
      <div className="grid gap-4 xl:grid-cols-[1fr_.8fr]">
        <Card className="overflow-hidden">
          <CardHeader><CardTitle>Oficina viva de agentes</CardTitle><Badge tone="warn">Externo</Badge></CardHeader>
          <CardContent>
            <div className="relative min-h-[430px] overflow-hidden rounded-lg border border-white/10 bg-[#05091f] p-5 dd-grid-bg max-md:grid max-md:gap-4">
              <motion.div
                className="absolute left-[18%] top-[38%] z-10 rounded-full border border-primary/40 bg-primary/10 p-3 text-primary shadow-[0_0_30px_rgba(255,196,0,.2)] max-md:hidden"
                animate={{ x: [0, 285, 115, 470, 0], y: [0, -110, 120, 105, 0] }}
                transition={{ duration: 19, repeat: Infinity, ease: "easeInOut" }}
              >
                <Bot className="size-7" />
              </motion.div>
              <div className="absolute inset-x-[12%] top-1/2 h-px bg-primary/25 max-md:hidden" />
              <div className="absolute inset-y-[18%] left-1/2 w-px bg-primary/25 max-md:hidden" />
              {agents.map((agent, index) => {
                const Icon = agent.icon;
                return (
                  <div
                    key={agent.name}
                    className="absolute w-[32%] min-w-52 rounded-lg border border-white/10 bg-card/85 p-4 shadow-2xl max-md:static max-md:w-full max-md:min-w-0"
                    style={officePositions[index]}
                  >
                    <div className="mb-3 h-10 rounded-lg border border-primary/20 bg-primary/10" />
                    <motion.div
                      className="absolute right-5 top-8 grid justify-items-center"
                      animate={index % 2 === 0 ? { y: [0, -5, 0] } : { x: [0, 6, 0] }}
                      transition={{ duration: 2.2 + index * 0.2, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <span className="size-8 rounded-full bg-gradient-to-br from-[#ffc400] to-[#ff6b1a]" />
                      <span className="mt-1 h-9 w-7 rounded-t-full bg-slate-200" />
                    </motion.div>
                    <div className="flex items-start gap-3 pr-14">
                      <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><Icon className="size-5" /></span>
                      <div className="min-w-0"><b>{agent.name}</b><p className="mt-1 text-xs leading-5 text-muted">{agent.task}</p></div>
                    </div>
                    <Progress value={agent.progress} className="mt-4" />
                    <span className="mt-2 block text-xs font-semibold text-primary">{agent.progress}% de su subflujo</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Bitacora viva</CardTitle><Badge tone="ok">Coherente</Badge></CardHeader>
          <CardContent className="grid gap-3">
            <Log text="Checkpoint de rollback creado en GitHub antes del rediseno Next." />
            <Log text="Fase 2 activa: primera capa login y autorregistro visual." />
            <Log text="Backend conectado desde frontend mediante /api/backend/health." />
            <Log text="Sandbox funcional agregado: aprobar, cargar, consultar, bloquear, API y facturar." />
            <Log text="Admin revisa expediente y emite outbox simulado de credenciales." />
            <Log text="Workbench sigue separado del producto admin." />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function Log({ text }: { text: string }) {
  return <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-sm text-muted">{text}</div>;
}
