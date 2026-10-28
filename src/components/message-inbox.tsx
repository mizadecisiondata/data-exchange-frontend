"use client";

import { Mail, MailOpen, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input } from "@/components/ui";
import { cn } from "@/lib/utils";

export type MessageInboxItem = {
  id: string;
  from: string;
  to?: string;
  subject: string;
  preview: string;
  body?: string;
  createdAt: string;
  unread?: boolean;
  tag?: string;
  tone?: "neutral" | "warn" | "ok" | "danger" | "info";
};

export function MessageInbox({ title, messages }: { title: string; messages: MessageInboxItem[] }) {
  const [activeId, setActiveId] = useState(messages[0]?.id ?? "");
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const [query, setQuery] = useState("");
  const [readMap, setReadMap] = useState<Record<string, boolean>>(() => Object.fromEntries(messages.map((message) => [message.id, !message.unread])));
  const unreadCount = messages.filter((message) => !readMap[message.id]).length;
  const filteredMessages = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return messages.filter((message) => {
      const isRead = readMap[message.id];
      if (filter === "unread" && isRead) return false;
      if (filter === "read" && !isRead) return false;
      if (!normalizedQuery) return true;
      return [message.from, message.to, message.subject, message.preview, message.body, message.tag].filter(Boolean).join(" ").toLowerCase().includes(normalizedQuery);
    });
  }, [filter, messages, query, readMap]);
  const activeMessage = filteredMessages.find((message) => message.id === activeId) ?? filteredMessages[0] ?? messages[0];

  function setMessageRead(messageId: string, read: boolean) {
    setReadMap((current) => ({ ...current, [messageId]: read }));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <Badge tone={unreadCount > 0 ? "warn" : "ok"}>{unreadCount} no leidos</Badge>
      </CardHeader>
      <CardContent className="grid gap-4 xl:grid-cols-[360px_1fr]">
        <div className="grid gap-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <Input className="pl-9" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar mensajes" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Button size="sm" variant={filter === "all" ? "primary" : "default"} onClick={() => setFilter("all")}>Todos</Button>
            <Button size="sm" variant={filter === "unread" ? "primary" : "default"} onClick={() => setFilter("unread")}>No leidos</Button>
            <Button size="sm" variant={filter === "read" ? "primary" : "default"} onClick={() => setFilter("read")}>Leidos</Button>
          </div>
          <div className="max-h-[520px] overflow-auto rounded-lg border border-white/10">
            {filteredMessages.map((message) => {
              const isRead = readMap[message.id];
              return (
                <button
                  key={message.id}
                  type="button"
                  className={cn("grid w-full gap-2 border-b border-white/10 p-3 text-left text-sm last:border-b-0 hover:bg-white/[0.04]", activeMessage?.id === message.id && "bg-primary/10", !isRead && "bg-white/[0.035]")}
                  onClick={() => {
                    setActiveId(message.id);
                    setMessageRead(message.id, true);
                  }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className={cn("truncate", !isRead && "font-black text-foreground")}>{message.subject}</span>
                    {isRead ? <MailOpen className="size-4 shrink-0 text-muted" /> : <Mail className="size-4 shrink-0 text-primary" />}
                  </div>
                  <span className="truncate text-xs text-muted">{message.from} · {message.preview}</span>
                  <span className="text-[10px] uppercase tracking-[0.12em] text-muted">{message.createdAt.slice(0, 19).replace("T", " ")}</span>
                </button>
              );
            })}
            {filteredMessages.length === 0 ? <div className="p-4 text-sm text-muted">No hay mensajes para este filtro.</div> : null}
          </div>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
          {activeMessage ? (
            <div className="grid gap-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Badge tone={activeMessage.tone ?? "info"}>{activeMessage.tag ?? "Mensaje"}</Badge>
                  <h3 className="mt-3 text-xl font-black">{activeMessage.subject}</h3>
                  <p className="mt-2 text-sm text-muted">De {activeMessage.from}{activeMessage.to ? ` para ${activeMessage.to}` : ""}</p>
                </div>
                <Button size="sm" onClick={() => setMessageRead(activeMessage.id, Boolean(!readMap[activeMessage.id]))}>
                  {readMap[activeMessage.id] ? "Marcar no leido" : "Marcar leido"}
                </Button>
              </div>
              <div className="rounded-lg border border-white/10 bg-black/20 p-4 text-sm leading-6 text-muted">
                {activeMessage.body ?? activeMessage.preview}
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted">Selecciona un mensaje para ver el detalle.</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
