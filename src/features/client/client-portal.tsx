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
import { ReportPreview } from "@/components/report-preview";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Field, Input, MetricCard, Select } from "@/components/ui";
import { backendGet, backendPost, type DemoState, type QueryAudit, type SubUser } from "@/lib/backend-api";
import {
  apiEndpoints,
  bacEvents,
  commercialModes,
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
  const [previewSubUserId, setPreviewSubUserId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const demoState = useQuery({
    queryKey: ["demo-state"],
    queryFn: () => backendGet<DemoState>("/api/v1/demo/state"),
    refetchInterval: 4_000
  });
  const isPending = state.matches("pendingPortal");
  const isApproved = state.matches("approvedPortal") || demoState.data?.client.productionAccess === true;
  const isPortal = isPending || isApproved;
  const uppy = useMemo(() => new Uppy({ restrictions: { maxNumberOfFiles: 3 } }), []);
  const previewSubUser = demoState.data?.subUsers.find((item) => item.id === previewSubUserId && item.status === "active");
  const previewAllowed = new Set(previewSubUser?.allowedModules ?? []);
  const nav = navBase.map((item) => ({
    ...item,
    locked: (!isApproved && approvedOnly.has(item.id)) || (Boolean(previewSubUser) && !previewAllowed.has(item.id))
  }));
  const refreshState = () => queryClient.invalidateQueries({ queryKey: ["demo-state"] });
  const ingestion = useMutation({
    mutationFn: () => backendPost<{ state: DemoState }>("/api/v1/ingestion/information-blocks"),
    onSuccess: () => {
      toast.success("Bloque de informacion procesado en sandbox.");
      refreshState();
    }
  });
  const individualQuery = useMutation({
    mutationFn: () => backendPost<{ state: DemoState }>("/api/v1/queries", {
      product: queryProduct,
      channel: "portal",
      identifierType: "cedula",
      identifier: "0923048581"
    }),
    onSuccess: () => {
      toast.success("Consulta registrada con BAC y consentimiento.");
      refreshState();
    }
  });
  const batchQuery = useMutation({
    mutationFn: () => backendPost<{ state: DemoState }>("/api/v1/batch-queries"),
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
      user: "api-key:megadatos-demo"
    }),
    onSuccess: () => {
      toast.success("Consumo API simulado y facturable.");
      refreshState();
    }
  });
  const createSubUser = useMutation({
    mutationFn: (body: { name: string; email: string; role: string; allowedModules: string[] }) => backendPost<{ state: DemoState }>("/api/v1/client/subusers", body),
    onSuccess: () => {
      toast.success("Subusuario creado con credenciales temporales simuladas.");
      refreshState();
    }
  });
  const updateSubUser = useMutation({
    mutationFn: (body: { id: string; allowedModules?: string[]; active?: boolean }) => backendPost<{ state: DemoState }>(`/api/v1/client/subusers/${body.id}`, body),
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
                    <p className="mt-2 text-sm text-muted">Cliente cero: MEGADATOS S.A. / Data Partner Founding sandbox.</p>
                  </div>
                  <Field label="Correo corporativo">
                    <Input defaultValue="operaciones@megadatos.demo" />
                  </Field>
                  <Field label="Contrasena">
                    <Input type="password" defaultValue="demo1234" />
                  </Field>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="primary" onClick={() => send({ type: demoState.data?.client.productionAccess ? "APPROVED" : "PENDING" })}>Ingresar cliente cero</Button>
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
      title="Portal cliente / Data Partner"
      subtitle={previewSubUser ? `Vista previa como ${previewSubUser.name}: solo modulos permitidos por el superadministrador.` : "Cockpit con estado de cuenta, documentos, ingesta, consultas, API, facturacion postpago y auditoria BAC."}
      nav={nav}
      active={active}
      onSelect={selectSection}
      portalLinks={false}
      aside={
        <>
          <b className="text-foreground">{isApproved ? "Cliente aprobado" : "Cliente pendiente"}</b>
          <p className="mt-1">{previewSubUser ? `Preview subusuario: ${previewSubUser.email}` : isApproved ? "Superadministrador cliente cero sandbox." : "Solo estado, documentos y carga no productiva."}</p>
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
      {active === "inicio" && <Inicio isPending={!isApproved} demoState={demoState.data} />}
      {active === "estado" && <Estado demoState={demoState.data} />}
      {active === "documentos" && <Documentos />}
      {active === "subusuarios" && <LockedAware enabled={isApproved}><Subusuarios demoState={demoState.data} onCreate={(body) => createSubUser.mutate(body)} creating={createSubUser.isPending} onUpdate={(body) => updateSubUser.mutate(body)} updating={updateSubUser.isPending} previewSubUserId={previewSubUserId} onPreview={(id) => { setPreviewSubUserId(id); if (id) setActive("inicio"); }} /></LockedAware>}
      {active === "carga" && <Carga uppy={uppy} isPending={!isApproved} demoState={demoState.data} onSimulate={() => ingestion.mutate()} loading={ingestion.isPending} />}
      {active === "consulta-individual" && <LockedAware enabled={isApproved}><ConsultaIndividual product={queryProduct} onProductChange={setQueryProduct} onRun={() => individualQuery.mutate()} loading={individualQuery.isPending} latest={demoState.data?.queries[0]} /></LockedAware>}
      {active === "consulta-bloque" && <LockedAware enabled={isApproved}><ConsultaBloque demoState={demoState.data} onRun={() => batchQuery.mutate()} loading={batchQuery.isPending} /></LockedAware>}
      {active === "api" && <LockedAware enabled={isApproved}><Api onRun={() => apiQuery.mutate()} loading={apiQuery.isPending} /></LockedAware>}
      {active === "facturacion" && <LockedAware enabled={isApproved}><Facturacion demoState={demoState.data} /></LockedAware>}
      {active === "auditoria" && <LockedAware enabled={isApproved}><Auditoria events={demoState.data?.queries ?? bacEvents} /></LockedAware>}
      {active === "notificaciones" && <Notificaciones demoState={demoState.data} />}
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
  return (
    <div className="grid gap-4">
      <div className="grid gap-4 lg:grid-cols-3">
        <MetricCard label="Consultas del mes" value={String((demoState?.usage.basicReports ?? 0) + (demoState?.usage.completeReports ?? 0))} tone={isPending ? "warn" : "ok"} />
        <MetricCard label="Creditos disponibles" value={String(demoState?.client.creditsBalance ?? 0)} tone="ok" />
        <MetricCard label="Factura estimada" value={`$${(demoState?.invoicePreview.total ?? 0).toFixed(2)}`} tone="info" />
      </div>
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
      <div className="grid gap-4">
        <ReportPreview />
      </div>
    </div>
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

function Carga({ uppy, isPending, demoState, onSimulate, loading }: { uppy: Uppy; isPending: boolean; demoState?: DemoState; onSimulate: () => void; loading: boolean }) {
  const latest = demoState?.uploads[0];

  return (
    <div className="grid gap-4 xl:grid-cols-[.85fr_1.15fr]">
      <Card>
        <CardHeader><CardTitle>Carga de informacion</CardTitle><Badge tone={isPending ? "warn" : "ok"}>{isPending ? "Sandbox" : "Productivo"}</Badge></CardHeader>
        <CardContent className="grid gap-3 text-sm text-muted">
          <p>Regla: bloques de informacion, umbral minimo 95%, duplicados descartados sin error y sin Decision Credits.</p>
          <p>{isPending ? "Como cliente pendiente, esta carga no genera consumo ni facturacion." : "Como cliente aprobado, queda lista para control productivo y BAC."}</p>
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <a href="/api/backend/api/v1/templates/information-block.csv" download><Download className="size-4" /> Descargar template CSV</a>
            </Button>
            <Button variant="primary" onClick={onSimulate} disabled={loading}><UploadCloud className="size-4" /> Simular carga MEGADATOS</Button>
          </div>
          {latest ? (
            <div className="grid gap-2 rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <b className="text-foreground">Ultima carga: {latest.id}</b>
              <span>Filas recibidas: {latest.rowsReceived} / aceptadas: {latest.acceptedRows} / duplicadas: {latest.duplicateRows} / errores: {latest.errorRows}</span>
              <span>Calidad: {Math.round(latest.qualityScore * 100)}% / creditos generados: {latest.creditsGenerated}</span>
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

function ConsultaIndividual({ product, onProductChange, onRun, loading, latest }: { product: string; onProductChange: (value: string) => void; onRun: () => void; loading: boolean; latest?: QueryAudit }) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card>
        <CardHeader><CardTitle>Consulta individual</CardTitle><Badge tone="warn">BAC obligatorio</Badge></CardHeader>
        <CardContent className="grid gap-3">
          <Field label="Cedula, RUC o codigo SB"><Input defaultValue="0923048581" /></Field>
          <Field label="Producto">
            <Select value={product} onChange={(event) => onProductChange(event.target.value)}>
              <option value="complete_report">Reporte completo</option>
              <option value="basic_report">Reporte basico</option>
            </Select>
          </Field>
          <Info title="Valor estimado" text="Founding usa beneficios 1:1 en sandbox; si no hay creditos aplica exceso a Cliente Normal." tone="ok" />
          <Button variant="primary" onClick={onRun} disabled={loading}><Play className="size-4" /> Consultar con consentimiento</Button>
          {latest ? <Info title={`BAC ${latest.bac}`} text={`Producto ${latest.product}, canal ${latest.channel}, tarifa ${latest.tariff}, valor $${latest.estimatedValue.toFixed(2)}.`} tone="info" /> : null}
        </CardContent>
      </Card>
      <ReportHtmlViewer latest={latest} />
    </div>
  );
}

function ConsultaBloque({ demoState, onRun, loading }: { demoState?: DemoState; onRun: () => void; loading: boolean }) {
  const latest = demoState?.batchQueries[0];

  return (
    <Card>
      <CardHeader><CardTitle>Consulta por bloque</CardTitle><Badge tone="info">CSV sandbox</Badge></CardHeader>
      <CardContent className="grid gap-3">
        <p className="text-sm text-muted">Carga un bloque de identificadores. Cada fila registra BAC, consentimiento, usuario, canal, IP, producto, tarifa, valor estimado y estado.</p>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <a href="/api/backend/api/v1/templates/batch-query.csv" download><Download className="size-4" /> Descargar template CSV</a>
          </Button>
          <Button variant="primary" onClick={onRun} disabled={loading}><Play className="size-4" /> Procesar bloque demo</Button>
        </div>
        {latest ? <Info title={`Bloque ${latest.id}`} text={`${latest.rowsProcessed}/${latest.rowsReceived} filas procesadas. Subtotal estimado $${latest.estimatedSubtotal.toFixed(2)}.`} tone="ok" /> : null}
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

  return (
    <Card>
      <CardHeader><CardTitle>Facturacion mensual postpago</CardTitle><Badge tone="ok">Dinamica sandbox</Badge></CardHeader>
      <CardContent className="grid gap-3 lg:grid-cols-4">
        <MetricCard label="Basicos" value={String(demoState?.usage.basicReports ?? 0)} tone="info" />
        <MetricCard label="Completos" value={String(demoState?.usage.completeReports ?? 0)} tone="warn" />
        <MetricCard label="API calls" value={String(demoState?.usage.apiCalls ?? 0)} tone="neutral" />
        <MetricCard label="Total estimado" value={`$${(invoice?.total ?? 0).toFixed(2)}`} tone="ok" />
        <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4 lg:col-span-4">
          <Badge tone="ok">Decision Credits</Badge>
          <p className="mt-3 text-sm leading-6 text-muted">
            Generados: {invoice?.creditsGenerated ?? 0}. Usados: {invoice?.creditsUsed ?? 0}. Saldo: {invoice?.creditsBalance ?? 0}. Modelo: postpago mensual.
          </p>
          <p className="mt-2 text-xs text-muted">{invoice?.note}</p>
        </div>
      </CardContent>
    </Card>
  );
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
  return (
    <div className="grid gap-3">
      <Info title="Observacion documental" text="Falta nombramiento actualizado del representante legal." tone="warn" />
      <Info title="Sandbox listo" text="La plantilla de carga no productiva esta disponible." tone="ok" />
      <Info title="Consulta bloqueada" text="Cuenta pendiente de aprobacion documental completa." tone="danger" />
      {demoState?.outbox.map((email) => <Info key={email.id} title={email.subject} text={`${email.to} - ${email.status}`} tone="info" />)}
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

function ValidatedField({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <Field label={label}>{children}</Field>
      {error ? <span className="text-xs text-red-200">{error}</span> : null}
    </div>
  );
}
