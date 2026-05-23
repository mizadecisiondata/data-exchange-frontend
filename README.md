# Data Exchange Frontend

Frontend bootstrap para Data Exchange de Decision Data.

## Stack objetivo

- Next.js + TypeScript.
- Tailwind CSS.
- Componentes equivalentes a shadcn/ui.
- TanStack Query.
- React Hook Form + Zod.
- Recharts para metricas.

Fase 1 mantiene un servidor Node.js minimo sin dependencias para validar el journey visual, rutas reservadas y contrato de salud. La implementacion Next.js real inicia cuando Mateo valide pasar del prototipo visual a aplicacion productiva.

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
- `GET /client`: portal cliente visual de Fase 1 con login primero, autorregistro, cliente pendiente/aprobado, carga no productiva y navegacion posterior al acceso.
- `GET /admin`: portal admin visual de Fase 1 con login primero, onboarding, clientes/modalidades, usuarios, ingesta, consumos/API, facturacion, BAC, notificaciones y configuracion.
- `GET /internal/dev-monitor`: visor externo del Agent Workbench para visualizar avance simulado. No ejecuta agentes reales ni automatiza decisiones.
- `GET /admin/agent-workbench`: redirige a `/internal/dev-monitor` por compatibilidad local.
- `GET /journey`: journey completo de aprobacion preproduccion para recorrer cliente, admin, ingesta, consulta, BAC, facturacion, API y checklist de Mateo.

## Autorregistro documental

El portal cliente incluye descarga visual de NDA, contrato marco generico y anexo tecnico/modalidad. El cliente firma esos documentos fuera de la plataforma y los carga junto con habilitantes para que administracion revise el expediente en `Onboarding clientes`.
