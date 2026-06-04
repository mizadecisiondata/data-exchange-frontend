"use client";

import Link from "next/link";
import { ChevronDown, ChevronLeft, ChevronRight, PanelRightClose, PanelRightOpen } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useRef, useState } from "react";
import { BrandMark } from "@/components/brand";
import { Badge, Button } from "@/components/ui";
import { cn } from "@/lib/utils";

export type NavItem = {
  id: string;
  label: string;
  icon: LucideIcon;
  locked?: boolean;
};

export type NavGroup = {
  id: string;
  label: string;
  icon: LucideIcon;
  items: NavItem[];
};

export function AppShell({
  label,
  title,
  subtitle,
  nav,
  navGroups,
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
  navGroups?: NavGroup[];
  active: string;
  onSelect: (id: string) => void;
  children: React.ReactNode;
  aside?: React.ReactNode;
  portalLinks?: boolean;
}) {
  const navRef = useRef<HTMLDivElement>(null);
  const [compact, setCompact] = useState(false);
  const groups = navGroups ?? nav.map((item) => ({ id: item.id, label: item.label, icon: item.icon, items: [item] }));

  function scrollNav(direction: -1 | 1) {
    navRef.current?.scrollBy({ left: direction * 280, behavior: "smooth" });
  }

  function selectGroup(group: NavGroup) {
    const firstAvailable = group.items.find((item) => !item.locked) ?? group.items[0];
    if (firstAvailable) {
      onSelect(firstAvailable.id);
    }
  }

  return (
    <div className="dd-shell">
      <main className="min-w-0 p-5 lg:p-7">
        <div className={cn("dd-web-nav mb-5", compact && "is-compact")}>
          <BrandMark label={label} />
          <button type="button" className="dd-web-nav__scroll" onClick={() => scrollNav(-1)} aria-label="Ver modulos anteriores">
            <ChevronLeft className="size-4" />
          </button>
          <nav className="dd-web-nav__links" aria-label="Navegacion principal de plataforma">
            <div ref={navRef} className="dd-web-nav__track">
              {groups.map((group) => {
                const Icon = group.icon;
                const isGroupActive = group.items.some((item) => item.id === active);
                const groupLocked = group.items.every((item) => item.locked);
                if (group.items.length === 1) {
                  const item = group.items[0];
                  const ItemIcon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onSelect(item.id)}
                      className={cn("dd-nav-item", active === item.id && "is-active", item.locked && "is-locked")}
                    >
                      <ItemIcon className="size-4 shrink-0" />
                      <span>{item.label}</span>
                      {item.locked ? <Badge tone="warn">lock</Badge> : null}
                    </button>
                  );
                }

                return (
                  <div key={group.id} className="dd-nav-group">
                    <button
                      type="button"
                      onClick={() => selectGroup(group)}
                      className={cn("dd-nav-item dd-nav-group__trigger", isGroupActive && "is-active", groupLocked && "is-locked")}
                      aria-haspopup="menu"
                      aria-expanded={isGroupActive}
                    >
                      <Icon className="size-4 shrink-0" />
                      <span>{group.label}</span>
                      <ChevronDown className="size-3.5 shrink-0" />
                      {groupLocked ? <Badge tone="warn">lock</Badge> : null}
                    </button>
                    <div className="dd-nav-submenu" role="menu">
                      {group.items.map((item) => {
                        const SubIcon = item.icon;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => onSelect(item.id)}
                            className={cn(active === item.id && "is-active", item.locked && "is-locked")}
                            role="menuitem"
                          >
                            <SubIcon className="size-4 shrink-0" />
                            <span>{item.label}</span>
                            {item.locked ? <Badge tone="warn">lock</Badge> : null}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </nav>
          <button type="button" className="dd-web-nav__scroll" onClick={() => scrollNav(1)} aria-label="Ver mas modulos">
            <ChevronRight className="size-4" />
          </button>
          <button
            type="button"
            className="dd-web-nav__compact-toggle"
            onClick={() => setCompact((value) => !value)}
            aria-label={compact ? "Expandir contexto" : "Contraer contexto"}
            title={compact ? "Expandir contexto" : "Contraer contexto"}
          >
            {compact ? <PanelRightOpen className="size-4" /> : <PanelRightClose className="size-4" />}
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
