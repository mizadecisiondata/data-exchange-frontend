"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { Send, X } from "lucide-react";
import { useState } from "react";
import { Button, Input } from "@/components/ui";
import { cn } from "@/lib/utils";

type ChatMessage = {
  id: string;
  sender: "bot" | "user";
  text: string;
};

const advisorEmail = "servicioalcliente@decisiondata.ec";
const advisorWhatsapp = "+593 98 752 1029";
const advisorWhatsappUrl = "https://wa.me/593987521029";

const initialMessages: ChatMessage[] = [
  {
    id: "welcome",
    sender: "bot",
    text: "Hola, soy el asistente de Decision Data. Puedo guiarte con registro, documentos, cargas, consultas, API, facturacion o auditoria."
  },
  {
    id: "handoff",
    sender: "bot",
    text: "Si necesitas soporte humano, puedo redirigirte con un asesor."
  }
];

const quickTopics = ["Registro", "Documentos", "Cargas", "Consultas", "API", "Facturacion", "Auditoria", "Asesor"];

export function HelpBot() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const context = pathname.startsWith("/admin") ? "admin" : "client";

  function recordInteraction(event: string, payload: Record<string, string>) {
    const detail = { event, context, path: pathname, ...payload, at: new Date().toISOString() };
    window.dispatchEvent(new CustomEvent("decision-data-helpbot", { detail }));
    try {
      const stored = JSON.parse(localStorage.getItem("decision-data-helpbot-events") ?? "[]") as unknown[];
      localStorage.setItem("decision-data-helpbot-events", JSON.stringify([detail, ...stored].slice(0, 30)));
    } catch {
      // Analytics persistence is best-effort until the backend endpoint exists.
    }
  }

  function answerFor(text: string) {
    const normalized = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const adminPrefix = context === "admin"
      ? "En el portal admin, "
      : "En el portal cliente, ";

    if (/(asesor|humano|whatsapp|soporte|correo|contacto)/.test(normalized)) {
      return `Te redirijo a un asesor. Correo: ${advisorEmail}. WhatsApp: ${advisorWhatsapp}.`;
    }
    if (/(registro|autorregistro|alta|usuario|clave|password|contrasena|ingreso|login)/.test(normalized)) {
      return `${adminPrefix}el acceso inicia con login. Si el cliente no tiene usuario, usa autorregistro; luego administracion revisa documentos y aprueba accesos.`;
    }
    if (/(document|contrato|nda|habilitante|aprobacion|pendiente)/.test(normalized)) {
      return `${adminPrefix}el modulo Documentos concentra contratos descargables, carga de soportes firmados y revision documental. Productivo queda bloqueado hasta aprobacion completa.`;
    }
    if (/(carga|ingesta|bloque|csv|calidad|duplicado)/.test(normalized)) {
      return `${adminPrefix}la carga usa bloques de informacion, umbral minimo 95%, y descarta duplicados sin error ni Decision Credits.`;
    }
    if (/(consulta individual|panorama|reporte|cedula|ruc|codigo sb|inhabilitado)/.test(normalized)) {
      return `${adminPrefix}las consultas se hacen por cedula, RUC o codigo SB. Hay reporte basico y Panorama completo; Panorama incluye indicador de inhabilidad SB.`;
    }
    if (/(api|endpoint|integracion|token|key|desarrollador)/.test(normalized)) {
      return `${adminPrefix}el modulo API permite simular consumo masivo, revisar endpoints y proyectar facturacion por volumen mensual consolidado.`;
    }
    if (/(factura|facturacion|tarifa|precio|decision credit|credito|creditos|postpago)/.test(normalized)) {
      return `${adminPrefix}facturacion es mensual postpago. Las tarifas se consolidan por volumen global del mes, canal, producto, Decision Credits y exceso a Cliente Normal.`;
    }
    if (/(auditoria|bac|consentimiento|ip|canal|trazabilidad|notificacion)/.test(normalized)) {
      return `${adminPrefix}toda consulta registra BAC, consentimiento, usuario, canal, IP, producto, tarifa, valor estimado y estado. Auditoria y notificaciones lo muestran para control.`;
    }
    if (/(subusuario|permiso|rol|bloquear|desbloquear|modulo)/.test(normalized)) {
      return `${adminPrefix}los subusuarios se gestionan con permisos por modulo. El superadministrador puede habilitar o bloquear accesos segun el rol.`;
    }

    return "Puedo ayudarte con autorregistro, documentos, cargas, consulta individual, consulta por bloque, API, facturacion, auditoria, notificaciones, permisos o subusuarios. Para temas sensibles te conecto con un asesor.";
  }

  function send(text: string) {
    const value = text.trim();
    if (!value) return;
    const userMessage: ChatMessage = { id: `user-${Date.now()}`, sender: "user", text: value };
    const botMessage: ChatMessage = { id: `bot-${Date.now()}`, sender: "bot", text: answerFor(value) };
    setMessages((current) => [...current, userMessage, botMessage]);
    setDraft("");
    recordInteraction("message", { text: value });
  }

  return (
    <div className={cn("dd-helpbot", open && "is-open")}>
      <div className="dd-helpbot__panel" aria-hidden={!open}>
        <header className="dd-helpbot__header">
          <Image src="/brand/dd-virtual-assistant-transparent.png" alt="" width={48} height={56} />
          <div>
            <b>Decision Data Bot</b>
            <span>{context === "admin" ? "Ayuda para administracion" : "Ayuda para clientes"}</span>
          </div>
          <button type="button" className="dd-helpbot__close" onClick={() => setOpen(false)} aria-label="Cerrar asistente">
            <X className="size-4" />
          </button>
        </header>
        <div className="dd-helpbot__messages">
          {messages.map((message) => (
            <div key={message.id} className={`dd-helpbot__message dd-helpbot__message--${message.sender}`}>
              {message.text}
            </div>
          ))}
        </div>
        <div className="dd-helpbot__topics">
          {quickTopics.map((topic) => (
            <button key={topic} type="button" onClick={() => send(topic)}>{topic}</button>
          ))}
        </div>
        <form
          className="dd-helpbot__form"
          onSubmit={(event) => {
            event.preventDefault();
            send(draft);
          }}
        >
          <Input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Escribe tu duda..." />
          <Button type="submit" variant="primary" size="sm" aria-label="Enviar pregunta">
            <Send className="size-4" />
          </Button>
        </form>
        <footer className="dd-helpbot__footer">
          <a href={`mailto:${advisorEmail}`}>{advisorEmail}</a>
          <a href={advisorWhatsappUrl} target="_blank" rel="noopener">{advisorWhatsapp}</a>
        </footer>
      </div>
      <button
        type="button"
        className="dd-helpbot__launcher"
        onClick={() => {
          setOpen((value) => !value);
          recordInteraction("toggle", { state: open ? "closed" : "open" });
        }}
        aria-expanded={open}
        aria-label="Abrir asistente Decision Data"
      >
        <Image src="/brand/dd-virtual-assistant-transparent.png" alt="" width={78} height={100} priority />
        <span>Ayuda</span>
      </button>
    </div>
  );
}
