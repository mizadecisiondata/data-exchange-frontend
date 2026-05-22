# Data Exchange Frontend

Frontend bootstrap para Data Exchange de Decision Data.

## Stack objetivo

- Next.js + TypeScript.
- Tailwind CSS.
- Componentes equivalentes a shadcn/ui.
- TanStack Query.
- React Hook Form + Zod.
- Recharts para metricas.

Fase 0 usa un servidor Node.js minimo sin dependencias para validar estructura, rutas reservadas y contrato de salud. La implementacion Next.js real inicia cuando Mateo valide pasar a Fase 1.

## Separacion obligatoria

- Portal cliente: `src/app/client`.
- Portal admin: `src/app/admin`.
- Agent Workbench: `src/app/admin/agent-workbench`.

Agent Workbench no debe aparecer en el portal cliente.

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
- `GET /client`: portal cliente visual de Fase 1.
- `GET /admin`: portal admin visual de Fase 1.
- `GET /admin/agent-workbench`: vista viva local del Agent Workbench para visualizar avance simulado. No ejecuta agentes reales ni automatiza decisiones.
