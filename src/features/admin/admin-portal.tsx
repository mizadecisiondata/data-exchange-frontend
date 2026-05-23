"use client";

import type { ColumnDef } from "@tanstack/react-table";
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
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, MetricCard, Progress, Textarea } from "@/components/ui";
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

  return (
    <AppShell
      label="Portal admin"
      title="Centro de control Decision Data"
      subtitle="Gestion documental, clientes, modalidades, usuarios, ingesta, consumos, facturacion postpago, BAC y configuracion."
      nav={nav}
      active={active}
      onSelect={setActive}
      aside={
        <>
          <b className="text-foreground">Producto limpio</b>
          <p className="mt-1">Agent Workbench no vive en admin. El visor externo esta separado.</p>
        </>
      }
    >
      {active === "dashboard" && <Dashboard />}
      {active === "onboarding" && <Onboarding />}
      {active === "clientes" && <Clientes />}
      {active === "usuarios" && <Info title="Usuarios y roles" text="RBAC granular por modulo: super admin, onboarding, ingesta, facturacion, auditoria y soporte." tone="info" />}
      {active === "ingesta" && <Ingesta />}
      {active === "consumos" && <Info title="Consumos y APIs" text="Llaves API solo para clientes aprobados, scopes, rotacion, limites y auditoria." tone="warn" />}
      {active === "facturacion" && <Facturacion />}
      {active === "auditoria" && <Info title="Auditoria/BAC" text="Append-only: actor, usuario, canal, IP, producto, tarifa, valor, consentimiento y estado." tone="info" />}
      {active === "notificaciones" && <Notificaciones />}
      {active === "configuracion" && <Info title="Configuracion" text="Feature flags, plantillas documentales, politicas de seguridad y parametros no comerciales." tone="neutral" />}
    </AppShell>
  );
}

function Dashboard() {
  return (
    <div className="grid gap-4">
      <div className="grid gap-4 lg:grid-cols-3">
        <MetricCard label="Solicitudes en revision" value="2" tone="warn" />
        <MetricCard label="Clientes productivos reales" value="0" tone="neutral" />
        <MetricCard label="Estado frontend" value="Next" tone="ok" />
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

function Onboarding() {
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
    toast.warning("Observacion visual enviada al cliente.");
  }

  function approveClient() {
    toast.success("Aprobacion visual registrada. En backend real emitiria clave temporal.");
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[1.05fr_.95fr]">
      <Card>
        <CardHeader><CardTitle>Solicitudes</CardTitle><Badge tone="warn">Modulo unico</Badge></CardHeader>
        <CardContent><DataTable columns={clientColumns} data={clients} /></CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Expediente MEGADATOS</CardTitle><Badge tone="warn">Revision</Badge></CardHeader>
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
            <Button onClick={sendObservation}>Enviar observacion</Button>
            <Button variant="primary" disabled={!canApprove} onClick={approveClient}>Aprobar cuando complete</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Clientes() {
  return (
    <Card>
      <CardHeader><CardTitle>Clientes y modalidades</CardTitle><Badge tone="warn">Decision reservada</Badge></CardHeader>
      <CardContent className="grid gap-4">
        <DataTable columns={clientColumns} data={clients} />
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

function Facturacion() {
  return (
    <Card>
      <CardHeader><CardTitle>Facturacion y tarifas</CardTitle><Badge tone="ok">Postpago</Badge></CardHeader>
      <CardContent className="grid gap-3 lg:grid-cols-3">
        <Info title="Cliente Normal" text="No acredita. Paga tarifa normal." tone="neutral" />
        <Info title="Contributor" text="1:2 para reporte basico; exceso a Cliente Normal." tone="warn" />
        <Info title="Active / Founding" text="1:1 beneficio preferencial; exceso a Cliente Normal." tone="ok" />
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
