"use client";

import Link from "next/link";
import { Background, Controls, ReactFlow, type Edge, type Node } from "@xyflow/react";
import { BrandMark } from "@/components/brand";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, MetricCard } from "@/components/ui";

const nodes: Node[] = [
  { id: "registro", position: { x: 0, y: 40 }, data: { label: "Autorregistro" } },
  { id: "docs", position: { x: 210, y: 40 }, data: { label: "Documentos" } },
  { id: "admin", position: { x: 420, y: 40 }, data: { label: "Revision admin" } },
  { id: "sandbox", position: { x: 630, y: 0 }, data: { label: "Carga sandbox" } },
  { id: "productivo", position: { x: 630, y: 90 }, data: { label: "Productivo aprobado" } },
  { id: "bac", position: { x: 840, y: 90 }, data: { label: "Consulta + BAC" } }
];

const edges: Edge[] = [
  { id: "e1", source: "registro", target: "docs", animated: true },
  { id: "e2", source: "docs", target: "admin", animated: true },
  { id: "e3", source: "admin", target: "sandbox", label: "pendiente" },
  { id: "e4", source: "admin", target: "productivo", label: "aprobado", animated: true },
  { id: "e5", source: "productivo", target: "bac", animated: true }
];

export function JourneyPage() {
  return (
    <main className="min-h-screen p-5 lg:p-8">
      <header className="mb-5 flex flex-col gap-4 rounded-lg border border-white/10 bg-white/[0.035] p-5 lg:flex-row lg:items-center lg:justify-between">
        <BrandMark label="Journey preproduccion" />
        <div className="flex flex-wrap gap-2">
          <Button asChild><Link href="/client">Portal cliente</Link></Button>
          <Button asChild><Link href="/admin">Portal admin</Link></Button>
          <Button asChild variant="primary"><Link href="/internal/dev-monitor">Visor externo</Link></Button>
        </div>
      </header>
      <section className="mb-4 grid gap-4 lg:grid-cols-3">
        <MetricCard label="Cliente demo" value="MEGADATOS" tone="info" />
        <MetricCard label="Diccionario" value="57 campos" tone="ok" />
        <MetricCard label="Facturacion" value="Postpago" tone="warn" />
      </section>
      <div className="grid gap-4 xl:grid-cols-[1fr_.9fr]">
        <Card>
          <CardHeader><CardTitle>Mapa del journey aprobado</CardTitle><Badge tone="ok">React Flow</Badge></CardHeader>
          <CardContent>
            <div className="h-[430px] rounded-lg border border-white/10 bg-black/20">
              <ReactFlow nodes={nodes} edges={edges} fitView>
                <Background />
                <Controls />
              </ReactFlow>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Checklist antes de produccion</CardTitle><Badge tone="warn">Mateo</Badge></CardHeader>
          <CardContent className="grid gap-3">
            {[
              "Login primero en cliente y admin",
              "Cliente pendiente solo usa sandbox",
              "Admin revisa checklist documental",
              "Reporte completo toma base del HTML ejemplo",
              "BAC obligatorio en toda consulta",
              "Pricing y regulatorio se consultan antes de automatizar"
            ].map((item) => (
              <label key={item} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] p-3 text-sm">
                <span>{item}</span>
                <Badge tone="ok">visual</Badge>
              </label>
            ))}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
