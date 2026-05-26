"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  BadgeDollarSign,
  Bell,
  Building2,
  Gauge,
  KeyRound,
  Settings,
  ShieldCheck,
  UploadCloud,
  Users,
  Workflow
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell, type NavItem } from "@/components/app-shell";
import { BackendStatusCard } from "@/components/backend-status";
import { DataTable } from "@/components/data-table";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Field, Input, MetricCard, Progress, Textarea } from "@/components/ui";
import { backendGet, backendPost, type DemoState } from "@/lib/backend-api";
import {
  initialDocumentState,
  requiredDocuments,
  type RequiredDocumentId
} from "@/lib/data-exchange";

type ClientRow = {
  empresa: string;
  sector: string;
  modalidad: string;
  estado: string;
};

const nav: NavItem[] = [
  { id: "dashboard", label: "Dashboard ejecutivo", icon: Gauge },
  { id: "onboarding", label: "Onboarding y revision", icon: Workflow },
  { id: "clientes", label: "Clientes y modalidades", icon: Building2 },
  { id: "usuarios", label: "Usuarios y roles", icon: Users },
  { id: "ingesta", label: "Control de ingesta", icon: UploadCloud },
  { id: "consumos", label: "Consumos y APIs", icon: KeyRound },
  { id: "facturacion", label: "Facturacion y tarifas", icon: BadgeDollarSign },
  { id: "auditoria", label: "Auditoria/BAC", icon: ShieldCheck },
  { id: "notificaciones", label: "Notificaciones globales", icon: Bell },
  { id: "configuracion", label: "Configuracion", icon: Settings }
];

const clients: ClientRow[] = [
  { empresa: "MEGADATOS S.A.", sector: "Telco / ISP", modalidad: "Founding tentativa", estado: "Documentos observados" },
  { empresa: "Retail Demo", sector: "Retail", modalidad: "Active tentativa", estado: "Sin contratos firmados" },
  { empresa: "Casa Comercial Demo", sector: "Casa comercial", modalidad: "Cliente Normal", estado: "No productivo" }
];

const clientColumns: ColumnDef<ClientRow>[] = [
  { accessorKey: "empresa", header: "Cliente" },
  { accessorKey: "sector", header: "Sector" },
  { accessorKey: "modalidad", header: "Modalidad" },
  {
    accessorKey: "estado",
    header: "Estado",
    cell: ({ getValue }) => <Badge tone={String(getValue()).includes("observados") ? "warn" : "neutral"}>{String(getValue())}</Badge>
  }
];

export function AdminPortal() {
  const [active, setActive] = useState("dashboard");
  const [authenticated, setAuthenticated] = useState(false);
  const queryClient = useQueryClient();
  const demoState = useQuery({
    queryKey: ["demo-state"],
    queryFn: () => backendGet<DemoState>("/api/v1/demo/state"),
    refetchInterval: 4_000
  });
  const refreshState = () => queryClient.invalidateQueries({ queryKey: ["demo-state"] });
  const approve = useMutation({
    mutationFn: () => backendPost("/api/v1/admin/access-requests/REQ-2026-MEGADATOS-DEMO/approve", {}),
    onSuccess: () => {
      toast.success("Cliente aprobado. Credenciales temporales quedaron en outbox simulado.");
      refreshState();
    }
  });
  const observe = useMutation({
    mutationFn: (observation: string) => backendPost("/api/v1/admin/access-requests/REQ-2026-MEGADATOS-DEMO/observe", { observation }),
    onSuccess: () => {
      toast.warning("Observacion enviada al outbox simulado.");
      refreshState();
    }
  });

  if (!authenticated) {
    return (
      <main className="grid min-h-screen place-items-center p-6">
        <Card className="w-full max-w-xl">
          <CardContent className="grid gap-5 p-6">
            <div>
              <Badge tone="info">Portal admin</Badge>
              <h1 className="mt-3 text-3xl font-black">Acceso Decision Data</h1>
              <p className="mt-2 text-sm text-muted">Login separado para administracion, onboarding, aprobaciones y control operativo.</p>
            </div>
            <Field label="Usuario admin"><Input defaultValue="admin@decisiondata.ec" /></Field>
            <Field label="Contrasena"><Input type="password" defaultValue="demo-admin" /></Field>
            <Button variant="primary" onClick={() => setAuthenticated(true)}>Ingresar al admin</Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <AppShell
      label="Portal admin"
      title="Centro de control Decision Data"
      subtitle="Gestion documental, clientes, modalidades, usuarios, ingesta, consumos, facturacion postpago, BAC y configuracion."
      nav={nav}
      active={active}
      onSelect={setActive}
      portalLinks={false}
      aside={
        <>
          <b className="text-foreground">Producto limpio</b>
          <p className="mt-1">Agent Workbench no vive en admin. El visor externo esta separado.</p>
        </>
      }
    >
      {active === "dashboard" && <Dashboard demoState={demoState.data} />}
      {active === "onboarding" && <Onboarding demoState={demoState.data} onApprove={() => approve.mutate()} approving={approve.isPending} onObserve={(text) => observe.mutate(text)} observing={observe.isPending} />}
      {active === "clientes" && <Clientes demoState={demoState.data} />}
      {active === "usuarios" && <Info title="Usuarios y roles" text="RBAC granular por modulo: super admin, onboarding, ingesta, facturacion, auditoria y soporte." tone="info" />}
      {active === "ingesta" && <Ingesta />}
      {active === "consumos" && <Consumos demoState={demoState.data} />}
      {active === "facturacion" && <Facturacion demoState={demoState.data} />}
      {active === "auditoria" && <Info title="Auditoria/BAC" text="Append-only: actor, usuario, canal, IP, producto, tarifa, valor, consentimiento y estado." tone="info" />}
      {active === "notificaciones" && <Notificaciones />}
      {active === "configuracion" && <Info title="Configuracion" text="Feature flags, plantillas documentales, politicas de seguridad y parametros no comerciales." tone="neutral" />}
    </AppShell>
  );
}

function Dashboard({ demoState }: { demoState?: DemoState }) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-4 lg:grid-cols-3">
        <MetricCard label="Solicitudes en revision" value={demoState?.client.productionAccess ? "0" : "1"} tone="warn" />
        <MetricCard label="Clientes productivos sandbox" value={demoState?.client.productionAccess ? "1" : "0"} tone="neutral" />
        <MetricCard label="Factura estimada" value={`$${(demoState?.invoicePreview.total ?? 0).toFixed(2)}`} tone="ok" />
      </div>
      <div className="grid gap-4 xl:grid-cols-[.75fr_1.25fr]">
        <BackendStatusCard />
        <Card>
          <CardHeader><CardTitle>Prioridades operativas</CardTitle><Badge tone="warn">Fase 2 visual</Badge></CardHeader>
          <CardContent className="grid gap-3">
            <Step n="1" text="Revisar documentos MEGADATOS y emitir observaciones." />
            <Step n="2" text="Confirmar modalidad sin automatizar pricing ni excepciones." />
            <Step n="3" text="Habilitar productivo solo con expediente completo." />
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4">
        <Card>
          <CardHeader><CardTitle>Guardrails</CardTitle><Badge tone="ok">Confirmados</Badge></CardHeader>
          <CardContent className="grid gap-3">
            <Info title="Postpago mensual" text="Decision Credits no son prepago." tone="ok" />
            <Info title="Calidad 95%" text="Duplicados no son error ni generan credits." tone="ok" />
            <Info title="Consulta trazada" text="BAC y consentimiento obligatorios." tone="ok" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Onboarding({ demoState, onApprove, approving, onObserve, observing }: { demoState?: DemoState; onApprove: () => void; approving: boolean; onObserve: (text: string) => void; observing: boolean }) {
  const [documentState, setDocumentState] = useState(initialDocumentState);
  const [observation, setObservation] = useState("Falta cargar RUC actualizado, nombramiento y cedula del representante legal.");
  const blockingDocuments = requiredDocuments.filter((item) => item.blocking);
  const completedBlocking = blockingDocuments.filter((item) => documentState[item.id]).length;
  const completion = Math.round((completedBlocking / blockingDocuments.length) * 100);
  const canApprove = completedBlocking === blockingDocuments.length;

  function toggleDocument(id: RequiredDocumentId) {
    setDocumentState((current) => ({ ...current, [id]: !current[id] }));
  }

  function sendObservation() {
    onObserve(observation);
  }

  function approveClient() {
    onApprove();
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[1.05fr_.95fr]">
      <Card>
        <CardHeader><CardTitle>Solicitudes</CardTitle><Badge tone="warn">Modulo unico</Badge></CardHeader>
        <CardContent><DataTable columns={clientColumns} data={clients} /></CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Expediente MEGADATOS</CardTitle><Badge tone={demoState?.client.productionAccess ? "ok" : "warn"}>{demoState?.client.productionAccess ? "Aprobado" : "Revision"}</Badge></CardHeader>
        <CardContent className="grid gap-2">
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-muted">Checklist bloqueante</span>
              <b>{completion}%</b>
            </div>
            <Progress value={completion} />
          </div>
          {requiredDocuments.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => toggleDocument(item.id)}
              className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] p-3 text-left text-sm transition hover:border-primary/30"
            >
              <span>{item.label}</span>
              <Badge tone={documentState[item.id] ? "ok" : item.blocking ? "warn" : "neutral"}>
                {documentState[item.id] ? "ok" : item.blocking ? "bloqueante" : "pendiente"}
              </Badge>
            </button>
          ))}
          <Textarea value={observation} onChange={(event) => setObservation(event.target.value)} />
          <div className="mt-2 flex gap-2">
            <Button onClick={sendObservation} disabled={observing}>Enviar observacion</Button>
            <Button variant="primary" disabled={approving} onClick={approveClient}>{canApprove ? "Aprobar cliente cero" : "Aprobar y completar checklist demo"}</Button>
          </div>
          {demoState?.outbox[0] ? <Info title="Ultimo correo simulado" text={`${demoState.outbox[0].subject} / ${demoState.outbox[0].status}`} tone="info" /> : null}
        </CardContent>
      </Card>
    </div>
  );
}

function Clientes({ demoState }: { demoState?: DemoState }) {
  const rows = demoState
    ? [{ empresa: demoState.client.legalName, sector: demoState.client.sector, modalidad: demoState.client.mode, estado: demoState.client.productionAccess ? "Aprobado" : "Documentos observados" }]
    : clients;

  return (
    <Card>
      <CardHeader><CardTitle>Clientes y modalidades</CardTitle><Badge tone="warn">Decision reservada</Badge></CardHeader>
      <CardContent className="grid gap-4">
        <DataTable columns={clientColumns} data={rows} />
        <Info title="Pricing protegido" text="Cambios de modalidad, tarifa, excepciones o beneficios se consultan con Mateo." tone="warn" />
      </CardContent>
    </Card>
  );
}

function Ingesta() {
  return (
    <Card>
      <CardHeader><CardTitle>Control de ingesta</CardTitle><Badge tone="ok">Guardrails</Badge></CardHeader>
      <CardContent className="grid gap-3 lg:grid-cols-2">
        <Info title="Bloques de informacion" text="No bloques de cartera. Diccionario Reporte como base." tone="info" />
        <Info title="Umbral minimo" text="95% de calidad antes de aceptar productivo." tone="ok" />
        <Info title="Duplicados" text="Descartar sin error y sin Decision Credits." tone="ok" />
        <Info title="Reportantes permitidos" text="Casas comerciales, telcos, retail, concesionarios, fintechs, cobranza/BPO, industria y mayoristas." tone="neutral" />
      </CardContent>
    </Card>
  );
}

function Consumos({ demoState }: { demoState?: DemoState }) {
  return (
    <Card>
      <CardHeader><CardTitle>Consumos y APIs</CardTitle><Badge tone="warn">Tiempo real sandbox</Badge></CardHeader>
      <CardContent className="grid gap-3 lg:grid-cols-5">
        <MetricCard label="Basicos" value={String(demoState?.usage.basicReports ?? 0)} tone="info" />
        <MetricCard label="Panorama" value={String(demoState?.usage.completeReports ?? 0)} tone="warn" />
        <MetricCard label="Inhabilidades" value={String(demoState?.usage.inhabilitationChecks ?? 0)} tone="danger" />
        <MetricCard label="API calls" value={String(demoState?.usage.apiCalls ?? 0)} tone="neutral" />
        <MetricCard label="BAC registrados" value={String(demoState?.queries.length ?? 0)} tone="ok" />
      </CardContent>
    </Card>
  );
}

function Facturacion({ demoState }: { demoState?: DemoState }) {
  return (
    <Card>
      <CardHeader><CardTitle>Facturacion y tarifas</CardTitle><Badge tone="ok">Postpago</Badge></CardHeader>
      <CardContent className="grid gap-3 lg:grid-cols-3">
        <Info title="Subtotal" text={`$${(demoState?.invoicePreview.subtotal ?? 0).toFixed(2)}`} tone="neutral" />
        <Info title="IVA estimado" text={`$${(demoState?.invoicePreview.tax ?? 0).toFixed(2)}`} tone="warn" />
        <Info title="Total postpago" text={`$${(demoState?.invoicePreview.total ?? 0).toFixed(2)}`} tone="ok" />
      </CardContent>
    </Card>
  );
}

function Notificaciones() {
  return (
    <div className="grid gap-3">
      <Info title="Nueva solicitud" text="MEGADATOS tiene documentos faltantes para aprobar." tone="warn" />
      <Info title="Visor externo" text="Agent Workbench fue retirado del producto admin." tone="ok" />
      <Info title="Decision reservada" text="No automatizar pricing, regulatorio ni excepciones." tone="danger" />
    </div>
  );
}

function Step({ n, text }: { n: string; text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-3">
      <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-sm font-black text-primary">{n}</span>
      <span className="text-sm">{text}</span>
    </div>
  );
}

function Info({ title, text, tone }: { title: string; text: string; tone: "neutral" | "warn" | "ok" | "danger" | "info" }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
      <Badge tone={tone}>{title}</Badge>
      <p className="mt-3 text-sm leading-6 text-muted">{text}</p>
    </div>
  );
}
