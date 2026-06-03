"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BadgeDollarSign,
  Bell,
  Building2,
  FileCheck2,
  Gauge,
  KeyRound,
  Play,
  Settings,
  ShieldCheck,
  UploadCloud,
  UserPlus,
  Users,
  Workflow
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell, type NavItem } from "@/components/app-shell";
import { BackendStatusCard } from "@/components/backend-status";
import { SingularityHero } from "@/components/singularity-hero";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Field, Input, MetricCard, Progress, Select, Textarea } from "@/components/ui";
import { backendGet, backendPost, type AdminAuditEvent, type AdminClient, type AdminUser, type DemoState } from "@/lib/backend-api";
import { commercialModes, reporterSectors, requiredDocuments } from "@/lib/data-exchange";

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

const adminModuleOptions = nav.map((item) => ({ id: item.id, label: item.label }));

export function AdminPortal() {
  const [active, setActive] = useState("dashboard");
  const [authenticated, setAuthenticated] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const demoState = useQuery({
    queryKey: ["demo-state"],
    queryFn: () => backendGet<DemoState>("/api/v1/demo/state"),
    refetchInterval: 4_000
  });
  const refreshState = () => queryClient.invalidateQueries({ queryKey: ["demo-state"] });
  const clients = demoState.data?.adminClients ?? [];
  const selectedClient = clients.find((client) => client.id === selectedClientId) ?? clients[0];

  const approve = useMutation({
    mutationFn: (requestId: string) => backendPost("/api/v1/admin/access-requests/" + requestId + "/approve", {}),
    onSuccess: () => {
      toast.success("Cliente aprobado. El portal cliente y admin quedan sincronizados.");
      refreshState();
    }
  });
  const observe = useMutation({
    mutationFn: (body: { requestId: string; observation: string }) => backendPost("/api/v1/admin/access-requests/" + body.requestId + "/observe", { observation: body.observation }),
    onSuccess: () => {
      toast.warning("Observacion registrada y visible en notificaciones.");
      refreshState();
    }
  });
  const createClient = useMutation({
    mutationFn: (body: { legalName: string; sector: string; mode: string; email: string }) => backendPost<{ state: DemoState }>("/api/v1/admin/clients", body),
    onSuccess: (payload) => {
      const created = payload.state.adminClients[0];
      setSelectedClientId(created?.id ?? null);
      toast.success("Cliente fantasma creado para probar onboarding.");
      refreshState();
    }
  });
  const createAdminUser = useMutation({
    mutationFn: (body: { name: string; email: string; role: string; modules: string[] }) => backendPost<{ state: DemoState }>("/api/v1/admin/users", body),
    onSuccess: () => {
      toast.success("Usuario admin creado.");
      refreshState();
    }
  });
  const updateAdminUser = useMutation({
    mutationFn: (body: { id: string; active?: boolean; modules?: string[]; role?: string }) => backendPost<{ state: DemoState }>("/api/v1/admin/users/" + body.id, body),
    onSuccess: () => {
      toast.success("Usuario admin actualizado.");
      refreshState();
    }
  });
  const updateSettings = useMutation({
    mutationFn: (body: { emailProvider?: string; devMonitorExternal?: boolean; sbInhabilitationIncludedInPanorama?: boolean; allowPricingAutomation?: boolean }) => backendPost<{ state: DemoState }>("/api/v1/admin/settings", body),
    onSuccess: () => {
      toast.success("Configuracion operativa actualizada.");
      refreshState();
    },
    onError: (error) => toast.error(error.message)
  });
  const dispatchInvoice = useMutation({
    mutationFn: (body: { clientId: string; channel: "email" | "provider_api"; cutoffPeriod: string }) => backendPost<{ state: DemoState }>(`/api/v1/admin/billing/${body.clientId}/dispatch`, { channel: body.channel, cutoffPeriod: body.cutoffPeriod }),
    onSuccess: () => {
      toast.success("Factura aprobada y despacho simulado registrado.");
      refreshState();
    }
  });
  const approveDocument = useMutation({
    mutationFn: (body: { clientId: string; documentId: string }) => backendPost<{ state: DemoState }>(`/api/v1/admin/clients/${body.clientId}/documents/${body.documentId}/approve`, {}),
    onSuccess: () => {
      toast.success("Documento aprobado.");
      refreshState();
    }
  });

  if (!authenticated) {
    return (
      <main className="dd-login-page grid min-h-screen place-items-center p-6">
        <section className="grid w-full max-w-6xl gap-4 lg:grid-cols-[.95fr_1.05fr]">
          <SingularityHero
            eyebrow="Portal admin"
            title="Centro de control Decision Data"
            body="Login separado para administracion, onboarding, aprobaciones documentales y control operativo del sandbox."
            items={[
              "Solicitudes, clientes y modalidades.",
              "Usuarios, ingesta, consumos y APIs.",
              "Facturacion, BAC y notificaciones globales."
            ]}
          />
          <Card className="dd-auth-card">
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
        </section>
      </main>
    );
  }

  return (
    <AppShell
      label="Portal admin"
      title="Centro de control Decision Data"
      subtitle="Clientes, onboarding, usuarios, ingesta, consumos, facturacion, BAC, notificaciones y configuracion conectados al sandbox."
      nav={nav}
      active={active}
      onSelect={setActive}
      portalLinks={false}
      aside={
        <>
          <b className="text-foreground">{selectedClient?.legalName ?? "Sin cliente"}</b>
          <p className="mt-1">{selectedClient ? `${selectedClient.mode} / ${selectedClient.statusLabel}` : "Cargando estado admin."}</p>
          <Button className="mt-3 w-full" size="sm" onClick={() => setActive("clientes")}>Cambiar cliente</Button>
        </>
      }
    >
      {active === "dashboard" && <Dashboard demoState={demoState.data} />}
      {active === "onboarding" && (
        <Onboarding
          clients={clients}
          selectedClient={selectedClient}
          onSelect={setSelectedClientId}
          onApprove={(requestId) => approve.mutate(requestId)}
          approving={approve.isPending}
          onObserve={(requestId, observation) => observe.mutate({ requestId, observation })}
          observing={observe.isPending}
          onApproveDocument={(clientId, documentId) => approveDocument.mutate({ clientId, documentId })}
          approvingDocument={approveDocument.isPending}
        />
      )}
      {active === "clientes" && <Clientes clients={clients} selectedClient={selectedClient} onSelect={setSelectedClientId} onCreate={(body) => createClient.mutate(body)} creating={createClient.isPending} />}
      {active === "usuarios" && <Usuarios users={demoState.data?.adminUsers ?? []} onCreate={(body) => createAdminUser.mutate(body)} creating={createAdminUser.isPending} onUpdate={(body) => updateAdminUser.mutate(body)} updating={updateAdminUser.isPending} />}
      {active === "ingesta" && <Ingesta demoState={demoState.data} />}
      {active === "consumos" && <Consumos demoState={demoState.data} selectedClient={selectedClient} clients={clients} onSelect={setSelectedClientId} />}
      {active === "facturacion" && <Facturacion clients={clients} selectedClient={selectedClient} onSelect={setSelectedClientId} onDispatch={(clientId, channel, cutoffPeriod) => dispatchInvoice.mutate({ clientId, channel, cutoffPeriod })} dispatching={dispatchInvoice.isPending} />}
      {active === "auditoria" && <Auditoria demoState={demoState.data} clients={clients} selectedClient={selectedClient} />}
      {active === "notificaciones" && <Notificaciones demoState={demoState.data} />}
      {active === "configuracion" && <Configuracion demoState={demoState.data} onUpdate={(body) => updateSettings.mutate(body)} updating={updateSettings.isPending} />}
    </AppShell>
  );
}

function Dashboard({ demoState }: { demoState?: DemoState }) {
  const usage = demoState?.globalUsage;

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 lg:grid-cols-4">
        <MetricCard label="Solicitudes en revision" value={String(usage?.pendingClients ?? 0)} tone="warn" />
        <MetricCard label="Clientes productivos" value={String(usage?.productiveClients ?? 0)} tone="ok" />
        <MetricCard label="Consultas globales" value={String(usage?.totalQueries ?? 0)} tone="info" />
        <MetricCard label="Facturacion estimada" value={`$${(usage?.estimatedSubtotal ?? 0).toFixed(2)}`} tone="neutral" />
      </div>
      <div className="grid gap-4 xl:grid-cols-[.8fr_1.2fr]">
        <BackendStatusCard />
        <Card>
          <CardHeader><CardTitle>Consumo global mensual</CardTitle><Badge tone="ok">Todos los clientes</Badge></CardHeader>
          <CardContent><LineChart data={usage?.series ?? []} /></CardContent>
        </Card>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Clientes por actividad</CardTitle><Badge tone="info">Tiempo real</Badge></CardHeader>
          <CardContent className="grid gap-2">
            {(usage?.byClient ?? []).map((client) => <BarRow key={client.clientId} label={client.legalName} value={client.queries} max={Math.max(...(usage?.byClient ?? []).map((item) => item.queries), 1)} detail={`${client.uploads} cargas / $${client.subtotal.toFixed(2)}`} />)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Mix de productos</CardTitle><Badge tone="warn">Consultas</Badge></CardHeader>
          <CardContent className="grid gap-2">
            {(usage?.productMix ?? []).map((item) => <BarRow key={item.label} label={item.label} value={item.count} max={Math.max(...(usage?.productMix ?? []).map((mix) => mix.count), 1)} />)}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Onboarding({
  clients,
  selectedClient,
  onSelect,
  onApprove,
  approving,
  onObserve,
  observing,
  onApproveDocument,
  approvingDocument
}: {
  clients: AdminClient[];
  selectedClient?: AdminClient;
  onSelect: (id: string) => void;
  onApprove: (requestId: string) => void;
  approving: boolean;
  onObserve: (requestId: string, observation: string) => void;
  observing: boolean;
  onApproveDocument: (clientId: string, documentId: string) => void;
  approvingDocument: boolean;
}) {
  const [observation, setObservation] = useState("Falta completar documentos habilitantes para aprobar acceso productivo.");
  const docs = selectedClient?.documents ?? {};
  const blockingDocuments = requiredDocuments.filter((item) => item.blocking);
  const completedBlocking = blockingDocuments.filter((item) => docs[item.id]).length;
  const completion = blockingDocuments.length === 0 ? 0 : Math.round((completedBlocking / blockingDocuments.length) * 100);
  const canApprove = selectedClient?.productionAccess === false;

  return (
    <div className="grid gap-4 xl:grid-cols-[.9fr_1.1fr]">
      <Card>
        <CardHeader><CardTitle>Solicitudes y clientes</CardTitle><Badge tone="warn">{clients.length} expedientes</Badge></CardHeader>
        <CardContent className="grid gap-2">
          {clients.map((client) => (
            <button
              key={client.id}
              type="button"
              onClick={() => onSelect(client.id)}
              className={`rounded-lg border p-3 text-left transition ${selectedClient?.id === client.id ? "border-primary/60 bg-primary/10" : "border-white/10 bg-white/[0.03] hover:border-primary/30"}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <b>{client.legalName}</b>
                  <p className="mt-1 text-xs text-muted">{client.requestId} / {client.mode}</p>
                </div>
                <Badge tone={client.productionAccess ? "ok" : "warn"}>{client.statusLabel}</Badge>
              </div>
            </button>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Expediente {selectedClient?.legalName ?? "sin seleccion"}</CardTitle>
          <Badge tone={selectedClient?.productionAccess ? "ok" : "warn"}>{selectedClient?.productionAccess ? "Aprobado" : "Revision"}</Badge>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
            <div className="mb-2 flex items-center justify-between text-sm"><span className="text-muted">Checklist bloqueante</span><b>{completion}%</b></div>
            <Progress value={completion} />
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            {requiredDocuments.map((item) => (
              <div key={item.id} className="grid gap-2 rounded-lg border border-white/10 bg-white/[0.03] p-3 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <b>{item.label}</b>
                    <p className="mt-1 text-xs text-muted">{selectedClient?.documentFiles?.[item.id]?.fileName ?? "Sin archivo cargado"}</p>
                  </div>
                  <Badge tone={docs[item.id] ? "ok" : selectedClient?.documentFiles?.[item.id] ? "info" : item.blocking ? "warn" : "neutral"}>{docs[item.id] ? "aprobado" : selectedClient?.documentFiles?.[item.id] ? "en revision" : item.blocking ? "bloqueante" : "pendiente"}</Badge>
                </div>
                <Button
                  size="sm"
                  disabled={!selectedClient || docs[item.id] || !selectedClient.documentFiles?.[item.id] || approvingDocument}
                  onClick={() => selectedClient && onApproveDocument(selectedClient.id, item.id)}
                >
                  Aprobar documento
                </Button>
              </div>
            ))}
          </div>
          <Textarea value={observation} onChange={(event) => setObservation(event.target.value)} />
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => selectedClient && onObserve(selectedClient.requestId, observation)} disabled={!selectedClient || observing}>Enviar observacion</Button>
            <Button variant="primary" onClick={() => selectedClient && onApprove(selectedClient.requestId)} disabled={!canApprove || approving}><FileCheck2 className="size-4" /> Aprobar acceso</Button>
          </div>
          {selectedClient?.outbox[0] ? <Info title="Ultima notificacion del cliente" text={`${selectedClient.outbox[0].subject} / ${selectedClient.outbox[0].status}`} tone="info" /> : null}
        </CardContent>
      </Card>
    </div>
  );
}

function Clientes({ clients, selectedClient, onSelect, onCreate, creating }: { clients: AdminClient[]; selectedClient?: AdminClient; onSelect: (id: string) => void; onCreate: (body: { legalName: string; sector: string; mode: string; email: string }) => void; creating: boolean }) {
  const [legalName, setLegalName] = useState("CLIENTE FANTASMA S.A.");
  const [email, setEmail] = useState("operaciones@cliente-fantasma.demo");
  const [sector, setSector] = useState<(typeof reporterSectors)[number]>("Casa comercial");
  const [mode, setMode] = useState<(typeof commercialModes)[number]>("Cliente Normal");

  return (
    <div className="grid gap-4 xl:grid-cols-[1.15fr_.85fr]">
      <Card>
        <CardHeader><CardTitle>Clientes y modalidades</CardTitle><Badge tone="info">{clients.length} clientes</Badge></CardHeader>
        <CardContent className="grid gap-2">
          {clients.map((client) => (
            <button key={client.id} type="button" onClick={() => onSelect(client.id)} className={`grid gap-2 rounded-lg border p-3 text-left text-sm transition lg:grid-cols-[1fr_160px_150px_120px] ${selectedClient?.id === client.id ? "border-primary/60 bg-primary/10" : "border-white/10 bg-white/[0.03]"}`}>
              <b>{client.legalName}</b>
              <span>{client.sector}</span>
              <span>{client.mode}</span>
              <Badge tone={client.productionAccess ? "ok" : "warn"}>{client.statusLabel}</Badge>
            </button>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Crear cliente fantasma</CardTitle><Badge tone="warn">Sandbox</Badge></CardHeader>
        <CardContent className="grid gap-3">
          <Field label="Razon social"><Input value={legalName} onChange={(event) => setLegalName(event.target.value)} /></Field>
          <Field label="Correo operativo"><Input value={email} onChange={(event) => setEmail(event.target.value)} /></Field>
          <Field label="Sector"><Select value={sector} onChange={(event) => setSector(event.target.value as (typeof reporterSectors)[number])}>{reporterSectors.map((item) => <option key={item}>{item}</option>)}</Select></Field>
          <Field label="Modalidad tentativa"><Select value={mode} onChange={(event) => setMode(event.target.value as (typeof commercialModes)[number])}>{commercialModes.map((item) => <option key={item}>{item}</option>)}</Select></Field>
          <Button variant="primary" disabled={creating} onClick={() => onCreate({ legalName, sector, mode, email })}><Building2 className="size-4" /> Crear cliente</Button>
          <Info title="Pricing protegido" text="Crear clientes no automatiza cambios comerciales ni excepciones de tarifa." tone="warn" />
        </CardContent>
      </Card>
    </div>
  );
}

function Usuarios({ users, onCreate, creating, onUpdate, updating }: { users: AdminUser[]; onCreate: (body: { name: string; email: string; role: string; modules: string[] }) => void; creating: boolean; onUpdate: (body: { id: string; active?: boolean; modules?: string[]; role?: string }) => void; updating: boolean }) {
  const [name, setName] = useState("Analista soporte");
  const [email, setEmail] = useState("soporte@decisiondata.ec");
  const [role, setRole] = useState("Soporte");
  const [modules, setModules] = useState(["dashboard", "clientes", "notificaciones"]);

  function toggleModule(moduleId: string) {
    setModules((current) => current.includes(moduleId) ? current.filter((item) => item !== moduleId) : [...current, moduleId]);
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[.85fr_1.15fr]">
      <Card>
        <CardHeader><CardTitle>Crear usuario admin</CardTitle><Badge tone="info">RBAC</Badge></CardHeader>
        <CardContent className="grid gap-3">
          <Field label="Nombre"><Input value={name} onChange={(event) => setName(event.target.value)} /></Field>
          <Field label="Correo"><Input value={email} onChange={(event) => setEmail(event.target.value)} /></Field>
          <Field label="Rol"><Select value={role} onChange={(event) => setRole(event.target.value)}><option>Soporte</option><option>Onboarding</option><option>Facturacion</option><option>Auditoria</option><option>Super admin</option></Select></Field>
          <div className="grid gap-2 md:grid-cols-2">
            {adminModuleOptions.map((module) => <label key={module.id} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] p-2 text-sm"><input type="checkbox" checked={modules.includes(module.id)} onChange={() => toggleModule(module.id)} />{module.label}</label>)}
          </div>
          <Button variant="primary" disabled={creating || modules.length === 0} onClick={() => onCreate({ name, email, role, modules })}><UserPlus className="size-4" /> Crear usuario</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Usuarios Decision Data</CardTitle><Badge tone="ok">{users.length} usuarios</Badge></CardHeader>
        <CardContent className="grid gap-3">
          {users.map((user) => (
            <div key={user.id} className="rounded-lg border border-white/10 bg-white/[0.035] p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div><b>{user.name}</b><p className="mt-1 text-xs text-muted">{user.email} / {user.role}</p></div>
                <div className="flex flex-wrap gap-2">
                  <Badge tone={user.status === "active" ? "ok" : "danger"}>{user.status === "active" ? "activo" : "bloqueado"}</Badge>
                  <Button size="sm" variant={user.status === "active" ? "danger" : "primary"} disabled={updating} onClick={() => onUpdate({ id: user.id, active: user.status !== "active" })}>{user.status === "active" ? "Bloquear" : "Desbloquear"}</Button>
                </div>
              </div>
              <p className="mt-2 text-xs leading-5 text-muted">Modulos: {user.modules.join(", ")}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function Ingesta({ demoState }: { demoState?: DemoState }) {
  const dashboard = demoState?.ingestionDashboard;

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 lg:grid-cols-4">
        <MetricCard label="Registros aceptados" value={String(dashboard?.acceptedRows ?? 0)} tone="ok" />
        <MetricCard label="Duplicados descartados" value={String(dashboard?.duplicateRows ?? 0)} tone="neutral" />
        <MetricCard label="Errores calidad" value={String(dashboard?.errorRows ?? 0)} tone="danger" />
        <MetricCard label="Umbral minimo" value={`${Math.round((dashboard?.qualityThreshold ?? 0.95) * 100)}%`} tone="warn" />
      </div>
      <Card>
        <CardHeader><CardTitle>Tendencia de ingesta</CardTitle><Badge tone="warn">Registros aceptados</Badge></CardHeader>
        <CardContent><LineChart data={dashboard?.series ?? []} /></CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Cargas por cliente</CardTitle><Badge tone="info">Bloques de informacion</Badge></CardHeader>
        <CardContent className="grid gap-2">
          {(dashboard?.byClient ?? []).map((item) => <BarRow key={item.clientId} label={item.legalName} value={item.acceptedRows} max={Math.max(...(dashboard?.byClient ?? []).map((client) => client.acceptedRows), 1)} detail={`${item.uploads} cargas / ${item.creditsGenerated} credits`} />)}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Ultimas cargas</CardTitle><Badge tone="ok">{dashboard?.uploads.length ?? 0} eventos</Badge></CardHeader>
        <CardContent className="grid gap-2">
          {(dashboard?.uploads ?? []).map((upload) => <EventRow key={upload.id} title={upload.clientName} detail={`${upload.acceptedRows}/${upload.rowsReceived} aceptadas, ${upload.duplicateRows} duplicadas, calidad ${Math.round(upload.qualityScore * 100)}%`} status={upload.status} date={upload.createdAt} />)}
          {(dashboard?.uploads.length ?? 0) === 0 ? <Info title="Sin cargas aun" text="Cuando MEGADATOS simule una carga en el portal cliente, aparecera aqui en tiempo real." tone="warn" /> : null}
        </CardContent>
      </Card>
    </div>
  );
}

function Consumos({
  demoState,
  clients,
  selectedClient,
  onSelect
}: {
  demoState?: DemoState;
  clients: AdminClient[];
  selectedClient?: AdminClient;
  onSelect: (id: string) => void;
}) {
  const usage = demoState?.globalUsage;
  const selectedUsage = selectedClient?.usage;
  const clientConsumptionMax = Math.max(...clients.map((client) => client.usage.basicReports + client.usage.completeReports + client.usage.apiCalls), 1);

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 lg:grid-cols-4">
        <MetricCard label="Basicos" value={String(usage?.basicReports ?? 0)} tone="info" />
        <MetricCard label="Panorama" value={String(usage?.completeReports ?? 0)} tone="warn" />
        <MetricCard label="API calls" value={String(usage?.apiCalls ?? 0)} tone="neutral" />
        <MetricCard label="BAC registrados" value={String(demoState?.auditLog.filter((event) => event.type === "query_bac").length ?? 0)} tone="ok" />
      </div>
      <Card>
        <CardHeader><CardTitle>Tendencia global de consumo</CardTitle><Badge tone="warn">Todos los clientes</Badge></CardHeader>
        <CardContent><LineChart data={usage?.series ?? []} /></CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Mix por canal</CardTitle><Badge tone="info">Portal / bloque / API</Badge></CardHeader>
        <CardContent className="grid gap-2">
          {(usage?.channelMix ?? []).map((item) => (
            <BarRow key={item.label} label={item.label} value={item.count} max={Math.max(...(usage?.channelMix ?? []).map((channel) => channel.count), 1)} detail={`Subtotal $${item.subtotal.toFixed(2)}`} />
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Consumo en tiempo real por cliente</CardTitle><Badge tone="ok">{selectedClient?.legalName ?? "Seleccion"}</Badge></CardHeader>
        <CardContent className="grid gap-4">
          <Field label="Cliente a monitorear">
            <Select value={selectedClient?.id ?? ""} onChange={(event) => onSelect(event.target.value)}>
              {clients.map((client) => <option key={client.id} value={client.id}>{client.legalName}</option>)}
            </Select>
          </Field>
          <div className="grid gap-3 lg:grid-cols-4">
            <Info title="Basicos" text={`${selectedUsage?.basicReports ?? 0} consultas`} tone="info" />
            <Info title="Panorama" text={`${selectedUsage?.completeReports ?? 0} consultas`} tone="warn" />
            <Info title="API" text={`${selectedUsage?.apiCalls ?? 0} llamadas`} tone="neutral" />
            <Info title="Decision Credits" text={`${selectedClient?.creditsBalance ?? 0} disponibles`} tone={(selectedClient?.creditsBalance ?? 0) <= 0 ? "danger" : "ok"} />
          </div>
          <div className="grid gap-2">
            {clients.map((client) => (
              <BarRow
                key={client.id}
                label={client.legalName}
                value={client.usage.basicReports + client.usage.completeReports + client.usage.apiCalls}
                max={clientConsumptionMax}
                detail={`${client.mode} / $${client.usage.estimatedSubtotal.toFixed(2)} subtotal / ${client.creditsBalance} credits`}
              />
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Consumo por cliente</CardTitle><Badge tone="info">Consultas + API</Badge></CardHeader>
        <CardContent className="grid gap-2">
          {(usage?.byClient ?? []).map((client) => <BarRow key={client.clientId} label={client.legalName} value={client.queries} max={Math.max(...(usage?.byClient ?? []).map((item) => item.queries), 1)} detail={`Subtotal $${client.subtotal.toFixed(2)} / estado ${client.state}`} />)}
        </CardContent>
      </Card>
    </div>
  );
}

function Facturacion({
  clients,
  selectedClient,
  onSelect,
  onDispatch,
  dispatching
}: {
  clients: AdminClient[];
  selectedClient?: AdminClient;
  onSelect: (id: string) => void;
  onDispatch: (clientId: string, channel: "email" | "provider_api", cutoffPeriod: string) => void;
  dispatching: boolean;
}) {
  const [cutoffPeriod, setCutoffPeriod] = useState("2026-05");
  const invoice = selectedClient?.invoicePreview;
  const usage = selectedClient?.usage;
  const appliedTariffs = [
    ...(selectedClient?.queries ?? []).map((query) => ({
      id: query.id,
      label: `${query.product} / ${query.channel}`,
      detail: `${query.tariffLabel ?? query.tariff} / $${query.estimatedValue.toFixed(2)} / ${query.creditApplied ? "con credito" : "sin credito"}`
    })),
    ...(selectedClient?.batchQueries ?? []).flatMap((batch) =>
      (batch.tariffBreakdown ?? []).map((item) => ({
        id: `${batch.id}-${item.bucket}-${item.tariffTier}`,
        label: `Bloque ${batch.rowsProcessed.toLocaleString()} registros`,
        detail: `${item.tariffLabel} / ${item.tariffTier} / ${item.rows.toLocaleString()} filas / $${item.subtotal.toFixed(2)}`
      }))
    )
  ].slice(0, 8);
  const lastDispatch = selectedClient?.outbox.find((item) => item.type?.includes("invoice"));

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader><CardTitle>Facturacion y tarifas</CardTitle><Badge tone="ok">Postpago por cliente</Badge></CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-3 lg:grid-cols-[1fr_220px]">
            <Field label="Empresa o cliente">
              <Select value={selectedClient?.id ?? ""} onChange={(event) => onSelect(event.target.value)}>
                {clients.map((client) => <option key={client.id} value={client.id}>{client.legalName}</option>)}
              </Select>
            </Field>
            <Field label="Fecha de corte">
              <Input type="month" value={cutoffPeriod} onChange={(event) => setCutoffPeriod(event.target.value)} />
            </Field>
          </div>
          <div className="grid gap-3 lg:grid-cols-4">
            <Info title="Subtotal" text={`$${(invoice?.subtotal ?? 0).toFixed(2)} / corte ${cutoffPeriod}`} tone="neutral" />
            <Info title="IVA estimado" text={`$${(invoice?.tax ?? 0).toFixed(2)}`} tone="warn" />
            <Info title="Total postpago" text={`$${(invoice?.total ?? 0).toFixed(2)}`} tone="ok" />
            <Info title="Decision Credits" text={`${selectedClient?.creditsBalance ?? 0} disponibles`} tone={(selectedClient?.creditsBalance ?? 0) <= 0 ? "danger" : "info"} />
          </div>
          <div className="grid gap-3 lg:grid-cols-3">
            <Info title="Con credito" text={`${usage?.dataPartnerCreditQueries ?? 0} consultas / $${(usage?.dataPartnerCreditSubtotal ?? 0).toFixed(2)}`} tone="ok" />
            <Info title="Exceso Cliente Normal" text={`${usage?.excessNormalQueries ?? 0} consultas / $${(usage?.excessNormalSubtotal ?? 0).toFixed(2)}`} tone="warn" />
            <Info title="Cliente Normal" text={`${usage?.clienteNormalQueries ?? 0} consultas / $${(usage?.clienteNormalSubtotal ?? 0).toFixed(2)}`} tone="neutral" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" disabled={!selectedClient || dispatching} onClick={() => selectedClient && onDispatch(selectedClient.id, "email", cutoffPeriod)}>Aprobar y enviar por correo</Button>
            <Button disabled={!selectedClient || dispatching} onClick={() => selectedClient && onDispatch(selectedClient.id, "provider_api", cutoffPeriod)}>Aprobar y enviar API proveedor/SRI</Button>
          </div>
          {lastDispatch ? <Info title="Ultimo despacho" text={`${lastDispatch.subject} / ${lastDispatch.status} / ${lastDispatch.createdAt.slice(0, 19).replace("T", " ")}`} tone="info" /> : null}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Tarifas aplicadas</CardTitle><Badge tone="info">{appliedTariffs.length} movimientos</Badge></CardHeader>
        <CardContent className="grid gap-2">
          {appliedTariffs.map((item) => <EventRow key={item.id} title={item.label} detail={item.detail} status="rated" date={new Date().toISOString()} />)}
          {appliedTariffs.length === 0 ? <Info title="Sin movimientos" text="Cuando el cliente consulte o simule bloques, la tarifa aplicada aparecera aqui." tone="warn" /> : null}
        </CardContent>
      </Card>
    </div>
  );
}

function Auditoria({ demoState, clients, selectedClient }: { demoState?: DemoState; clients: AdminClient[]; selectedClient?: AdminClient }) {
  const [clientFilter, setClientFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const eventTypes = Array.from(new Set((demoState?.auditLog ?? []).map((event) => event.type)));
  const filteredEvents = (demoState?.auditLog ?? []).filter((event) => {
    const eventDate = event.createdAt.slice(0, 10);
    if (clientFilter !== "all" && event.clientId !== clientFilter) return false;
    if (typeFilter !== "all" && event.type !== typeFilter) return false;
    if (fromDate && eventDate < fromDate) return false;
    if (toDate && eventDate > toDate) return false;
    return true;
  });
  const csvHref = buildAuditCsvHref(filteredEvents);

  return (
    <Card>
      <CardHeader><CardTitle>Auditoria BAC y operativa</CardTitle><Badge tone="info">{filteredEvents.length} eventos</Badge></CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-3 lg:grid-cols-5">
          <Field label="Cliente">
            <Select value={clientFilter} onChange={(event) => setClientFilter(event.target.value)}>
              <option value="all">Todos los clientes</option>
              {clients.map((client) => <option key={client.id} value={client.id}>{client.legalName}</option>)}
            </Select>
          </Field>
          <Field label="Tipo">
            <Select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
              <option value="all">Todos</option>
              {eventTypes.map((type) => <option key={type} value={type}>{type}</option>)}
            </Select>
          </Field>
          <Field label="Desde"><Input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} /></Field>
          <Field label="Hasta"><Input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} /></Field>
          <div className="flex items-end">
            <a className="inline-flex h-10 w-full items-center justify-center rounded-md border border-white/15 bg-white/[0.04] px-4 text-sm font-bold text-foreground hover:border-primary/60" href={csvHref} download="auditoria-decision-data.csv">Descargar CSV</a>
          </div>
        </div>
        {selectedClient ? <Info title="Cliente activo" text={`${selectedClient.legalName} / ${selectedClient.mode} / ${selectedClient.statusLabel}`} tone="info" /> : null}
        <div className="grid gap-2">
          {filteredEvents.map((event) => <EventRow key={event.id} title={`${event.clientName} / ${event.actor}`} detail={`${event.type} - ${event.detail}${event.tariffLabel ? ` - ${event.tariffLabel}` : ""}${event.estimatedValue ? ` - $${event.estimatedValue.toFixed(2)}` : ""}`} status={event.status} date={event.createdAt} />)}
          {filteredEvents.length === 0 ? <Info title="Sin eventos" text="Ajusta los filtros o ejecuta aprobaciones, cargas y consultas para generar trazabilidad." tone="warn" /> : null}
        </div>
      </CardContent>
    </Card>
  );
}

function buildAuditCsvHref(events: AdminAuditEvent[]) {
  const header = ["fecha", "cliente", "actor", "tipo", "canal", "producto", "tarifa", "valor", "estado", "detalle"];
  const rows = events.map((event) => [
    event.createdAt,
    event.clientName,
    event.actor,
    event.type,
    event.channel,
    event.product ?? "",
    event.tariffLabel ?? event.tariff ?? "",
    event.estimatedValue?.toFixed(2) ?? "",
    event.status,
    event.detail
  ]);
  const csv = [header, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\n");
  return `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
}

function escapeCsv(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

function Notificaciones({ demoState }: { demoState?: DemoState }) {
  return (
    <Card>
      <CardHeader><CardTitle>Notificaciones globales</CardTitle><Badge tone="ok">{demoState?.notifications.length ?? 0} mensajes</Badge></CardHeader>
      <CardContent className="grid gap-2">
        {(demoState?.notifications ?? []).map((email) => <EventRow key={email.id} title={`${email.clientName} / ${email.to}`} detail={`${email.subject}${email.body ? ` - ${email.body}` : ""}`} status={email.status} date={email.createdAt} />)}
      </CardContent>
    </Card>
  );
}

function Configuracion({ demoState, onUpdate, updating }: { demoState?: DemoState; onUpdate: (body: { emailProvider?: string; devMonitorExternal?: boolean; sbInhabilitationIncludedInPanorama?: boolean; allowPricingAutomation?: boolean }) => void; updating: boolean }) {
  const settings = demoState?.settings;

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card>
        <CardHeader><CardTitle>Parametros protegidos</CardTitle><Badge tone="danger">No automatizar</Badge></CardHeader>
        <CardContent className="grid gap-3">
          <Info title="Facturacion" text={settings?.billingMode ?? "monthly_postpaid"} tone="ok" />
          <Info title="Umbral de calidad" text={`${Math.round((settings?.qualityThreshold ?? 0.95) * 100)}% minimo`} tone="warn" />
          <Info title="Pricing" text="Tarifas, excepciones, cambios comerciales o regulatorios se consultan con Mateo." tone="danger" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Operativo sandbox</CardTitle><Badge tone="info">Editable</Badge></CardHeader>
        <CardContent className="grid gap-3">
          <Info title="Proveedor email" text={settings?.emailProvider ?? "simulated_outbox"} tone="neutral" />
          <label className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] p-3 text-sm">
            <span>Workbench externo</span>
            <input type="checkbox" checked={settings?.devMonitorExternal ?? true} disabled={updating} onChange={(event) => onUpdate({ devMonitorExternal: event.target.checked })} />
          </label>
          <label className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] p-3 text-sm">
            <span>Inhabilidad SB incluida en Panorama completo</span>
            <input type="checkbox" checked={settings?.sbInhabilitationIncludedInPanorama ?? true} disabled={updating} onChange={(event) => onUpdate({ sbInhabilitationIncludedInPanorama: event.target.checked })} />
          </label>
          <Button disabled={updating} onClick={() => onUpdate({ emailProvider: "simulated_outbox" })}><Settings className="size-4" /> Guardar configuracion</Button>
        </CardContent>
      </Card>
    </div>
  );
}

function LineChart({ data }: { data: Array<{ label: string; queries: number; amount: number }> }) {
  const safeData = data.length > 0 ? data : [{ label: "May", queries: 0, amount: 0 }];
  const max = Math.max(...safeData.map((item) => item.queries), 1);
  const points = safeData.map((item, index) => ({
    x: 48 + index * (580 / Math.max(safeData.length - 1, 1)),
    y: 170 - (item.queries / max) * 120
  }));
  const path = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");

  return (
    <div className="rounded-lg border border-white/10 bg-black/20 p-4">
      <svg viewBox="0 0 680 220" role="img" aria-label="Grafico de consumo global" className="h-64 w-full">
        <path d={path} fill="none" stroke="#f5a623" strokeWidth="4" />
        {points.map((point, index) => <circle key={safeData[index].label} cx={point.x} cy={point.y} r="6" fill="#ff6b2c" />)}
        {safeData.map((item, index) => <text key={item.label} x={points[index].x - 18} y="204" fill="#9fb0cc" fontSize="13">{item.label}</text>)}
        <text x="48" y="28" fill="#9fb0cc" fontSize="13">{max} consultas</text>
      </svg>
    </div>
  );
}

function BarRow({ label, value, max, detail }: { label: string; value: number; max: number; detail?: string }) {
  const width = Math.max(4, Math.round((value / Math.max(max, 1)) * 100));
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
      <div className="mb-2 flex items-center justify-between gap-3 text-sm"><b>{label}</b><span className="text-muted">{value}</span></div>
      <div className="h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-[#ff6b2c] to-[#f5a623]" style={{ width: `${width}%` }} /></div>
      {detail ? <p className="mt-2 text-xs text-muted">{detail}</p> : null}
    </div>
  );
}

function EventRow({ title, detail, status, date }: { title: string; detail: string; status: string; date: string }) {
  return (
    <div className="grid gap-2 rounded-lg border border-white/10 bg-white/[0.03] p-3 text-sm lg:grid-cols-[180px_1fr_150px]">
      <span className="text-muted">{date.slice(0, 19).replace("T", " ")}</span>
      <div><b>{title}</b><p className="mt-1 text-xs leading-5 text-muted">{detail}</p></div>
      <Badge tone={status.includes("approved") || status.includes("accepted") || status.includes("completed") || status.includes("processed") ? "ok" : status.includes("blocked") || status.includes("rejected") ? "danger" : "warn"}>{status}</Badge>
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
