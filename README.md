# Data Exchange Frontend

Frontend bootstrap para Data Exchange de Decision Data.

## Stack objetivo

- Next.js + TypeScript.
- Tailwind CSS.
- Componentes equivalentes a shadcn/ui.
- TanStack Query.
- React Hook Form + Zod.
- Recharts para metricas.

Fase 2 inicia la migracion del prototipo visual a una app Next.js real con TypeScript, Tailwind v4, componentes estilo shadcn/Radix, TanStack, XState, Recharts, React Flow, Motion y Uppy. El estado estatico anterior quedo preservado en la rama `codex/checkpoint-fase-1-static-20260522`.

## Separacion obligatoria

- Portal cliente: `src/app/client`.
- Portal admin: `src/app/admin`.
- Visor externo de desarrollo: `src/app/internal/dev-monitor`.

Agent Workbench no pertenece al portal cliente ni al portal administrador productivo. La ruta local `/admin/agent-workbench` redirige al visor externo `/internal/dev-monitor`.

## Comandos

PowerShell:

```powershell
npm.cmd run dev
npm.cmd run health
npm.cmd run lint
npm.cmd run test
```

Bash/CI:

```bash
npm run dev
npm run health
npm run lint
npm run test
```

## Rutas bootstrap

- `GET /health`
- `GET /client`: portal cliente Next con login primero, autorregistro, cliente pendiente/aprobado, carga no productiva y navegacion posterior al acceso.
- `GET /admin`: portal admin Next con onboarding, clientes/modalidades, usuarios, ingesta, consumos/API, facturacion, BAC, notificaciones y configuracion.
- `GET /internal/dev-monitor`: visor externo del Agent Workbench para visualizar avance simulado. No ejecuta agentes reales ni automatiza decisiones.
- `GET /admin/agent-workbench`: redirige a `/internal/dev-monitor` por compatibilidad local.
- `GET /journey`: journey completo de aprobacion preproduccion para recorrer cliente, admin, ingesta, consulta, BAC, facturacion, API y checklist de Mateo.

## Autorregistro documental

El portal cliente incluye descarga visual de NDA, contrato marco generico y anexo tecnico/modalidad. El cliente firma esos documentos fuera de la plataforma y los carga junto con habilitantes para que administracion revise el expediente en `Onboarding clientes`.

## Rollback

Si el rediseño Next no gusta, volver al estado anterior:

```powershell
git fetch origin
git checkout codex/checkpoint-fase-1-static-20260522
```

Tambien se puede volver desde GitHub porque la rama checkpoint fue subida antes de iniciar esta migracion.
