import { z } from "zod";

export const reporterSectors = [
  "Telco / ISP",
  "Retail",
  "Casa comercial",
  "Concesionario",
  "Fintech",
  "Cobranza / BPO",
  "Industria / mayorista"
] as const;

export const commercialModes = [
  "Cliente Normal",
  "Data Partner Contributor",
  "Data Partner Active",
  "Data Partner Founding"
] as const;

export const registrationSchema = z.object({
  ruc: z.string().regex(/^\d{13}$/, "El RUC debe tener 13 digitos."),
  legalName: z.string().min(3, "La razon social es obligatoria."),
  contactName: z.string().min(3, "El contacto autorizado es obligatorio."),
  email: z.string().email("Correo corporativo no valido."),
  sector: z.enum(reporterSectors),
  mode: z.enum(commercialModes)
});

export type RegistrationInput = z.infer<typeof registrationSchema>;

export const requiredDocuments = [
  { id: "nda", label: "NDA firmado", blocking: true },
  { id: "master-agreement", label: "Contrato marco firmado", blocking: true },
  { id: "technical-annex", label: "Anexo tecnico / modalidad", blocking: true },
  { id: "ruc", label: "RUC actualizado", blocking: true },
  { id: "legal-appointment", label: "Nombramiento representante legal", blocking: true },
  { id: "legal-id", label: "Cedula representante legal", blocking: true },
  { id: "data-source", label: "Declaracion de fuente y legitimacion de datos", blocking: true },
  { id: "contacts", label: "Contacto tecnico, operativo y facturacion", blocking: false }
] as const;

export type RequiredDocumentId = (typeof requiredDocuments)[number]["id"];

export const initialDocumentState: Record<RequiredDocumentId, boolean> = {
  nda: true,
  "master-agreement": true,
  "technical-annex": true,
  ruc: false,
  "legal-appointment": false,
  "legal-id": false,
  "data-source": false,
  contacts: false
};

export const apiEndpoints = [
  { method: "POST", path: "/api/v1/queries", use: "Consulta individual" },
  { method: "POST", path: "/api/v1/batch-queries", use: "Consulta por bloque" },
  { method: "GET", path: "/api/v1/usage", use: "Consumo mensual" }
];

export const bacEvents = [
  {
    date: "2026-05-23 09:10",
    actor: "operaciones@megadatos.demo",
    channel: "portal",
    product: "Reporte completo",
    value: "$0.50",
    status: "Simulado"
  },
  {
    date: "2026-05-23 09:04",
    actor: "admin@decisiondata.ec",
    channel: "admin",
    product: "Observacion documental",
    value: "$0.00",
    status: "Registrado"
  }
];

