"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { BrandMark } from "@/components/brand";
import { Badge, Button } from "@/components/ui";
import { cn } from "@/lib/utils";

export type NavItem = {
  id: string;
  label: string;
  icon: LucideIcon;
  locked?: boolean;
};

export function AppShell({
  label,
  title,
  subtitle,
  nav,
  active,
  onSelect,
  children,
  aside,
  portalLinks = true
}: {
  label: string;
  title: string;
  subtitle: string;
  nav: NavItem[];
  active: string;
  onSelect: (id: string) => void;
  children: React.ReactNode;
  aside?: React.ReactNode;
  portalLinks?: boolean;
}) {
  const visibleNav = nav.slice(0, 7);

  return (
    <div className="dd-shell">
      <aside className="dd-sidebar flex flex-col gap-5 p-5">
        <BrandMark label={label} />
        <nav className="flex flex-col gap-2">
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelect(item.id)}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition",
                  active === item.id
                    ? "border-primary/40 bg-primary/10 text-foreground"
                    : "border-transparent text-slate-300 hover:border-white/10 hover:bg-white/5",
                  item.locked && "text-slate-500"
                )}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <Icon className="size-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </span>
                {item.locked ? <Badge tone="warn">lock</Badge> : null}
              </button>
            );
          })}
        </nav>
        <div className="mt-auto rounded-lg border border-white/10 bg-white/[0.03] p-3 text-xs leading-5 text-muted">{aside}</div>
      </aside>
      <main className="min-w-0 p-5 lg:p-7">
        <div className="dd-web-nav mb-5">
          <div className="dd-web-nav__brand">
            <span>Data Exchange</span>
            <b>{label}</b>
          </div>
          <nav className="dd-web-nav__links" aria-label="Navegacion principal de plataforma">
            {visibleNav.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelect(item.id)}
                className={cn(active === item.id && "is-active")}
              >
                {item.label}
              </button>
            ))}
          </nav>
          {portalLinks ? (
            <div className="dd-web-nav__actions">
              <Link href="/client">Cliente</Link>
              <Link href="/admin">Admin</Link>
            </div>
          ) : null}
        </div>
        <header className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.16em] text-primary">Data Exchange</div>
            <h1 className="mt-1 text-2xl font-black text-foreground lg:text-3xl">{title}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">{subtitle}</p>
          </div>
          {portalLinks ? (
            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <Link href="/client">Cliente</Link>
              </Button>
              <Button asChild>
                <Link href="/admin">Admin</Link>
              </Button>
              <Button asChild>
                <Link href="/journey">Journey</Link>
              </Button>
            </div>
          ) : null}
        </header>
        {children}
      </main>
    </div>
  );
}
