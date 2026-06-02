"use client";

import Uppy from "@uppy/core";
import Dashboard from "@uppy/react/dashboard";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMachine } from "@xstate/react";
import { createMachine } from "xstate";
import {
  Activity,
  BadgeDollarSign,
  BarChart3,
  Bell,
  Blocks,
  Braces,
  Eye,
  EyeOff,
  Download,
  FileCheck2,
  Home,
  Lock,
  Play,
  Search,
  ShieldCheck,
  TrendingUp,
  UploadCloud,
  UserPlus,
  Users
} from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { AppShell, type NavItem } from "@/components/app-shell";
import { BackendStatusCard } from "@/components/backend-status";
import { ReportHtmlViewer } from "@/components/report-html-viewer";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Field, Input, MetricCard, Select } from "@/components/ui";
import { backendGet, backendPost, type DemoState, type QueryAudit, type SubUser } from "@/lib/backend-api";
import {
  apiEndpoints,
  bacEvents,
  commercialModes,
  getQueryProductLabel,
  queryProducts,
  registrationSchema,
  reporterSectors,
  requiredDocuments,
  type RegistrationInput
} from "@/lib/data-exchange";

const clientMachine = createMachine({
  id: "clientAccess",
  initial: "login",
  states: {
    login: {
      on: {
        REGISTER: "register",
        PENDING: "pendingPortal",
        APPROVED: "approvedPortal"
      }
    },
    register: {
      on: {
        SUBMIT: "pendingPortal",
        LOGIN: "login"
      }
    },
    pendingPortal: {
      on: {
        APPROVE_DEMO: "approvedPortal",
        LOGOUT: "login"
      }
    },
    approvedPortal: {
      on: {
        LOGOUT: "login",
        RESET_TO_PENDING: "pendingPortal"
      }
    }
  }
});

const navBase: NavItem[] = [
  { id: "inicio", label: "Inicio", icon: Home },
  { id: "estado", label: "Estado de cuenta", icon: Activity },
  { id: "documentos", label: "Documentos", icon: FileCheck2 },
  { id: "subusuarios", label: "Subusuarios", icon: Users },
  { id: "carga", label: "Carga de informacion", icon: UploadCloud },
  { id: "consulta-individual", label: "Consulta individual", icon: Search },
  { id: "consulta-bloque", label: "Consulta por bloque", icon: Blocks },
  { id: "api", label: "API", icon: Braces },
  { id: "facturacion", label: "Facturacion", icon: BadgeDollarSign },
  { id: "auditoria", label: "Auditoria BAC", icon: ShieldCheck },
  { id: "notificaciones", label: "Notificaciones", icon: Bell }
];

const approvedOnly = new Set(["subusuarios", "consulta-individual", "consulta-bloque", "api", "facturacion", "auditoria"]);

const subUserModuleOptions = navBase
  .filter((item) => item.id !== "subusuarios")
  .map((item) => ({ id: item.id, label: item.label }));

export function ClientPortal() {
  const [state, send] = useMachine(clientMachine);
  const [active, setActive] = useState("inicio");
  const [queryProduct, setQueryProduct] = useState("complete_report");
  const [queryIdentifier, setQueryIdentifier] = useState("0923048581");
  const [batchProduct, setBatchProduct] = useState("complete_report");
  const [batchRecordCount, setBatchRecordCount] = useState(1000);
  const [currentLoadSubjects, setCurrentLoadSubjects] = useState(1);
  const [historicalLoadSubjects, setHistoricalLoadSubjects] = useState(0);
  const [historicalLoadDepth, setHistoricalLoadDepth] = useState(48);
  const [sandboxClientId, setSandboxClientId] = useState<string | null>(null);
  const [previewSubUserId, setPreviewSubUserId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const demoState = useQuery({
    queryKey: ["demo-state"],
    queryFn: () => backendGet<DemoState>("/api/v1/demo/state"),
    refetchInterval: 4_000
  });
  const scopedState = buildScopedClientState(demoState.data, sandboxClientId);
  const clientOptions = demoState.data?.adminClients ?? [];
  const selectedAdminClient = clientOptions.find((client) => client.id === (sandboxClientId ?? clientOptions[0]?.id)) ?? clientOptions[0];
  const accountApproved = scopedState?.client.productionAccess === true;
  const isPending = state.matches("pendingPortal") || (state.matches("approvedPortal") && !accountApproved);
  const isApproved = state.matches("approvedPortal") && accountApproved;
  const isPortal = isPending || isApproved;
  const uppy = useMemo(() => new Uppy({ restrictions: { maxNumberOfFiles: 3 } }), []);
  const previewSubUser = scopedState?.subUsers.find((item) => item.id === previewSubUserId && item.status === "active");
  const previewAllowed = new Set(previewSubUser?.allowedModules ?? []);
  const nav = navBase.map((item) => ({
    ...item,
    locked: (!isApproved && approvedOnly.has(item.id)) || (Boolean(previewSubUser) && !previewAllowed.has(item.id))
  }));
  const refreshState = () => queryClient.invalidateQueries({ queryKey: ["demo-state"] });
  const ingestion = useMutation({
    mutationFn: () => backendPost<{ state: DemoState }>("/api/v1/ingestion/information-blocks", {
      clientId: scopedState?.client.id,
      currentSubjects: currentLoadSubjects,
      historicalSubjects: historicalLoadSubjects,
      historicalDepth: historicalLoadDepth
    }),
    onSuccess: () => {
      toast.success("Bloque de informacion procesado en sandbox.");
      refreshState();
    }
  });
  const individualQuery = useMutation({
    mutationFn: () => backendPost<{ state: DemoState }>("/api/v1/queries", {
      product: queryProduct,
      channel: "portal",
      identifierType: guessIdentifierType(queryIdentifier),
      identifier: queryIdentifier,
      clientId: scopedState?.client.id
    }),
    onSuccess: () => {
      toast.success("Consulta registrada con BAC y consentimiento.");
      refreshState();
    }
  });
  const batchQuery = useMutation({
    mutationFn: () => backendPost<{ state: DemoState }>("/api/v1/batch-queries", {
      product: batchProduct,
      recordCount: batchRecordCount,
      clientId: scopedState?.client.id
    }),
    onSuccess: () => {
      toast.success("Consulta por bloque procesada.");
      refreshState();
    }
  });
  const apiQuery = useMutation({
    mutationFn: () => backendPost<{ state: DemoState }>("/api/v1/queries", {
      product: "complete_report",
      channel: "api",
      identifierType: "ruc",
      identifier: "0999999999001",
      user: `api-key:${scopedState?.client.id ?? "megadatos-demo"}`,
      clientId: scopedState?.client.id
    }),
    onSuccess: () => {
      toast.success("Consumo API simulado y facturable.");
      refreshState();
    }
  });
  const createSubUser = useMutation({
    mutationFn: (body: { name: string; email: string; role: string; allowedModules: string[] }) => backendPost<{ state: DemoState }>("/api/v1/client/subusers", { ...body, clientId: scopedState?.client.id }),
    onSuccess: () => {
      toast.success("Subusuario creado con credenciales temporales simuladas.");
      refreshState();
    }
  });
  const updateSubUser = useMutation({
    mutationFn: (body: { id: string; allowedModules?: string[]; active?: boolean }) => backendPost<{ state: DemoState }>(`/api/v1/client/subusers/${body.id}`, { ...body, clientId: scopedState?.client.id }),
    onSuccess: () => {
      toast.success("Permisos del subusuario actualizados.");
      refreshState();
    }
  });
  const registrationForm = useForm<RegistrationInput>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      ruc: "0999999999001",
      legalName: "MEGADATOS S.A. demo",
      contactName: "Mateo Iza",
      email: "miza@decisiondata.ec",
      sector: "Telco / ISP",
      mode: "Data Partner Founding"
    }
  });

  function selectSection(id: string) {
    if (!isApproved && approvedOnly.has(id)) {
      setActive("estado");
      return;
    }
    if (previewSubUser && !previewAllowed.has(id)) {
      setActive("inicio");
      return;
    }
    setActive(id);
  }

  function handleSandboxClientChange(clientId: string) {
    const nextClient = clientOptions.find((client) => client.id === clientId);
    setSandboxClientId(clientId);
    setPreviewSubUserId(null);
    if (state.matches("pendingPortal") && nextClient?.productionAccess) {
      send({ type: "APPROVE_DEMO" });
    }
    if (state.matches("approvedPortal") && !nextClient?.productionAccess) {
      send({ type: "RESET_TO_PENDING" });
    }
  }

  if (!isPortal) {
    return (
      <main className="grid min-h-screen place-items-center p-6">
        <section className="grid w-full max-w-6xl gap-4 lg:grid-cols-[.95fr_1.05fr]">
          <Card className="dd-grid-bg min-h-[580px] p-7">
            <img src="/decision-data-logo.png" alt="Decision Data" className="mb-5 size-20 rounded-lg border border-primary/30 bg-[#05091f] object-contain" />
            <Badge tone="warn">Portal cliente</Badge>
            <h1 className="mt-4 text-4xl font-black leading-tight">Acceso empresarial con control documental y trazabilidad BAC</h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-muted">
              Login primero, autorregistro si no existe usuario, aprobacion documental por admin y operacion productiva solo cuando la cuenta queda habilitada.
            </p>
            <div className="mt-8 grid gap-3">
              <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3 text-sm">Cliente pendiente: documentos y carga no productiva.</div>
              <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3 text-sm">Cliente aprobado: consulta, API, facturacion y auditoria.</div>
              <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3 text-sm">Decision Credits liquidados en postpago mensual.</div>
            </div>
          </Card>
          <Card>
            <CardContent className="p-6">
              {state.matches("login") ? (
                <div className="flex flex-col gap-5">
                  <div>
                    <Badge tone="info">Acceso seguro</Badge>
                    <h2 className="mt-3 text-2xl font-black">Ingresa a tu cuenta</h2>
                    <p className="mt-2 text-sm text-muted">Cuenta seleccionada: {selectedAdminClient?.legalName ?? "cargando"} / {selectedAdminClient?.mode ?? "sandbox"}.</p>
                  </div>
                  {clientOptions.length > 0 ? (
                    <Field label="Cuenta sandbox para probar el journey">
                      <Select value={selectedAdminClient?.id ?? ""} onChange={(event) => handleSandboxClientChange(event.target.value)}>
                        {clientOptions.map((client) => (
                          <option key={client.id} value={client.id}>{client.legalName} / {client.statusLabel}</option>
                        ))}
                      </Select>
                    </Field>
                  ) : null}
                  <Field label="Correo corporativo">
                    <Input defaultValue="operaciones@megadatos.demo" />
                  </Field>
                  <Field label="Contrasena">
                    <Input type="password" defaultValue="demo1234" />
                  </Field>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="primary" onClick={() => send({ type: accountApproved ? "APPROVED" : "PENDING" })}>Ingresar cuenta sandbox</Button>
                    <Button variant="ghost" onClick={() => send({ type: "REGISTER" })}>No tengo usuario</Button>
                  </div>
                </div>
              ) : (
                <form
                  className="flex flex-col gap-5"
                  onSubmit={registrationForm.handleSubmit(() => {
                    toast.success("Solicitud visual enviada a revision admin.");
                    send({ type: "SUBMIT" });
                  })}
                >
                  <div>
                    <Badge tone="warn">Autorregistro</Badge>
                    <h2 className="mt-3 text-2xl font-black">Solicita acceso como cliente o Data Partner</h2>
                    <p className="mt-2 text-sm text-muted">La modalidad queda tentativa hasta revision admin.</p>
                  </div>
                  <div className="grid gap-3 lg:grid-cols-2">
                    <ValidatedField label="RUC" error={registrationForm.formState.errors.ruc?.message}>
                      <Input {...registrationForm.register("ruc")} />
                    </ValidatedField>
                    <ValidatedField label="Razon social" error={registrationForm.formState.errors.legalName?.message}>
                      <Input {...registrationForm.register("legalName")} />
                    </ValidatedField>
                    <ValidatedField label="Contacto autorizado" error={registrationForm.formState.errors.contactName?.message}>
                      <Input {...registrationForm.register("contactName")} />
                    </ValidatedField>
                    <ValidatedField label="Correo" error={registrationForm.formState.errors.email?.message}>
                      <Input {...registrationForm.register("email")} />
                    </ValidatedField>
                    <Field label="Sector">
                      <Select {...registrationForm.register("sector")}>
                        {reporterSectors.map((sector) => <option key={sector}>{sector}</option>)}
                      </Select>
                    </Field>
                    <Field label="Modalidad tentativa">
                      <Select {...registrationForm.register("mode")}>
                        {commercialModes.map((mode) => <option key={mode}>{mode}</option>)}
                      </Select>
                    </Field>
                  </div>
                  <div className="rounded-lg border border-primary/25 bg-primary/10 p-3 text-sm text-amber-100">Descarga contratos, firma y carga habilitantes. Productivo queda bloqueado hasta aprobacion completa.</div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="primary" type="submit">Enviar solicitud visual</Button>
                    <Button variant="ghost" type="button" onClick={() => send({ type: "LOGIN" })}>Volver al login</Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </section>
      </main>
    );
  }

  return (
    <AppShell
      label="Portal cliente"
      title={`${scopedState?.client.legalName ?? "Portal cliente"} / ${scopedState?.client.mode ?? "Data Partner"}`}
      subtitle={previewSubUser ? `Vista previa como ${previewSubUser.name}: solo modulos permitidos por el superadministrador.` : "Cockpit con estado de cuenta, documentos, ingesta, consultas, API, facturacion postpago y auditoria BAC."}
      nav={nav}
      active={active}
      onSelect={selectSection}
      portalLinks={false}
      aside={
        <>
          <b className="text-foreground">{isApproved ? "Cliente aprobado" : "Cliente pendiente"}</b>
          <p className="mt-1">{previewSubUser ? `Preview subusuario: ${previewSubUser.email}` : isApproved ? `Superadministrador de ${scopedState?.client.legalName}.` : "Solo estado, documentos y carga no productiva."}</p>
          {clientOptions.length > 0 ? (
            <div className="mt-3 grid gap-2">
              <span className="text-xs font-semibold uppercase text-muted">Cuenta sandbox</span>
              <Select value={selectedAdminClient?.id ?? ""} onChange={(event) => handleSandboxClientChange(event.target.value)}>
                {clientOptions.map((client) => (
                  <option key={client.id} value={client.id}>{client.legalName} / {client.statusLabel}</option>
                ))}
              </Select>
            </div>
          ) : null}
          {previewSubUser ? <Button className="mt-3 w-full" size="sm" onClick={() => setPreviewSubUserId(null)}>Salir vista subusuario</Button> : null}
          <Button className="mt-3 w-full" size="sm" onClick={() => send({ type: "LOGOUT" })}>Cerrar sesion</Button>
        </>
      }
    >
      {isPending ? (
        <div className="mb-4 rounded-lg border border-primary/30 bg-primary/10 p-3 text-sm text-amber-100">
          Cuenta pendiente: las funciones productivas quedan bloqueadas hasta aprobar documentos habilitantes. Puedes cargar informacion no productiva.
        </div>
      ) : null}
      {active === "inicio" && <Inicio isPending={!isApproved} demoState={scopedState} />}
      {active === "estado" && <Estado demoState={scopedState} />}
      {active === "documentos" && <Documentos />}
      {active === "subusuarios" && <LockedAware enabled={isApproved}><Subusuarios demoState={scopedState} onCreate={(body) => createSubUser.mutate(body)} creating={createSubUser.isPending} onUpdate={(body) => updateSubUser.mutate(body)} updating={updateSubUser.isPending} previewSubUserId={previewSubUserId} onPreview={(id) => { setPreviewSubUserId(id); if (id) setActive("inicio"); }} /></LockedAware>}
      {active === "carga" && <Carga uppy={uppy} isPending={!isApproved} demoState={scopedState} currentSubjects={currentLoadSubjects} historicalSubjects={historicalLoadSubjects} historicalDepth={historicalLoadDepth} onCurrentSubjectsChange={setCurrentLoadSubjects} onHistoricalSubjectsChange={setHistoricalLoadSubjects} onHistoricalDepthChange={setHistoricalLoadDepth} onSimulate={() => ingestion.mutate()} loading={ingestion.isPending} />}
      {active === "consulta-individual" && <LockedAware enabled={isApproved}><ConsultaIndividual identifier={queryIdentifier} onIdentifierChange={setQueryIdentifier} product={queryProduct} onProductChange={setQueryProduct} onRun={() => individualQuery.mutate()} loading={individualQuery.isPending} latest={scopedState?.queries[0]} /></LockedAware>}
      {active === "consulta-bloque" && <LockedAware enabled={isApproved}><ConsultaBloque demoState={scopedState} product={batchProduct} onProductChange={setBatchProduct} recordCount={batchRecordCount} onRecordCountChange={setBatchRecordCount} onRun={() => batchQuery.mutate()} loading={batchQuery.isPending} /></LockedAware>}
      {active === "api" && <LockedAware enabled={isApproved}><Api onRun={() => apiQuery.mutate()} loading={apiQuery.isPending} /></LockedAware>}
      {active === "facturacion" && <LockedAware enabled={isApproved}><Facturacion demoState={scopedState} /></LockedAware>}
      {active === "auditoria" && <LockedAware enabled={isApproved}><Auditoria events={scopedState?.queries ?? bacEvents} /></LockedAware>}
      {active === "notificaciones" && <Notificaciones demoState={scopedState} />}
    </AppShell>
  );
}

function LockedAware({ enabled, children }: { enabled: boolean; children: React.ReactNode }) {
  if (!enabled) {
    return (
      <Card>
        <CardContent className="flex items-center gap-3">
          <Lock className="size-5 text-primary" />
          <div>
            <b>Modulo productivo bloqueado</b>
            <p className="text-sm text-muted">Decision Data debe aprobar documentos habilitantes antes de habilitar este modulo.</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  return children;
}

function Inicio({ isPending, demoState }: { isPending: boolean; demoState?: DemoState }) {
  const totalQueries = getTotalQueries(demoState);
  const creditAlert = getCreditAlert(demoState);

  return (
    <div className="grid gap-4">
      {creditAlert ? (
        <div className={`rounded-lg border p-4 text-sm ${creditAlert.tone === "danger" ? "border-red-400/30 bg-red-500/10 text-red-100" : "border-amber-300/30 bg-amber-400/10 text-amber-100"}`}>
          <b>{creditAlert.title}</b>
          <p className="mt-1">{creditAlert.text}</p>
        </div>
      ) : null}
      <div className="grid gap-4 lg:grid-cols-4">
        <MetricCard label="Consultas del mes" value={String(totalQueries)} tone={isPending ? "warn" : "ok"} />
        <MetricCard label="Principal consulta" value={getMainQueryType(demoState)} tone="warn" />
        <MetricCard label="Creditos disponibles" value={String(demoState?.client.creditsBalance ?? 0)} tone="ok" />
        <MetricCard label="Factura estimada" value={`$${(demoState?.invoicePreview.total ?? 0).toFixed(2)}`} tone="info" />
      </div>
      <ClientUsageDashboard demoState={demoState} />
      <div className="grid gap-4 xl:grid-cols-[.85fr_1.15fr]">
        <BackendStatusCard />
        <Card>
          <CardHeader><CardTitle>Centro de estado</CardTitle><Badge tone="warn">Journey</Badge></CardHeader>
          <CardContent className="grid gap-3">
            {["Autorregistro y correo corporativo", "Documentos firmados y habilitantes", "Aprobacion admin de modalidad", "Clave temporal y cambio obligatorio"].map((item, index) => (
              <div key={item} className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-sm font-black text-primary">{index + 1}</span>
                <span className="text-sm">{item}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ClientUsageDashboard({ demoState }: { demoState?: DemoState }) {
  const [period, setPeriod] = useState<"daily" | "monthly">("daily");
  const series = buildConsumptionSeries(demoState, period);
  const points = toChartPoints(series);
  const path = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
  const lastPoint = points[points.length - 1];
  const areaPath = `${path} L ${lastPoint?.x ?? 0} 180 L ${points[0]?.x ?? 0} 180 Z`;
  const mix = buildProductMix(demoState);
  const maxValue = Math.max(...series.map((item) => item.queries), 1);

  return (
    <Card>
      <CardHeader className="flex-col items-start gap-3 lg:flex-row">
        <div>
          <CardTitle>Reporte de consumo del cliente</CardTitle>
          <p className="mt-1 text-sm text-muted">Lectura inicial para ver tendencia, producto dominante y monto postpago estimado.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant={period === "daily" ? "primary" : "default"} onClick={() => setPeriod("daily")}>Diario</Button>
          <Button size="sm" variant={period === "monthly" ? "primary" : "default"} onClick={() => setPeriod("monthly")}>Mensual</Button>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 xl:grid-cols-[1.3fr_.7fr]">
        <div className="rounded-lg border border-white/10 bg-black/20 p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <TrendingUp className="size-4 text-primary" />
              Consumo {period === "daily" ? "diario" : "mensual"}
            </div>
            <Badge tone="info">Consultas y valor estimado</Badge>
          </div>
          <svg viewBox="0 0 720 220" role="img" aria-label="Tendencia de consumo del cliente" className="h-64 w-full">
            <defs>
              <linearGradient id="usageArea" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#ffc400" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#ff6b1a" stopOpacity="0.03" />
              </linearGradient>
            </defs>
            {[40, 75, 110, 145, 180].map((y) => (
              <line key={y} x1="46" x2="690" y1={y} y2={y} stroke="rgba(255,255,255,.08)" />
            ))}
            <path d={areaPath} fill="url(#usageArea)" />
            <path d={path} fill="none" stroke="#ffc400" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            {points.map((point, index) => (
              <g key={series[index].label}>
                <circle cx={point.x} cy={point.y} r="6" fill="#ffc400" stroke="#07122c" strokeWidth="3" />
                <text x={point.x} y="205" textAnchor="middle" fill="#9fb0cc" fontSize="13" fontWeight="700">{series[index].label}</text>
                <text x={point.x} y={Math.max(22, point.y - 13)} textAnchor="middle" fill="#f8fafc" fontSize="13" fontWeight="800">{series[index].queries}</text>
              </g>
            ))}
            <text x="48" y="28" fill="#9fb0cc" fontSize="13">{maxValue} consultas</text>
          </svg>
          <div className="grid gap-3 md:grid-cols-3">
            {series.slice(-3).map((item) => (
              <div key={`${period}-${item.label}`} className="rounded-lg border border-white/10 bg-white/[0.035] p-3">
                <Badge tone="neutral">{item.label}</Badge>
                <strong className="mt-2 block text-lg text-primary">{item.queries} consultas</strong>
                <p className="mt-1 text-xs text-muted">${item.amount.toFixed(2)} estimado</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4">
          <div className="rounded-lg border border-white/10 bg-white/[0.035]">
            <div className="flex items-start justify-between gap-3 border-b border-white/10 p-4"><CardTitle>Mix de productos</CardTitle><Badge tone="warn">{getMainQueryType(demoState)}</Badge></div>
            <div className="grid gap-3 p-4">
              {mix.map((item) => (
                <div key={item.label} className="grid gap-2">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="flex items-center gap-2"><BarChart3 className="size-4 text-primary" />{item.label}</span>
                    <b>{item.count}</b>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-gradient-to-r from-[#ff6b1a] to-[#ffc400]" style={{ width: `${item.percent}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <Info
            title="Tarifa aplicada"
            text="Cliente cero Data Partner Founding: cada Decision Credit habilita 1 consulta con tarifa Founding. Cuando el saldo llega a 0, el exceso se cobra con tarifa Cliente Normal."
            tone="ok"
          />
          <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
            <Badge tone="info">Ultimas consultas</Badge>
            <div className="mt-3 grid gap-2">
              {(demoState?.queries ?? []).slice(0, 4).map((event) => (
                <div key={event.id} className="grid gap-1 rounded-lg border border-white/10 bg-black/20 p-2 text-xs">
                  <span className="font-semibold text-foreground">{formatProduct(event.product)} / {event.channel}</span>
                  <span className="text-muted">{event.tariff} - {event.creditApplied ? "con credit" : "sin credit"} - ${event.estimatedValue.toFixed(2)}</span>
                </div>
              ))}
              {(demoState?.queries.length ?? 0) === 0 ? <p className="text-sm text-muted">Aun no hay consultas reales en esta sesion sandbox.</p> : null}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Estado({ demoState }: { demoState?: DemoState }) {
  return (
    <Card>
      <CardHeader><CardTitle>Estado de cuenta</CardTitle><Badge tone="warn">Centro unico</Badge></CardHeader>
      <CardContent className="grid gap-3 lg:grid-cols-3">
        <Info title="Modalidad" text={demoState?.client.mode ?? "Data Partner Founding"} tone="warn" />
        <Info title="Estado de aprobacion" text={demoState?.client.productionAccess ? "Aprobado para sandbox productivo." : "Pendiente de aprobacion documental admin."} tone={demoState?.client.productionAccess ? "ok" : "danger"} />
        <Info title="Carga sandbox" text="Permitida para validar formato, calidad, duplicados y consumo simulado." tone="ok" />
        <Info title="Tarifario vigente" text="Founding mantiene tarifa preferencial solo dentro del saldo de Decision Credits: reporte completo desde $0.50 en el tramo 1-100. El exceso cae a Cliente Normal." tone="info" />
        <Info title="Postpago" text={`Subtotal mensual estimado: $${(demoState?.invoicePreview.subtotal ?? 0).toFixed(2)}. No se maneja prepago como modelo principal.`} tone="ok" />
        <Info title="Decision Credits" text={`Generados: ${demoState?.usage.creditsGenerated ?? 0} (M0 ${demoState?.usage.currentCreditsGenerated ?? 0} / historicos ${demoState?.usage.historicalCreditsGenerated ?? 0}). Usados: ${demoState?.usage.creditsUsed ?? 0}. Saldo: ${demoState?.client.creditsBalance ?? 0}.`} tone="neutral" />
        <Info title="Depreciacion de saldo" text={`Al corte mensual se descuenta hasta ${demoState?.invoicePreview.balanceDepreciationPolicy?.monthlyFixedCredits ?? 0.08} credits del saldo no usado. Proyectado del mes: ${demoState?.invoicePreview.balanceDepreciationPolicy?.projectedMonthlyDepreciation ?? 0}.`} tone="warn" />
      </CardContent>
    </Card>
  );
}

function Documentos() {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card>
        <CardHeader><CardTitle>Documentos descargables</CardTitle><Badge tone="info">Templates</Badge></CardHeader>
        <CardContent className="grid gap-3">
          {["NDA Decision Data", "Contrato marco", "Anexo tecnico"].map((item) => <Info key={item} title={item} text="Descargable, firma externa y carga para revision." tone="neutral" />)}
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <a href="/api/backend/api/v1/templates/information-block.csv" download><Download className="size-4" /> Template carga informacion</a>
            </Button>
            <Button asChild>
              <a href="/api/backend/api/v1/templates/batch-query.csv" download><Download className="size-4" /> Template consulta bloque</a>
            </Button>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Checklist habilitante</CardTitle><Badge tone="warn">Revision</Badge></CardHeader>
        <CardContent className="grid gap-2">
          {requiredDocuments.map((document, index) => (
            <label key={document.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] p-3 text-sm">
              <span>{document.label}</span>
              <Badge tone={index < 3 ? "ok" : "warn"}>{index < 3 ? "recibido" : document.blocking ? "bloqueante" : "pendiente"}</Badge>
            </label>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function Carga({
  uppy,
  isPending,
  demoState,
  currentSubjects,
  historicalSubjects,
  historicalDepth,
  onCurrentSubjectsChange,
  onHistoricalSubjectsChange,
  onHistoricalDepthChange,
  onSimulate,
  loading
}: {
  uppy: Uppy;
  isPending: boolean;
  demoState?: DemoState;
  currentSubjects: number;
  historicalSubjects: number;
  historicalDepth: number;
  onCurrentSubjectsChange: (value: number) => void;
  onHistoricalSubjectsChange: (value: number) => void;
  onHistoricalDepthChange: (value: number) => void;
  onSimulate: () => void;
  loading: boolean;
}) {
  const latest = demoState?.uploads[0];
  const projectedCurrentCredits = Math.max(0, currentSubjects);
  const projectedHistoricalCredits = estimateHistoricalCredits(historicalDepth) * Math.max(0, historicalSubjects);

  return (
    <div className="grid gap-4 xl:grid-cols-[.85fr_1.15fr]">
      <Card>
        <CardHeader><CardTitle>Carga de informacion</CardTitle><Badge tone={isPending ? "warn" : "ok"}>{isPending ? "Sandbox" : "Productivo"}</Badge></CardHeader>
        <CardContent className="grid gap-3 text-sm text-muted">
          <p>Regla: bloques de informacion, umbral minimo 95%, duplicados descartados sin error y sin Decision Credits.</p>
          <p>{isPending ? "Como cliente pendiente, esta carga es no productiva y sirve para validar formato, calidad y simulacion de credits." : "Como cliente aprobado, queda lista para control productivo y BAC."}</p>
          <div className="grid gap-3 rounded-lg border border-white/10 bg-white/[0.035] p-3 lg:grid-cols-3">
            <Field label="Sujetos M0 actuales">
              <Input type="number" min={0} value={currentSubjects} onChange={(event) => onCurrentSubjectsChange(Number(event.target.value))} />
            </Field>
            <Field label="Sujetos con historico">
              <Input type="number" min={0} value={historicalSubjects} onChange={(event) => onHistoricalSubjectsChange(Number(event.target.value))} />
            </Field>
            <Field label="Profundidad M-1..M-n">
              <Input type="number" min={0} max={48} value={historicalDepth} onChange={(event) => onHistoricalDepthChange(Number(event.target.value))} />
            </Field>
            <div className="lg:col-span-3 rounded-lg border border-primary/20 bg-primary/10 p-3 text-xs leading-5 text-amber-100">
              M0 genera 1 credit por sujeto. La serie historica completa M-1 a M-48 suma 4 credits por sujeto y se pondera logaritmicamente. Estimado visual: {projectedCurrentCredits.toFixed(2)} actuales + {projectedHistoricalCredits.toFixed(2)} historicos.
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <a href="/api/backend/api/v1/templates/information-block.csv" download><Download className="size-4" /> Descargar template CSV</a>
            </Button>
            <Button variant="primary" onClick={onSimulate} disabled={loading}><UploadCloud className="size-4" /> Simular carga {demoState?.client.legalName ?? "cliente"}</Button>
          </div>
          {latest ? (
            <div className="grid gap-2 rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <b className="text-foreground">Ultima carga: {latest.id}</b>
              <span>Filas recibidas: {latest.rowsReceived} / aceptadas: {latest.acceptedRows} / duplicadas: {latest.duplicateRows} / errores: {latest.errorRows}</span>
              <span>Calidad: {Math.round(latest.qualityScore * 100)}% / creditos generados: {latest.creditsGenerated}</span>
              <span>M0: {(latest.currentCreditsGenerated ?? latest.creditGeneration?.currentCredits ?? 0).toFixed(2)} / historicos: {(latest.historicalCreditsGenerated ?? latest.creditGeneration?.historicalCredits ?? 0).toFixed(2)}</span>
            </div>
          ) : null}
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          <Dashboard uppy={uppy} height={300} proudlyDisplayPoweredByUppy={false} />
        </CardContent>
      </Card>
    </div>
  );
}

function ConsultaIndividual({
  identifier,
  onIdentifierChange,
  product,
  onProductChange,
  onRun,
  loading,
  latest
}: {
  identifier: string;
  onIdentifierChange: (value: string) => void;
  product: string;
  onProductChange: (value: string) => void;
  onRun: () => void;
  loading: boolean;
  latest?: QueryAudit;
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card>
        <CardHeader><CardTitle>Consulta individual</CardTitle><Badge tone="warn">BAC obligatorio</Badge></CardHeader>
        <CardContent className="grid gap-3">
          <Field label="Cedula, RUC o codigo SB"><Input value={identifier} onChange={(event) => onIdentifierChange(event.target.value)} /></Field>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => onIdentifierChange("0923048581")}>Demo NO inhabilitado</Button>
            <Button size="sm" onClick={() => onIdentifierChange("0911111111")}>Demo SI inhabilitado</Button>
            <Button size="sm" onClick={() => onIdentifierChange("SB-000234")}>Codigo SB inhabilitado</Button>
          </div>
          <Field label="Producto">
            <Select value={product} onChange={(event) => onProductChange(event.target.value)}>
              {queryProducts.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </Select>
          </Field>
          <Info title="Valor estimado" text="Founding aplica tarifa preferencial mientras existan Decision Credits. Al agotarse, la siguiente consulta se cobra como exceso a tarifa Cliente Normal. Panorama completo incluye el indicador de inhabilidad SB dentro del reporte." tone="ok" />
          <Button variant="primary" onClick={onRun} disabled={loading}><Play className="size-4" /> Consultar con consentimiento</Button>
          {latest ? <Info title={`BAC ${latest.bac}`} text={`Producto ${formatProduct(latest.product)}, canal ${latest.channel}, tarifa ${latest.tariff}, tramo ${latest.tariffTier ?? "1-100"}, ${latest.creditApplied ? `consume ${latest.creditCost ?? 1} Decision Credit` : "sin Decision Credit"}, valor $${latest.estimatedValue.toFixed(2)}.`} tone="info" /> : null}
        </CardContent>
      </Card>
      <ReportHtmlViewer latest={latest} />
    </div>
  );
}

function ConsultaBloque({
  demoState,
  product,
  onProductChange,
  recordCount,
  onRecordCountChange,
  onRun,
  loading
}: {
  demoState?: DemoState;
  product: string;
  onProductChange: (value: string) => void;
  recordCount: number;
  onRecordCountChange: (value: number) => void;
  onRun: () => void;
  loading: boolean;
}) {
  const latest = demoState?.batchQueries[0];

  return (
    <Card>
      <CardHeader><CardTitle>Consulta por bloque</CardTitle><Badge tone="info">CSV sandbox</Badge></CardHeader>
      <CardContent className="grid gap-3">
        <p className="text-sm text-muted">Carga un bloque de identificadores y escoge si todo el bloque usa reporte basico o panorama completo. Cuando el bloque consume panorama completo, cada fila incluye indicador de inhabilidad SB dentro del reporte.</p>
        <Field label="Producto para todo el bloque">
          <Select value={product} onChange={(event) => onProductChange(event.target.value)}>
            {queryProducts.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </Select>
        </Field>
        <div className="grid gap-3 lg:grid-cols-[1fr_2fr]">
          <Field label="Registros a simular">
            <Input type="number" min={1} max={5000000} value={recordCount} onChange={(event) => onRecordCountChange(Number(event.target.value))} />
          </Field>
          <div className="grid grid-cols-3 gap-2">
            {[1000, 100000, 1000000].map((size) => (
              <Button key={size} size="sm" onClick={() => onRecordCountChange(size)}>{size.toLocaleString("en-US")}</Button>
            ))}
          </div>
        </div>
        <Info title="Simulacion masiva" text="Para miles o millones de registros, el sandbox liquida el bloque agregado por rangos tarifarios sin crear millones de filas en memoria." tone="info" />
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <a href="/api/backend/api/v1/templates/batch-query.csv" download><Download className="size-4" /> Descargar template CSV</a>
          </Button>
          <Button variant="primary" onClick={onRun} disabled={loading}><Play className="size-4" /> Procesar bloque {getQueryProductLabel(product)}</Button>
        </div>
        {latest ? (
          <Info
            title={`Bloque ${latest.id}`}
            text={`${latest.rowsProcessed.toLocaleString("en-US")}/${latest.rowsReceived.toLocaleString("en-US")} filas procesadas${latest.isAggregated ? " en modo agregado" : ""}. Panorama completo: ${(latest.completeReportRows ?? 0).toLocaleString("en-US")} filas con revision SB, ${(latest.sebInhabilitatedRows ?? 0).toLocaleString("en-US")} inhabilitadas. Con credit: ${(latest.creditAppliedRows ?? 0).toLocaleString("en-US")}; exceso/normal: ${((latest.excessRows ?? 0) + (latest.normalRows ?? 0)).toLocaleString("en-US")}. Subtotal estimado $${latest.estimatedSubtotal.toFixed(2)}.`}
            tone="ok"
          />
        ) : null}
        {latest?.tariffBreakdown?.length ? (
          <div className="grid gap-2">
            {latest.tariffBreakdown.map((item) => (
              <div key={`${item.tariff}-${item.tariffTier}-${item.unitPrice}`} className="grid gap-2 rounded-lg border border-white/10 bg-white/[0.03] p-3 text-sm lg:grid-cols-[1fr_120px_120px_120px]">
                <span>{item.tariffLabel}</span>
                <span>{item.tariffTier}</span>
                <span>{item.rows.toLocaleString("en-US")} filas</span>
                <b>${item.subtotal.toFixed(2)}</b>
              </div>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function Api({ onRun, loading }: { onRun: () => void; loading: boolean }) {
  return (
    <div className="grid gap-3">
      <Info title="API keys" text="Scopes, rotacion y vencimiento solo para clientes aprobados." tone="warn" />
      <Card>
        <CardHeader><CardTitle>Ejemplo para desarrolladores</CardTitle><Badge tone="info">Sandbox</Badge></CardHeader>
        <CardContent className="grid gap-3">
          <pre className="overflow-auto rounded-lg border border-white/10 bg-black/30 p-3 text-xs text-slate-200">{`POST /api/v1/queries
Authorization: Bearer dd_sandbox_key
{
  "identifierType": "ruc",
  "identifier": "0999999999001",
  "product": "complete_report",
  "channel": "api"
}`}</pre>
          <Button variant="primary" onClick={onRun} disabled={loading}><Play className="size-4" /> Simular llamada API</Button>
        </CardContent>
      </Card>
      <div className="grid gap-2">
        {apiEndpoints.map((endpoint) => (
          <div key={endpoint.path} className="grid gap-2 rounded-lg border border-white/10 bg-black/20 p-3 text-sm lg:grid-cols-[90px_1fr_180px]">
            <b className="text-primary">{endpoint.method}</b>
            <code className="text-slate-200">{endpoint.path}</code>
            <span className="text-muted">{endpoint.use}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Facturacion({ demoState }: { demoState?: DemoState }) {
  const invoice = demoState?.invoicePreview;
  const breakdown = invoice?.breakdown;
  const dataPartnerCreditQueries = breakdown?.dataPartnerCreditQueries ?? demoState?.usage.dataPartnerCreditQueries ?? 0;
  const dataPartnerCreditSubtotal = breakdown?.dataPartnerCreditSubtotal ?? demoState?.usage.dataPartnerCreditSubtotal ?? 0;
  const excessNormalQueries = breakdown?.excessNormalQueries ?? demoState?.usage.excessNormalQueries ?? 0;
  const excessNormalSubtotal = breakdown?.excessNormalSubtotal ?? demoState?.usage.excessNormalSubtotal ?? 0;

  return (
    <Card>
      <CardHeader><CardTitle>Facturacion mensual postpago</CardTitle><Badge tone="ok">Dinamica sandbox</Badge></CardHeader>
      <CardContent className="grid gap-3 lg:grid-cols-4">
        <MetricCard label="Basicos" value={String(demoState?.usage.basicReports ?? 0)} tone="info" />
        <MetricCard label="Panorama" value={String(demoState?.usage.completeReports ?? 0)} tone="warn" />
        <MetricCard label="API calls" value={String(demoState?.usage.apiCalls ?? 0)} tone="neutral" />
        <MetricCard label="Total estimado" value={`$${(invoice?.total ?? 0).toFixed(2)}`} tone="ok" />
        <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4 lg:col-span-2">
          <Badge tone="ok">Consultas con credit Data Partner</Badge>
          <strong className="mt-3 block text-2xl font-black text-primary">{dataPartnerCreditQueries}</strong>
          <p className="mt-2 text-sm leading-6 text-muted">
            Subtotal con tarifa Founding: ${dataPartnerCreditSubtotal.toFixed(2)}. Estas consultas consumen Decision Credits y mantienen beneficio preferencial.
          </p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4 lg:col-span-2">
          <Badge tone={excessNormalQueries > 0 ? "danger" : "neutral"}>Consultas fuera de credit</Badge>
          <strong className="mt-3 block text-2xl font-black text-primary">{excessNormalQueries}</strong>
          <p className="mt-2 text-sm leading-6 text-muted">
            Subtotal exceso Cliente Normal: ${excessNormalSubtotal.toFixed(2)}. Se activa cuando el saldo de Decision Credits llega a 0.
          </p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4 lg:col-span-4">
          <Badge tone="ok">Decision Credits</Badge>
          <p className="mt-3 text-sm leading-6 text-muted">
            Generados: {invoice?.creditsGenerated ?? 0} (M0: {invoice?.currentCreditsGenerated ?? demoState?.usage.currentCreditsGenerated ?? 0}, historicos: {invoice?.historicalCreditsGenerated ?? demoState?.usage.historicalCreditsGenerated ?? 0}). Usados: {invoice?.creditsUsed ?? 0}. Saldo: {invoice?.creditsBalance ?? 0}. Modelo: postpago mensual.
          </p>
          <p className="mt-2 text-sm leading-6 text-muted">
            Depreciacion de saldo al corte: {invoice?.balanceDepreciationPolicy?.projectedMonthlyDepreciation ?? 0} creditos. Saldo proyectado despues del corte: {invoice?.balanceDepreciationPolicy?.projectedBalanceAfterDepreciation ?? invoice?.creditsBalance ?? 0}.
          </p>
          <p className="mt-2 text-xs text-muted">{invoice?.note}</p>
        </div>
        <div className="overflow-hidden rounded-lg border border-white/10 lg:col-span-4">
          <div className="grid grid-cols-[1fr_120px_140px] gap-3 border-b border-white/10 bg-white/[0.04] p-3 text-xs font-semibold uppercase text-muted">
            <span>Concepto</span>
            <span>Consultas</span>
            <span>Subtotal</span>
          </div>
          <BillingRow label="Dentro de Decision Credits Data Partner Founding" queries={dataPartnerCreditQueries} subtotal={dataPartnerCreditSubtotal} />
          <BillingRow label="Exceso a tarifa Cliente Normal" queries={excessNormalQueries} subtotal={excessNormalSubtotal} />
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4 lg:col-span-4">
          <Badge tone="info">Tarifas aplicadas</Badge>
          <div className="mt-3 grid gap-2">
            {(demoState?.queries ?? []).slice(0, 6).map((event) => (
              <div key={event.id} className="grid gap-2 rounded-lg border border-white/10 bg-black/20 p-3 text-sm lg:grid-cols-[1fr_190px_120px_120px]">
                <span>{formatProduct(event.product)} / {event.channel}</span>
                <span>{event.tariffLabel ?? event.tariff}</span>
                <span>{event.creditApplied ? `Credit ${event.creditCost ?? 1}` : "Sin credit"}</span>
                <b>${event.estimatedValue.toFixed(2)}</b>
              </div>
            ))}
            {(demoState?.batchQueries ?? []).slice(0, 3).flatMap((batch) => batch.tariffBreakdown?.map((item) => (
              <div key={`${batch.id}-${item.tariff}-${item.tariffTier}`} className="grid gap-2 rounded-lg border border-white/10 bg-black/20 p-3 text-sm lg:grid-cols-[1fr_190px_120px_120px]">
                <span>Bloque {batch.id} / {item.rows.toLocaleString("en-US")} filas</span>
                <span>{item.tariffLabel}</span>
                <span>{item.tariffTier}</span>
                <b>${item.subtotal.toFixed(2)}</b>
              </div>
            )) ?? [])}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function BillingRow({ label, queries, subtotal }: { label: string; queries: number; subtotal: number }) {
  return (
    <div className="grid grid-cols-[1fr_120px_140px] gap-3 border-b border-white/10 p-3 text-sm last:border-b-0">
      <span>{label}</span>
      <b>{queries}</b>
      <b>${subtotal.toFixed(2)}</b>
    </div>
  );
}

function estimateHistoricalCredits(depth: number) {
  const safeDepth = Math.max(0, Math.min(48, Math.round(depth)));
  const raw = Array.from({ length: 48 }, (_, index) => Math.log(50 / (index + 2)));
  const scale = 4 / raw.reduce((sum, value) => sum + value, 0);
  return raw.slice(0, safeDepth).reduce((sum, value) => sum + value * scale, 0);
}

function Auditoria({ events }: { events: QueryAudit[] | typeof bacEvents }) {
  return (
    <Card>
      <CardHeader><CardTitle>Auditoria BAC</CardTitle><Badge tone="info">Append-only</Badge></CardHeader>
      <CardContent className="grid gap-3">
        <Info title="Contrato obligatorio" text="Cada consulta registra BAC, consentimiento, usuario, canal, IP, producto, tarifa, valor estimado y estado." tone="info" />
        <div className="overflow-hidden rounded-lg border border-white/10">
          {events.map((event) => (
            <div key={"id" in event ? event.id : `${event.date}-${event.product}`} className="grid gap-2 border-b border-white/10 p-3 text-sm last:border-b-0 lg:grid-cols-[170px_1fr_110px_130px_100px]">
              <span className="text-muted">{"createdAt" in event ? event.createdAt.slice(0, 19).replace("T", " ") : event.date}</span>
              <span>{"user" in event ? `${event.user} / ${event.identifier}` : event.actor}</span>
              <span>{event.channel}</span>
              <span>{"estimatedValue" in event ? `$${event.estimatedValue.toFixed(2)}` : event.value}</span>
              <Badge tone="ok">{event.status}</Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function Subusuarios({
  demoState,
  onCreate,
  creating,
  onUpdate,
  updating,
  previewSubUserId,
  onPreview
}: {
  demoState?: DemoState;
  onCreate: (body: { name: string; email: string; role: string; allowedModules: string[] }) => void;
  creating: boolean;
  onUpdate: (body: { id: string; allowedModules?: string[]; active?: boolean }) => void;
  updating: boolean;
  previewSubUserId: string | null;
  onPreview: (id: string | null) => void;
}) {
  const [name, setName] = useState("Operador cobranza");
  const [email, setEmail] = useState("operador.cobranza@megadatos.demo");
  const [role, setRole] = useState("Operador cliente");
  const [allowedModules, setAllowedModules] = useState(["inicio", "estado", "carga", "consulta-individual"]);
  const subUsers = demoState?.subUsers ?? [];

  function toggleCreateModule(moduleId: string) {
    setAllowedModules((current) => current.includes(moduleId) ? current.filter((item) => item !== moduleId) : [...current, moduleId]);
  }

  function toggleExistingModule(subUser: SubUser, moduleId: string) {
    const next = subUser.allowedModules.includes(moduleId)
      ? subUser.allowedModules.filter((item) => item !== moduleId)
      : [...subUser.allowedModules, moduleId];
    onUpdate({ id: subUser.id, allowedModules: next });
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[.9fr_1.1fr]">
      <Card>
        <CardHeader><CardTitle>Crear subusuario</CardTitle><Badge tone="info">Superadmin cliente</Badge></CardHeader>
        <CardContent className="grid gap-3">
          <Field label="Nombre"><Input value={name} onChange={(event) => setName(event.target.value)} /></Field>
          <Field label="Correo"><Input value={email} onChange={(event) => setEmail(event.target.value)} /></Field>
          <Field label="Rol">
            <Select value={role} onChange={(event) => setRole(event.target.value)}>
              <option>Operador cliente</option>
              <option>Analista de consultas</option>
              <option>Integrador API</option>
              <option>Facturacion</option>
            </Select>
          </Field>
          <div className="grid gap-2">
            <Badge tone="warn">Modulos permitidos</Badge>
            <div className="grid gap-2 md:grid-cols-2">
              {subUserModuleOptions.map((module) => (
                <label key={module.id} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] p-2 text-sm">
                  <input type="checkbox" checked={allowedModules.includes(module.id)} onChange={() => toggleCreateModule(module.id)} />
                  <span>{module.label}</span>
                </label>
              ))}
            </div>
          </div>
          <Button variant="primary" disabled={creating || allowedModules.length === 0} onClick={() => onCreate({ name, email, role, allowedModules })}>
            <UserPlus className="size-4" /> Crear subusuario sandbox
          </Button>
          <p className="text-xs leading-5 text-muted">Al crear se genera un correo simulado en notificaciones/outbox con credenciales temporales.</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Subusuarios creados</CardTitle><Badge tone="ok">{subUsers.length} usuarios</Badge></CardHeader>
        <CardContent className="grid gap-3">
          {subUsers.map((subUser) => (
            <div key={subUser.id} className="grid gap-3 rounded-lg border border-white/10 bg-white/[0.035] p-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <b>{subUser.name}</b>
                  <p className="mt-1 text-xs text-muted">{subUser.email} / {subUser.role}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge tone={subUser.status === "active" ? "ok" : "danger"}>{subUser.status === "active" ? "activo" : "bloqueado"}</Badge>
                  <Button size="sm" onClick={() => onPreview(previewSubUserId === subUser.id ? null : subUser.id)} disabled={subUser.status !== "active"}>
                    {previewSubUserId === subUser.id ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    {previewSubUserId === subUser.id ? "Salir preview" : "Ver como subusuario"}
                  </Button>
                  <Button size="sm" variant={subUser.status === "active" ? "danger" : "primary"} disabled={updating} onClick={() => onUpdate({ id: subUser.id, active: subUser.status !== "active" })}>
                    {subUser.status === "active" ? "Bloquear" : "Desbloquear"}
                  </Button>
                </div>
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                {subUserModuleOptions.map((module) => (
                  <label key={`${subUser.id}-${module.id}`} className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-black/15 p-2 text-sm">
                    <span>{module.label}</span>
                    <input type="checkbox" checked={subUser.allowedModules.includes(module.id)} disabled={updating || subUser.status !== "active"} onChange={() => toggleExistingModule(subUser, module.id)} />
                  </label>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function Notificaciones({ demoState }: { demoState?: DemoState }) {
  const creditAlert = getCreditAlert(demoState);

  return (
    <div className="grid gap-3">
      {creditAlert ? <Info title={creditAlert.title} text={creditAlert.text} tone={creditAlert.tone} /> : null}
      <Info title="Observacion documental" text="Falta nombramiento actualizado del representante legal." tone="warn" />
      <Info title="Sandbox listo" text="La plantilla de carga no productiva esta disponible." tone="ok" />
      <Info title="Consulta bloqueada" text="Cuenta pendiente de aprobacion documental completa." tone="danger" />
      {demoState?.outbox.map((email) => <Info key={email.id} title={email.subject} text={`${email.to} - ${email.status}`} tone="info" />)}
    </div>
  );
}

function buildScopedClientState(demoState: DemoState | undefined, sandboxClientId: string | null): DemoState | undefined {
  if (!demoState) {
    return undefined;
  }

  const selected = demoState.adminClients.find((client) => client.id === sandboxClientId)
    ?? demoState.adminClients.find((client) => client.id === demoState.client.id)
    ?? demoState.adminClients[0];

  if (!selected) {
    return demoState;
  }

  return {
    ...demoState,
    client: {
      id: selected.id,
      legalName: selected.legalName,
      sector: selected.sector,
      mode: selected.mode,
      state: selected.state,
      productionAccess: selected.productionAccess,
      sandboxUploadAllowed: selected.sandboxUploadAllowed,
      creditsBalance: selected.creditsBalance
    },
    documents: selected.documents,
    uploads: selected.uploads,
    queries: selected.queries,
    batchQueries: selected.batchQueries,
    subUsers: selected.subUsers,
    usage: selected.usage,
    outbox: selected.outbox,
    invoicePreview: selected.invoicePreview,
    accessRequest: {
      id: selected.requestId,
      state: selected.state,
      blockingDocumentsMissing: selected.blockingDocumentsMissing
    }
  };
}

function getMainQueryType(demoState?: DemoState) {
  const usage = demoState?.usage;
  const values = [
    { label: "Panorama", count: usage?.completeReports ?? 0 },
    { label: "Basicos", count: usage?.basicReports ?? 0 },
    { label: "API", count: usage?.apiCalls ?? 0 }
  ];
  const winner = values.reduce((best, item) => item.count > best.count ? item : best, values[0]);
  return winner.count > 0 ? winner.label : "Sin consumo";
}

function buildProductMix(demoState?: DemoState) {
  const values = [
    { label: "Panorama completo", count: demoState?.usage.completeReports ?? 0 },
    { label: "Reporte basico", count: demoState?.usage.basicReports ?? 0 },
    { label: "API", count: demoState?.usage.apiCalls ?? 0 }
  ];
  const total = Math.max(values.reduce((sum, item) => sum + item.count, 0), 1);
  return values.map((item) => ({
    ...item,
    percent: Math.max(5, Math.round((item.count / total) * 100))
  }));
}

function buildConsumptionSeries(demoState: DemoState | undefined, period: "daily" | "monthly") {
  const totalQueries = getTotalQueries(demoState);
  const subtotal = demoState?.invoicePreview.subtotal ?? 0;
  const dailyBase = [
    { label: "Lun", queries: 2, amount: 1.0 },
    { label: "Mar", queries: 4, amount: 2.0 },
    { label: "Mie", queries: 3, amount: 1.5 },
    { label: "Jue", queries: 5, amount: 2.5 },
    { label: "Vie", queries: 4, amount: 2.0 },
    { label: "Sab", queries: 1, amount: 0.5 },
    { label: "Hoy", queries: 0, amount: 0 }
  ];
  const monthlyBase = [
    { label: "Ene", queries: 48, amount: 24 },
    { label: "Feb", queries: 62, amount: 31 },
    { label: "Mar", queries: 71, amount: 35.5 },
    { label: "Abr", queries: 56, amount: 28 },
    { label: "May", queries: 0, amount: 0 }
  ];
  const series = period === "daily" ? dailyBase : monthlyBase;
  const current = series[series.length - 1];
  current.queries = Math.max(current.queries, totalQueries);
  current.amount = Math.max(current.amount, subtotal);
  return series;
}

function toChartPoints(series: Array<{ label: string; queries: number; amount: number }>) {
  const maxValue = Math.max(...series.map((item) => item.queries), 1);
  const width = 640;
  const startX = 56;
  const step = width / Math.max(series.length - 1, 1);
  return series.map((item, index) => ({
    x: Math.round(startX + index * step),
    y: Math.round(180 - (item.queries / maxValue) * 135)
  }));
}

function formatProduct(product: string) {
  return getQueryProductLabel(product);
}

function getTotalQueries(demoState?: DemoState) {
  return (demoState?.usage.basicReports ?? 0)
    + (demoState?.usage.completeReports ?? 0);
}

function getCreditAlert(demoState: DemoState | undefined): { title: string; text: string; tone: "warn" | "danger" } | null {
  const balance = demoState?.client.creditsBalance ?? 0;
  if (balance <= 0) {
    return {
      title: "Decision Credits agotados",
      text: "Desde este momento, las consultas sin saldo disponible se liquidan a tarifa de Cliente Normal hasta que generes nuevos credits con carga de informacion.",
      tone: "danger"
    };
  }
  if (balance <= 1) {
    return {
      title: "Decision Credits por agotarse",
      text: `Saldo actual: ${balance}. Cuando llegue a 0, el exceso se cobrara a tarifa de Cliente Normal.`,
      tone: "warn"
    };
  }
  return null;
}

function guessIdentifierType(identifier: string) {
  if (identifier.toUpperCase().startsWith("SB-")) {
    return "codigo_sb";
  }
  if (/^\d{13}$/.test(identifier)) {
    return "ruc";
  }
  return "cedula";
}

function Info({ title, text, tone }: { title: string; text: string; tone: "neutral" | "warn" | "ok" | "danger" | "info" }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
      <Badge tone={tone}>{title}</Badge>
      <p className="mt-3 text-sm leading-6 text-muted">{text}</p>
    </div>
  );
}

function ValidatedField({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <Field label={label}>{children}</Field>
      {error ? <span className="text-xs text-red-200">{error}</span> : null}
    </div>
  );
}
