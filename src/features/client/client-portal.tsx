"use client";

import Uppy from "@uppy/core";
import Dashboard from "@uppy/react/dashboard";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMachine } from "@xstate/react";
import { createMachine } from "xstate";
import {
  Activity,
  BadgeDollarSign,
  Bell,
  Blocks,
  Braces,
  FileCheck2,
  Home,
  KeyRound,
  Lock,
  Search,
  ShieldCheck,
  UploadCloud,
  Users
} from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { AppShell, type NavItem } from "@/components/app-shell";
import { BackendStatusCard } from "@/components/backend-status";
import { ReportPreview } from "@/components/report-preview";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Field, Input, MetricCard, Select } from "@/components/ui";
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

export function ClientPortal() {
  const [state, send] = useMachine(clientMachine);
  const [active, setActive] = useState("inicio");
  const isPending = state.matches("pendingPortal");
  const isApproved = state.matches("approvedPortal");
  const isPortal = isPending || isApproved;
  const uppy = useMemo(() => new Uppy({ restrictions: { maxNumberOfFiles: 3 } }), []);
  const nav = navBase.map((item) => ({ ...item, locked: isPending && approvedOnly.has(item.id) }));
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
    if (isPending && approvedOnly.has(id)) {
      setActive("estado");
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
                    <p className="mt-2 text-sm text-muted">Puedes probar el journey como cliente pendiente o aprobado.</p>
                  </div>
                  <Field label="Correo corporativo">
                    <Input defaultValue="operaciones@megadatos.demo" />
                  </Field>
                  <Field label="Contrasena">
                    <Input type="password" defaultValue="demo1234" />
                  </Field>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="primary" onClick={() => send({ type: "APPROVED" })}>Ingresar aprobado</Button>
                    <Button onClick={() => send({ type: "PENDING" })}>Ver pendiente</Button>
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
      subtitle="Cockpit con estado de cuenta, documentos, ingesta, consultas, API, facturacion postpago y auditoria BAC."
      nav={nav}
      active={active}
      onSelect={selectSection}
      aside={
        <>
          <b className="text-foreground">{isPending ? "Cliente pendiente" : "Cliente aprobado"}</b>
          <p className="mt-1">{isPending ? "Solo estado, documentos y carga no productiva." : "Modulos abiertos segun modalidad demo."}</p>
          <Button className="mt-3 w-full" size="sm" onClick={() => send({ type: "LOGOUT" })}>Cerrar sesion</Button>
        </>
      }
    >
      {isPending ? (
        <div className="mb-4 rounded-lg border border-primary/30 bg-primary/10 p-3 text-sm text-amber-100">
          Cuenta pendiente: las funciones productivas quedan bloqueadas hasta aprobar documentos habilitantes. Puedes cargar informacion no productiva.
        </div>
      ) : null}
      {active === "inicio" && <Inicio isPending={isPending} />}
      {active === "estado" && <Estado />}
      {active === "documentos" && <Documentos />}
      {active === "subusuarios" && <LockedAware enabled={isApproved}><Subusuarios /></LockedAware>}
      {active === "carga" && <Carga uppy={uppy} isPending={isPending} />}
      {active === "consulta-individual" && <LockedAware enabled={isApproved}><ConsultaIndividual /></LockedAware>}
      {active === "consulta-bloque" && <LockedAware enabled={isApproved}><ConsultaBloque /></LockedAware>}
      {active === "api" && <LockedAware enabled={isApproved}><Api /></LockedAware>}
      {active === "facturacion" && <LockedAware enabled={isApproved}><Facturacion /></LockedAware>}
      {active === "auditoria" && <LockedAware enabled={isApproved}><Auditoria /></LockedAware>}
      {active === "notificaciones" && <Notificaciones />}
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

function Inicio({ isPending }: { isPending: boolean }) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-4 lg:grid-cols-3">
        <MetricCard label="Consultas productivas" value={isPending ? "0" : "128"} tone={isPending ? "warn" : "ok"} />
        <MetricCard label="Umbral calidad" value="95%" tone="ok" />
        <MetricCard label="Modelo facturacion" value="Postpago" tone="info" />
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

function Estado() {
  return (
    <Card>
      <CardHeader><CardTitle>Estado de cuenta</CardTitle><Badge tone="warn">Centro unico</Badge></CardHeader>
      <CardContent className="grid gap-3 lg:grid-cols-3">
        <Info title="Modalidad solicitada" text="Data Partner Founding pendiente de aprobacion admin." tone="warn" />
        <Info title="Documentos bloqueantes" text="RUC actualizado, nombramiento y cedula representante." tone="danger" />
        <Info title="Carga sandbox" text="Permitida para validar formato y diccionario." tone="ok" />
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

function Carga({ uppy, isPending }: { uppy: Uppy; isPending: boolean }) {
  return (
    <div className="grid gap-4 xl:grid-cols-[.85fr_1.15fr]">
      <Card>
        <CardHeader><CardTitle>Carga de informacion</CardTitle><Badge tone={isPending ? "warn" : "ok"}>{isPending ? "Sandbox" : "Productivo"}</Badge></CardHeader>
        <CardContent className="grid gap-3 text-sm text-muted">
          <p>Regla: bloques de informacion, umbral minimo 95%, duplicados descartados sin error y sin Decision Credits.</p>
          <p>{isPending ? "Como cliente pendiente, esta carga no genera consumo ni facturacion." : "Como cliente aprobado, queda lista para control productivo y BAC."}</p>
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

function ConsultaIndividual() {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card>
        <CardHeader><CardTitle>Consulta individual</CardTitle><Badge tone="warn">BAC obligatorio</Badge></CardHeader>
        <CardContent className="grid gap-3">
          <Field label="Cedula, RUC o codigo SB"><Input defaultValue="0923048581" /></Field>
          <Field label="Producto"><Select><option>Reporte completo</option><option>Reporte basico</option></Select></Field>
          <Info title="Valor estimado" text="Founding tramo ejemplo: $0.50. Toda consulta registra consentimiento, IP, canal, producto, tarifa y estado." tone="ok" />
          <Button variant="primary">Consultar con consentimiento</Button>
        </CardContent>
      </Card>
      <ReportPreview />
    </div>
  );
}

function ConsultaBloque() {
  return <Info title="Consulta por bloque" text="Prevalidacion de identificadores, consentimiento, producto, tarifa y BAC por cada fila." tone="info" />;
}

function Api() {
  return (
    <div className="grid gap-3">
      <Info title="API keys" text="Scopes, rotacion y vencimiento solo para clientes aprobados." tone="warn" />
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

function Facturacion() {
  return <Info title="Facturacion mensual postpago" text="Contributor 1:2 para reporte basico; Active y Founding 1:1 preferencial; exceso a tarifa Cliente Normal." tone="ok" />;
}

function Auditoria() {
  return (
    <Card>
      <CardHeader><CardTitle>Auditoria BAC</CardTitle><Badge tone="info">Append-only</Badge></CardHeader>
      <CardContent className="grid gap-3">
        <Info title="Contrato obligatorio" text="Cada consulta registra BAC, consentimiento, usuario, canal, IP, producto, tarifa, valor estimado y estado." tone="info" />
        <div className="overflow-hidden rounded-lg border border-white/10">
          {bacEvents.map((event) => (
            <div key={`${event.date}-${event.product}`} className="grid gap-2 border-b border-white/10 p-3 text-sm last:border-b-0 lg:grid-cols-[150px_1fr_110px_110px_100px]">
              <span className="text-muted">{event.date}</span>
              <span>{event.actor}</span>
              <span>{event.channel}</span>
              <span>{event.value}</span>
              <Badge tone="ok">{event.status}</Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function Subusuarios() {
  return <Info title="Subusuarios" text="Roles sugeridos: operador principal, analista de consultas, integrador API y facturacion." tone="info" />;
}

function Notificaciones() {
  return (
    <div className="grid gap-3">
      <Info title="Observacion documental" text="Falta nombramiento actualizado del representante legal." tone="warn" />
      <Info title="Sandbox listo" text="La plantilla de carga no productiva esta disponible." tone="ok" />
      <Info title="Consulta bloqueada" text="Cuenta pendiente de aprobacion documental completa." tone="danger" />
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
