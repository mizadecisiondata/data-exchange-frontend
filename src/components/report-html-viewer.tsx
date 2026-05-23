"use client";

import { ExternalLink, FileText, ShieldCheck } from "lucide-react";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import type { QueryAudit } from "@/lib/backend-api";

const reportSource = "/reports/reporte-ejemplo.html";

const reportFacts = {
  titular: "GALARZA MORALES CHRISTIAN EDUARDO",
  identificacion: "0923048581",
  fechaReporte: "2026-05-05",
  corte: "02-2026",
  score: 987,
  scoreLabel: "Sobresaliente",
  scoreGrade: "A+",
  pd12m: "1.1%",
  deudaTotal: 111870.67,
  porVencer: 111870.67,
  vencido: 0,
  operacionesActivas: 2,
  tarjetasTotal: 3,
  cuotaTotal: 4469.36,
  ingresoEstimado: 7437.75,
  dti: "61.9%",
  scoreSobre: "54/100",
  scoreSobreLabel: "Critico"
};

const currency = new Intl.NumberFormat("es-EC", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2
});

const summaryItems = [
  { label: "Score 12m", value: `${reportFacts.score} ${reportFacts.scoreGrade}`, detail: `${reportFacts.scoreLabel} - PD ${reportFacts.pd12m}`, tone: "ok" as const },
  { label: "Deuda total", value: currency.format(reportFacts.deudaTotal), detail: `${currency.format(reportFacts.porVencer)} por vencer`, tone: "info" as const },
  { label: "DTI", value: reportFacts.dti, detail: `Cuota ${currency.format(reportFacts.cuotaTotal)} / ingreso ${currency.format(reportFacts.ingresoEstimado)}`, tone: "warn" as const },
  { label: "Sobreendeudamiento", value: reportFacts.scoreSobre, detail: reportFacts.scoreSobreLabel, tone: "danger" as const }
];

export function ReportHtmlViewer({ latest }: { latest?: QueryAudit }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex-col items-start sm:flex-row">
        <div>
          <CardTitle>Reporte completo Decision Data</CardTitle>
          <p className="mt-1 text-sm text-muted">
            {reportFacts.titular} - {reportFacts.identificacion} - corte {reportFacts.corte}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone="ok">HTML completo</Badge>
          <Button asChild size="sm">
            <a href={reportSource} target="_blank" rel="noreferrer">
              <ExternalLink className="size-4" /> Abrir reporte
            </a>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-3 lg:grid-cols-4">
          {summaryItems.map((item) => (
            <div key={item.label} className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
              <Badge tone={item.tone}>{item.label}</Badge>
              <strong className="mt-3 block text-xl font-black text-primary">{item.value}</strong>
              <p className="mt-2 text-xs leading-5 text-muted">{item.detail}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
            <div className="flex items-start gap-3">
              <FileText className="mt-1 size-5 text-primary" />
              <div>
                <b className="text-sm">Resumen ejecutivo</b>
                <p className="mt-2 text-sm leading-6 text-muted">
                  El titular presenta score crediticio sobresaliente, sin vencido, castigo ni judicial en el corte del reporte.
                  La alerta principal esta en presion de flujo: DTI de {reportFacts.dti} y score de sobreendeudamiento {reportFacts.scoreSobre}.
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-1 size-5 text-primary" />
              <div>
                <b className="text-sm">Auditoria de consulta</b>
                {latest ? (
                  <p className="mt-2 text-sm leading-6 text-muted">
                    BAC {latest.bac}, consentimiento {latest.consent}, usuario {latest.user}, canal {latest.channel},
                    producto {latest.product}, tarifa {latest.tariff}, valor estimado {currency.format(latest.estimatedValue)}.
                  </p>
                ) : (
                  <p className="mt-2 text-sm leading-6 text-muted">
                    Ejecuta una consulta individual para registrar BAC, consentimiento, canal, producto, tarifa y valor estimado.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-white/10 bg-white">
          <iframe
            src={reportSource}
            title="Reporte individual completo Decision Data"
            className="h-[78vh] min-h-[780px] w-full bg-white"
          />
        </div>
      </CardContent>
    </Card>
  );
}
