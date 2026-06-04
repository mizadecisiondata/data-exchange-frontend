"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useRef } from "react";
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
  const navRef = useRef<HTMLDivElement>(null);

  function scrollNav(direction: -1 | 1) {
    navRef.current?.scrollBy({ left: direction * 280, behavior: "smooth" });
  }

  return (
    <div className="dd-shell">
      <main className="min-w-0 p-5 lg:p-7">
        <div className="dd-web-nav mb-5">
          <BrandMark label={label} />
          <button type="button" className="dd-web-nav__scroll" onClick={() => scrollNav(-1)} aria-label="Ver modulos anteriores">
            <ChevronLeft className="size-4" />
          </button>
          <nav className="dd-web-nav__links" aria-label="Navegacion principal de plataforma">
            <div ref={navRef} className="dd-web-nav__track">
              {nav.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelect(item.id)}
                    className={cn(active === item.id && "is-active", item.locked && "is-locked")}
                  >
                    <Icon className="size-4 shrink-0" />
                    <span>{item.label}</span>
                    {item.locked ? <Badge tone="warn">lock</Badge> : null}
                  </button>
                );
              })}
            </div>
          </nav>
          <button type="button" className="dd-web-nav__scroll" onClick={() => scrollNav(1)} aria-label="Ver mas modulos">
            <ChevronRight className="size-4" />
          </button>
          {aside ? <div className="dd-web-nav__context">{aside}</div> : null}
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
